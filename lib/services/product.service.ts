import { Database } from 'better-sqlite3';
import { z } from 'zod';
import db from '../db';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(100),
  unNumber: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  compatibilityGroup: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'N', 'S']),
  explosiveType: z.enum(['I', 'II', 'III', 'B']), // I = Primary, II = Secondary, III = Propellant, B = Blasting Agent
  unit: z.enum(['each', 'kg', 'lb', 'box', 'case']),
  netExplosiveWeightPerUnitKg: z.number().nonnegative(),
  manufacturer: z.string().max(100).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.number().positive(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// UN Compatibility Group rules - which groups can be stored together
const COMPATIBILITY_MATRIX: Record<string, string[]> = {
  'A': [], // Cannot be stored with anything else
  'B': ['B', 'S'], // Can be stored with B and S
  'C': ['C', 'D', 'E', 'G', 'S'], // Can be stored with C, D, E, G, S
  'D': ['C', 'D', 'E', 'G', 'S'], // Can be stored with C, D, E, G, S
  'E': ['C', 'D', 'E', 'G', 'S'], // Can be stored with C, D, E, G, S
  'F': ['F', 'S'], // Can be stored with F and S
  'G': ['C', 'D', 'E', 'G', 'S'], // Can be stored with C, D, E, G, S
  'H': ['H', 'S'], // Can be stored with H and S
  'J': ['J', 'S'], // Can be stored with J and S
  'K': ['K', 'S'], // Can be stored with K and S
  'L': ['L', 'S'], // Can be stored with L and S
  'N': ['N', 'S'], // Can be stored with N and S
  'S': ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'N', 'S'], // Can be stored with most groups
};

export class ProductService {
  private db: Database;

  constructor(database: Database = db) {
    this.db = database;
  }

  async create(input: CreateProductInput) {
    const validated = CreateProductSchema.parse(input);
    
    // Check if UN number already exists
    const existing = this.db.prepare('SELECT id FROM products WHERE un_number = ?').get(validated.unNumber);
    if (existing) {
      throw new Error(`UN Number "${validated.unNumber}" already exists`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO products (name, un_number, description, compatibility_group, explosive_type, unit, net_explosive_weight_per_unit_kg, manufacturer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      validated.name,
      validated.unNumber,
      validated.description || null,
      validated.compatibilityGroup,
      validated.explosiveType,
      validated.unit,
      validated.netExplosiveWeightPerUnitKg,
      validated.manufacturer || null
    );

    return { id: result.lastInsertRowid, ...validated };
  }

  async update(input: UpdateProductInput) {
    const validated = UpdateProductSchema.parse(input);
    
    // Check if product exists
    const existing = this.db.prepare('SELECT * FROM products WHERE id = ?').get(validated.id);
    if (!existing) {
      throw new Error(`Product with id ${validated.id} not found`);
    }

    // Check if updating UN number would create duplicate
    if (validated.unNumber && validated.unNumber !== existing.un_number) {
      const duplicate = this.db.prepare('SELECT id FROM products WHERE un_number = ? AND id != ?').get(validated.unNumber, validated.id);
      if (duplicate) {
        throw new Error(`UN Number "${validated.unNumber}" already exists`);
      }
    }

    const updateFields = Object.entries(validated)
      .filter(([key, value]) => key !== 'id' && value !== undefined)
      .map(([key]) => `${this.camelToSnake(key)} = ?`);
    
    if (updateFields.length === 0) {
      throw new Error('No fields provided for update');
    }

    const stmt = this.db.prepare(`
      UPDATE products 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const values = Object.entries(validated)
      .filter(([key, value]) => key !== 'id' && value !== undefined)
      .map(([, value]) => value);
    
    values.push(validated.id);
    
    stmt.run(...values);
    
    return this.getById(validated.id!);
  }

  async delete(id: number) {
    // Check if product has any stock or transaction history
    const stockCheck = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory_transactions t
      WHERE t.product_id = ?
    `).get(id) as { count: number };

    if (stockCheck.count > 0) {
      throw new Error('Cannot delete product with transaction history. Consider archiving instead.');
    }

    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error(`Product with id ${id} not found`);
    }

    return { success: true };
  }

  getById(id: number) {
    const stmt = this.db.prepare('SELECT * FROM products WHERE id = ?');
    const product = stmt.get(id);
    
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    return product;
  }

  getAll() {
    const stmt = this.db.prepare('SELECT * FROM products ORDER BY name');
    return stmt.all();
  }

  getByCompatibilityGroup(compatibilityGroup: string) {
    const stmt = this.db.prepare('SELECT * FROM products WHERE compatibility_group = ? ORDER BY name');
    return stmt.all(compatibilityGroup);
  }

  validateCompatibility(productId: number, magazineId: number): { compatible: boolean; conflicts: string[]; reason?: string } {
    // Get the product's compatibility group
    const productStmt = this.db.prepare('SELECT compatibility_group FROM products WHERE id = ?');
    const product = productStmt.get(productId) as { compatibility_group: string };
    
    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    // Get all products currently in the magazine
    const existingProductsStmt = this.db.prepare(`
      SELECT DISTINCT p.compatibility_group, p.name
      FROM products p
      JOIN inventory_transactions t ON p.id = t.product_id
      WHERE (t.magazine_to_id = ? OR t.magazine_from_id = ?)
      GROUP BY p.id
      HAVING SUM(
        CASE t.type
          WHEN 'Receipt' THEN (CASE WHEN t.magazine_to_id = ? THEN t.quantity ELSE 0 END)
          WHEN 'TransferIn' THEN (CASE WHEN t.magazine_to_id = ? THEN t.quantity ELSE 0 END)
          WHEN 'AdjustIncrease' THEN (CASE WHEN t.magazine_to_id = ? THEN t.quantity ELSE 0 END)
          WHEN 'Issue' THEN (CASE WHEN t.magazine_from_id = ? THEN -t.quantity ELSE 0 END)
          WHEN 'TransferOut' THEN (CASE WHEN t.magazine_from_id = ? THEN -t.quantity ELSE 0 END)
          WHEN 'AdjustDecrease' THEN (CASE WHEN t.magazine_from_id = ? THEN -t.quantity ELSE 0 END)
          WHEN 'Destruction' THEN (CASE WHEN t.magazine_from_id = ? THEN -t.quantity ELSE 0 END)
          ELSE 0
        END
      ) > 0
    `);
    
    const existingProducts = existingProductsStmt.all(magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId);
    
    // If magazine is empty, any compatibility group is allowed
    if (existingProducts.length === 0) {
      return { compatible: true, conflicts: [] };
    }

    // Check compatibility with existing products
    const allowedGroups = COMPATIBILITY_MATRIX[product.compatibility_group] || [];
    const conflicts: string[] = [];

    for (const existingProduct of existingProducts) {
      if (!allowedGroups.includes(existingProduct.compatibility_group)) {
        conflicts.push(`${existingProduct.name} (Group ${existingProduct.compatibility_group})`);
      }
    }

    if (conflicts.length > 0) {
      return {
        compatible: false,
        conflicts,
        reason: `Compatibility Group ${product.compatibility_group} cannot be stored with: ${conflicts.join(', ')}`
      };
    }

    return { compatible: true, conflicts: [] };
  }

  async getCurrentStock(productId: number) {
    const stmt = this.db.prepare(`
      SELECT 
        m.id as magazine_id,
        m.name as magazine_name,
        m.code as magazine_code,
        COALESCE(SUM(
          CASE t.type
            WHEN 'Receipt' THEN (CASE WHEN t.magazine_to_id = m.id THEN t.quantity ELSE 0 END)
            WHEN 'TransferIn' THEN (CASE WHEN t.magazine_to_id = m.id THEN t.quantity ELSE 0 END)
            WHEN 'AdjustIncrease' THEN (CASE WHEN t.magazine_to_id = m.id THEN t.quantity ELSE 0 END)
            WHEN 'Issue' THEN (CASE WHEN t.magazine_from_id = m.id THEN -t.quantity ELSE 0 END)
            WHEN 'TransferOut' THEN (CASE WHEN t.magazine_from_id = m.id THEN -t.quantity ELSE 0 END)
            WHEN 'AdjustDecrease' THEN (CASE WHEN t.magazine_from_id = m.id THEN -t.quantity ELSE 0 END)
            WHEN 'Destruction' THEN (CASE WHEN t.magazine_from_id = m.id THEN -t.quantity ELSE 0 END)
            ELSE 0
          END
        ), 0) as current_quantity
      FROM magazines m
      LEFT JOIN inventory_transactions t ON (t.magazine_from_id = m.id OR t.magazine_to_id = m.id)
        AND t.product_id = ?
      GROUP BY m.id
      HAVING current_quantity > 0
      ORDER BY m.code
    `);
    
    return stmt.all(productId);
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export const productService = new ProductService();