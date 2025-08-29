import { Database } from 'better-sqlite3';
import { z } from 'zod';
import db from '../db';

export const CreateMagazineSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  maxNetExplosiveWeightKg: z.number().positive(),
  notes: z.string().optional(),
});

export const UpdateMagazineSchema = CreateMagazineSchema.partial().extend({
  id: z.number().positive(),
});

export type CreateMagazineInput = z.infer<typeof CreateMagazineSchema>;
export type UpdateMagazineInput = z.infer<typeof UpdateMagazineSchema>;

export class MagazineService {
  private db: Database;

  constructor(database: Database = db) {
    this.db = database;
  }

  async create(input: CreateMagazineInput) {
    const validated = CreateMagazineSchema.parse(input);
    
    // Check if magazine code already exists
    const existing = this.db.prepare('SELECT id FROM magazines WHERE code = ?').get(validated.code);
    if (existing) {
      throw new Error(`Magazine code "${validated.code}" already exists`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO magazines (code, name, location, max_net_explosive_weight_kg, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      validated.code,
      validated.name,
      validated.location,
      validated.maxNetExplosiveWeightKg,
      validated.notes || null
    );

    return { id: result.lastInsertRowid, ...validated };
  }

  async update(input: UpdateMagazineInput) {
    const validated = UpdateMagazineSchema.parse(input);
    
    // Check if magazine exists
    const existing = this.db.prepare('SELECT * FROM magazines WHERE id = ?').get(validated.id);
    if (!existing) {
      throw new Error(`Magazine with id ${validated.id} not found`);
    }

    // Check if updating code would create duplicate
    if (validated.code && validated.code !== existing.code) {
      const duplicate = this.db.prepare('SELECT id FROM magazines WHERE code = ? AND id != ?').get(validated.code, validated.id);
      if (duplicate) {
        throw new Error(`Magazine code "${validated.code}" already exists`);
      }
    }

    const updateFields = Object.entries(validated)
      .filter(([key, value]) => key !== 'id' && value !== undefined)
      .map(([key]) => `${this.camelToSnake(key)} = ?`);
    
    if (updateFields.length === 0) {
      throw new Error('No fields provided for update');
    }

    const stmt = this.db.prepare(`
      UPDATE magazines 
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
    // Check if magazine has any stock
    const stockCheck = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory_transactions t
      WHERE (t.magazine_from_id = ? OR t.magazine_to_id = ?)
    `).get(id, id) as { count: number };

    if (stockCheck.count > 0) {
      throw new Error('Cannot delete magazine with transaction history. Consider archiving instead.');
    }

    const stmt = this.db.prepare('DELETE FROM magazines WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error(`Magazine with id ${id} not found`);
    }

    return { success: true };
  }

  getById(id: number) {
    const stmt = this.db.prepare('SELECT * FROM magazines WHERE id = ?');
    const magazine = stmt.get(id);
    
    if (!magazine) {
      throw new Error(`Magazine with id ${id} not found`);
    }

    return magazine;
  }

  getAll() {
    const stmt = this.db.prepare('SELECT * FROM magazines ORDER BY code');
    return stmt.all();
  }

  async getCurrentCapacity(magazineId: number) {
    const stmt = this.db.prepare(`
      SELECT 
        m.max_net_explosive_weight_kg,
        COALESCE(SUM(
          p.net_explosive_weight_per_unit_kg * 
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
        ), 0) as current_net_weight_kg
      FROM magazines m
      LEFT JOIN inventory_transactions t ON (t.magazine_from_id = ? OR t.magazine_to_id = ?)
      LEFT JOIN products p ON t.product_id = p.id
      WHERE m.id = ?
      GROUP BY m.id
    `);
    
    return stmt.get(magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId);
  }

  async validateCapacity(magazineId: number, productId: number, quantity: number) {
    const capacity = await this.getCurrentCapacity(magazineId);
    const productStmt = this.db.prepare('SELECT net_explosive_weight_per_unit_kg FROM products WHERE id = ?');
    const product = productStmt.get(productId) as { net_explosive_weight_per_unit_kg: number };
    
    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    const additionalWeight = product.net_explosive_weight_per_unit_kg * quantity;
    const newTotalWeight = capacity.current_net_weight_kg + additionalWeight;
    
    if (newTotalWeight > capacity.max_net_explosive_weight_kg) {
      throw new Error(
        `Magazine capacity exceeded. Current: ${capacity.current_net_weight_kg}kg, ` +
        `Max: ${capacity.max_net_explosive_weight_kg}kg, ` +
        `Adding: ${additionalWeight}kg would result in ${newTotalWeight}kg`
      );
    }

    return {
      canAccommodate: true,
      currentWeight: capacity.current_net_weight_kg,
      maxWeight: capacity.max_net_explosive_weight_kg,
      additionalWeight,
      newTotalWeight
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export const magazineService = new MagazineService();