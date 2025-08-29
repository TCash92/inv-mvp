import { Database } from 'better-sqlite3';
import { z } from 'zod';
import db from '../db';
import { magazineService } from './magazine.service';
import { productService } from './product.service';

export const TransactionType = z.enum([
  'Receipt',
  'Issue', 
  'TransferOut',
  'TransferIn',
  'AdjustIncrease',
  'AdjustDecrease',
  'Destruction'
]);

export const CreateTransactionSchema = z.object({
  transactionDate: z.number(), // Unix timestamp
  type: TransactionType,
  magazineFromId: z.number().positive().optional(),
  magazineToId: z.number().positive().optional(),
  productId: z.number().positive(),
  quantity: z.number().positive(),
  referenceNumber: z.string().min(1).max(50),
  authorizationNumber: z.string().min(1).max(50),
  notes: z.string().max(1000).optional(),
  enteredByUserId: z.string(),
});

export const TransferTransactionSchema = z.object({
  transactionDate: z.number(),
  magazineFromId: z.number().positive(),
  magazineToId: z.number().positive(),
  productId: z.number().positive(),
  quantity: z.number().positive(),
  referenceNumber: z.string().min(1).max(50),
  authorizationNumber: z.string().min(1).max(50),
  notes: z.string().max(1000).optional(),
  enteredByUserId: z.string(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type TransferTransactionInput = z.infer<typeof TransferTransactionSchema>;

export class TransactionService {
  private db: Database;

  constructor(database: Database = db) {
    this.db = database;
  }

  async createReceipt(input: Omit<CreateTransactionInput, 'type' | 'magazineFromId'>) {
    if (!input.magazineToId) {
      throw new Error('Magazine destination is required for receipts');
    }

    const validated = CreateTransactionSchema.parse({
      ...input,
      type: 'Receipt',
    });

    // Validate magazine capacity
    await magazineService.validateCapacity(input.magazineToId, input.productId, input.quantity);

    // Validate product compatibility
    const compatibility = productService.validateCompatibility(input.productId, input.magazineToId);
    if (!compatibility.compatible) {
      throw new Error(`Compatibility error: ${compatibility.reason}`);
    }

    return this.createTransaction(validated);
  }

  async createIssue(input: Omit<CreateTransactionInput, 'type' | 'magazineToId'>) {
    if (!input.magazineFromId) {
      throw new Error('Magazine source is required for issues');
    }

    const validated = CreateTransactionSchema.parse({
      ...input,
      type: 'Issue',
    });

    // Validate sufficient stock
    await this.validateStockAvailability(input.magazineFromId, input.productId, input.quantity);

    return this.createTransaction(validated);
  }

  async createTransfer(input: TransferTransactionInput) {
    const validated = TransferTransactionSchema.parse(input);

    if (validated.magazineFromId === validated.magazineToId) {
      throw new Error('Source and destination magazines cannot be the same');
    }

    // Validate sufficient stock in source magazine
    await this.validateStockAvailability(validated.magazineFromId, validated.productId, validated.quantity);

    // Validate destination magazine capacity
    await magazineService.validateCapacity(validated.magazineToId, validated.productId, validated.quantity);

    // Validate product compatibility with destination magazine
    const compatibility = productService.validateCompatibility(validated.productId, validated.magazineToId);
    if (!compatibility.compatible) {
      throw new Error(`Compatibility error: ${compatibility.reason}`);
    }

    // Create both transactions atomically
    const transaction = this.db.transaction((transferInput: TransferTransactionInput) => {
      // Create TransferOut transaction
      const transferOut = this.createTransaction({
        ...transferInput,
        type: 'TransferOut' as const,
        magazineFromId: transferInput.magazineFromId,
        magazineToId: undefined,
      });

      // Create TransferIn transaction
      const transferIn = this.createTransaction({
        ...transferInput,
        type: 'TransferIn' as const,
        magazineFromId: undefined,
        magazineToId: transferInput.magazineToId,
      });

      return { transferOut, transferIn };
    });

    return transaction(validated);
  }

  async createAdjustment(input: Omit<CreateTransactionInput, 'type'> & { adjustmentType: 'increase' | 'decrease' }) {
    const type = input.adjustmentType === 'increase' ? 'AdjustIncrease' : 'AdjustDecrease';
    
    let validated: CreateTransactionInput;
    
    if (input.adjustmentType === 'increase') {
      if (!input.magazineToId) {
        throw new Error('Magazine destination is required for stock increases');
      }
      
      // Validate magazine capacity for increases
      await magazineService.validateCapacity(input.magazineToId, input.productId, input.quantity);
      
      // Validate compatibility for increases
      const compatibility = productService.validateCompatibility(input.productId, input.magazineToId);
      if (!compatibility.compatible) {
        throw new Error(`Compatibility error: ${compatibility.reason}`);
      }

      validated = CreateTransactionSchema.parse({
        ...input,
        type,
        magazineFromId: undefined,
      });
    } else {
      if (!input.magazineFromId) {
        throw new Error('Magazine source is required for stock decreases');
      }
      
      // Validate sufficient stock for decreases
      await this.validateStockAvailability(input.magazineFromId, input.productId, input.quantity);

      validated = CreateTransactionSchema.parse({
        ...input,
        type,
        magazineToId: undefined,
      });
    }

    return this.createTransaction(validated);
  }

  async createDestruction(input: Omit<CreateTransactionInput, 'type' | 'magazineToId'>) {
    if (!input.magazineFromId) {
      throw new Error('Magazine source is required for destruction');
    }

    const validated = CreateTransactionSchema.parse({
      ...input,
      type: 'Destruction',
    });

    // Validate sufficient stock
    await this.validateStockAvailability(input.magazineFromId, input.productId, input.quantity);

    return this.createTransaction(validated);
  }

  private createTransaction(input: CreateTransactionInput) {
    const stmt = this.db.prepare(`
      INSERT INTO inventory_transactions 
      (transaction_date, type, magazine_from_id, magazine_to_id, product_id, quantity, reference_number, authorization_number, notes, entered_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      input.transactionDate,
      input.type,
      input.magazineFromId || null,
      input.magazineToId || null,
      input.productId,
      input.quantity,
      input.referenceNumber,
      input.authorizationNumber,
      input.notes || null,
      input.enteredByUserId
    );

    return { id: result.lastInsertRowid, ...input };
  }

  private async validateStockAvailability(magazineId: number, productId: number, requiredQuantity: number) {
    const currentStock = this.getCurrentStockByMagazineAndProduct(magazineId, productId);
    
    if (currentStock.current_quantity < requiredQuantity) {
      const magazine = magazineService.getById(magazineId);
      const product = productService.getById(productId);
      throw new Error(
        `Insufficient stock. Available: ${currentStock.current_quantity} ${currentStock.unit}, ` +
        `Required: ${requiredQuantity} ${currentStock.unit} ` +
        `(Product: ${product.name}, Magazine: ${magazine.code})`
      );
    }

    return currentStock;
  }

  getCurrentStockByMagazineAndProduct(magazineId: number, productId: number) {
    const stmt = this.db.prepare(`
      SELECT 
        p.unit,
        COALESCE(SUM(
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
        ), 0) as current_quantity
      FROM products p
      LEFT JOIN inventory_transactions t ON t.product_id = p.id
        AND (t.magazine_from_id = ? OR t.magazine_to_id = ?)
      WHERE p.id = ?
      GROUP BY p.id
    `);
    
    const result = stmt.get(magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, magazineId, productId);
    
    if (!result) {
      const product = productService.getById(productId);
      return { current_quantity: 0, unit: product.unit };
    }
    
    return result;
  }

  getAll() {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        mf.name as magazine_from_name,
        mf.code as magazine_from_code,
        mt.name as magazine_to_name,
        mt.code as magazine_to_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_transactions t
      LEFT JOIN magazines mf ON t.magazine_from_id = mf.id
      LEFT JOIN magazines mt ON t.magazine_to_id = mt.id
      LEFT JOIN products p ON t.product_id = p.id
      ORDER BY t.transaction_date DESC
    `);
    return stmt.all();
  }

  getById(id: number) {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        mf.name as magazine_from_name,
        mf.code as magazine_from_code,
        mt.name as magazine_to_name,
        mt.code as magazine_to_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_transactions t
      LEFT JOIN magazines mf ON t.magazine_from_id = mf.id
      LEFT JOIN magazines mt ON t.magazine_to_id = mt.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `);
    
    const transaction = stmt.get(id);
    
    if (!transaction) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    return transaction;
  }

  getByDateRange(startDate: number, endDate: number) {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        mf.name as magazine_from_name,
        mf.code as magazine_from_code,
        mt.name as magazine_to_name,
        mt.code as magazine_to_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_transactions t
      LEFT JOIN magazines mf ON t.magazine_from_id = mf.id
      LEFT JOIN magazines mt ON t.magazine_to_id = mt.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.transaction_date >= ? AND t.transaction_date <= ?
      ORDER BY t.transaction_date DESC
    `);
    return stmt.all(startDate, endDate);
  }

  getByMagazine(magazineId: number) {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        mf.name as magazine_from_name,
        mf.code as magazine_from_code,
        mt.name as magazine_to_name,
        mt.code as magazine_to_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_transactions t
      LEFT JOIN magazines mf ON t.magazine_from_id = mf.id
      LEFT JOIN magazines mt ON t.magazine_to_id = mt.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.magazine_from_id = ? OR t.magazine_to_id = ?
      ORDER BY t.transaction_date DESC
    `);
    return stmt.all(magazineId, magazineId);
  }

  async validateAuthorizationNumber(authNumber: string, transactionType: string): Promise<boolean> {
    // This is a placeholder for authorization validation logic
    // In a real system, this would check against an authorization database
    // or external API to verify the authorization is valid and not expired
    
    if (!authNumber || authNumber.length < 5) {
      throw new Error('Authorization number must be at least 5 characters');
    }

    // Example validation: Check if auth number follows expected pattern
    const authPattern = /^AUTH-\d{3,}$/;
    if (!authPattern.test(authNumber)) {
      throw new Error('Authorization number must follow format: AUTH-XXX (where X is digits)');
    }

    return true;
  }
}

export const transactionService = new TransactionService();