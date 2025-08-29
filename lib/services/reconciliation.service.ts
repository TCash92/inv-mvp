import { Database } from 'better-sqlite3';
import { z } from 'zod';
import db from '../db';
import { transactionService } from './transaction.service';

export const CreateReconciliationSchema = z.object({
  reconciliationDate: z.number(), // Unix timestamp
  magazineId: z.number().positive(),
  productId: z.number().positive(),
  physicalCount: z.number().nonnegative(),
  varianceReason: z.string().max(500).optional(),
  enteredByUserId: z.string(),
});

export const ResolveReconciliationSchema = z.object({
  id: z.number().positive(),
  resolutionNotes: z.string().min(1).max(1000),
  resolvedByUserId: z.string(),
});

export type CreateReconciliationInput = z.infer<typeof CreateReconciliationSchema>;
export type ResolveReconciliationInput = z.infer<typeof ResolveReconciliationSchema>;

export class ReconciliationService {
  private db: Database;

  constructor(database: Database = db) {
    this.db = database;
  }

  async create(input: CreateReconciliationInput) {
    const validated = CreateReconciliationSchema.parse(input);

    // Get system count at time of reconciliation
    const systemCount = transactionService.getCurrentStockByMagazineAndProduct(
      validated.magazineId,
      validated.productId
    );

    const variance = validated.physicalCount - systemCount.current_quantity;

    // Check if there's already an unresolved reconciliation for this magazine/product combination
    const existingUnresolved = this.db.prepare(`
      SELECT id FROM inventory_reconciliations 
      WHERE magazine_id = ? AND product_id = ? AND resolved = false
    `).get(validated.magazineId, validated.productId);

    if (existingUnresolved) {
      throw new Error(
        'There is already an unresolved reconciliation for this magazine and product combination. ' +
        'Please resolve the existing reconciliation before creating a new one.'
      );
    }

    const stmt = this.db.prepare(`
      INSERT INTO inventory_reconciliations 
      (reconciliation_date, magazine_id, product_id, physical_count, system_count_at_time, variance, variance_reason, entered_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      validated.reconciliationDate,
      validated.magazineId,
      validated.productId,
      validated.physicalCount,
      systemCount.current_quantity,
      variance,
      validated.varianceReason || null,
      validated.enteredByUserId
    );

    const reconciliation = {
      id: result.lastInsertRowid,
      ...validated,
      systemCountAtTime: systemCount.current_quantity,
      variance
    };

    // If there's a variance, automatically create an adjustment transaction
    // but mark the reconciliation as unresolved requiring manual review
    if (variance !== 0) {
      // Note: We don't automatically create adjustment transactions
      // This requires manual approval for audit trail purposes
      console.log(`Variance detected: ${variance} units. Reconciliation requires manual resolution.`);
    }

    return reconciliation;
  }

  async resolve(input: ResolveReconciliationInput) {
    const validated = ResolveReconciliationSchema.parse(input);

    // Get the reconciliation details
    const reconciliation = this.getById(validated.id);
    
    if (reconciliation.resolved) {
      throw new Error('Reconciliation is already resolved');
    }

    // If there's a variance, create adjustment transaction(s)
    if (reconciliation.variance !== 0) {
      const adjustmentType = reconciliation.variance > 0 ? 'increase' : 'decrease';
      const adjustmentQuantity = Math.abs(reconciliation.variance);
      
      const authNumber = `REC-${reconciliation.id}-ADJ`;
      const refNumber = `RECONCILIATION-${reconciliation.id}`;
      
      try {
        await transactionService.createAdjustment({
          transactionDate: Date.now(),
          magazineFromId: adjustmentType === 'decrease' ? reconciliation.magazine_id : undefined,
          magazineToId: adjustmentType === 'increase' ? reconciliation.magazine_id : undefined,
          productId: reconciliation.product_id,
          quantity: adjustmentQuantity,
          referenceNumber: refNumber,
          authorizationNumber: authNumber,
          notes: `Auto-generated adjustment from reconciliation #${reconciliation.id}: ${validated.resolutionNotes}`,
          enteredByUserId: validated.resolvedByUserId,
          adjustmentType
        });
      } catch (error) {
        throw new Error(`Failed to create adjustment transaction: ${error.message}`);
      }
    }

    // Mark reconciliation as resolved
    const stmt = this.db.prepare(`
      UPDATE inventory_reconciliations 
      SET resolved = true, resolved_by_user_id = ?, resolution_notes = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(validated.resolvedByUserId, validated.resolutionNotes, validated.id);

    return { success: true, adjustmentCreated: reconciliation.variance !== 0 };
  }

  getById(id: number) {
    const stmt = this.db.prepare(`
      SELECT 
        r.*,
        m.name as magazine_name,
        m.code as magazine_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_reconciliations r
      LEFT JOIN magazines m ON r.magazine_id = m.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.id = ?
    `);
    
    const reconciliation = stmt.get(id);
    
    if (!reconciliation) {
      throw new Error(`Reconciliation with id ${id} not found`);
    }

    return reconciliation;
  }

  getAll() {
    const stmt = this.db.prepare(`
      SELECT 
        r.*,
        m.name as magazine_name,
        m.code as magazine_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_reconciliations r
      LEFT JOIN magazines m ON r.magazine_id = m.id
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.reconciliation_date DESC
    `);
    return stmt.all();
  }

  getUnresolved() {
    const stmt = this.db.prepare(`
      SELECT 
        r.*,
        m.name as magazine_name,
        m.code as magazine_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_reconciliations r
      LEFT JOIN magazines m ON r.magazine_id = m.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.resolved = false
      ORDER BY r.reconciliation_date DESC
    `);
    return stmt.all();
  }

  getByMagazine(magazineId: number) {
    const stmt = this.db.prepare(`
      SELECT 
        r.*,
        m.name as magazine_name,
        m.code as magazine_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_reconciliations r
      LEFT JOIN magazines m ON r.magazine_id = m.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.magazine_id = ?
      ORDER BY r.reconciliation_date DESC
    `);
    return stmt.all(magazineId);
  }

  getByDateRange(startDate: number, endDate: number) {
    const stmt = this.db.prepare(`
      SELECT 
        r.*,
        m.name as magazine_name,
        m.code as magazine_code,
        p.name as product_name,
        p.un_number,
        p.unit
      FROM inventory_reconciliations r
      LEFT JOIN magazines m ON r.magazine_id = m.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.reconciliation_date >= ? AND r.reconciliation_date <= ?
      ORDER BY r.reconciliation_date DESC
    `);
    return stmt.all(startDate, endDate);
  }

  async generateReconciliationReport(magazineId?: number, startDate?: number, endDate?: number) {
    let whereClause = '';
    let params: any[] = [];

    if (magazineId) {
      whereClause += 'WHERE r.magazine_id = ?';
      params.push(magazineId);
    }

    if (startDate && endDate) {
      whereClause += magazineId ? ' AND ' : 'WHERE ';
      whereClause += 'r.reconciliation_date >= ? AND r.reconciliation_date <= ?';
      params.push(startDate, endDate);
    }

    const stmt = this.db.prepare(`
      SELECT 
        r.*,
        m.name as magazine_name,
        m.code as magazine_code,
        p.name as product_name,
        p.un_number,
        p.unit,
        CASE WHEN r.variance > 0 THEN 'Overage' 
             WHEN r.variance < 0 THEN 'Shortage' 
             ELSE 'No Variance' END as variance_type
      FROM inventory_reconciliations r
      LEFT JOIN magazines m ON r.magazine_id = m.id
      LEFT JOIN products p ON r.product_id = p.id
      ${whereClause}
      ORDER BY r.reconciliation_date DESC
    `);

    const reconciliations = stmt.all(...params);

    // Calculate summary statistics
    const totalReconciliations = reconciliations.length;
    const resolvedCount = reconciliations.filter(r => r.resolved).length;
    const unresolvedCount = totalReconciliations - resolvedCount;
    const varianceCount = reconciliations.filter(r => r.variance !== 0).length;
    const shortageCount = reconciliations.filter(r => r.variance < 0).length;
    const overageCount = reconciliations.filter(r => r.variance > 0).length;

    return {
      reconciliations,
      summary: {
        totalReconciliations,
        resolvedCount,
        unresolvedCount,
        varianceCount,
        shortageCount,
        overageCount,
        accuracyRate: totalReconciliations > 0 ? ((totalReconciliations - varianceCount) / totalReconciliations * 100).toFixed(2) + '%' : '0%'
      }
    };
  }

  async validateReconciliationData(magazineId: number, productId: number, physicalCount: number) {
    // Get current system count
    const systemCount = transactionService.getCurrentStockByMagazineAndProduct(magazineId, productId);
    
    // Calculate variance
    const variance = physicalCount - systemCount.current_quantity;
    const variancePercentage = systemCount.current_quantity > 0 
      ? (Math.abs(variance) / systemCount.current_quantity * 100).toFixed(2)
      : '0';

    // Determine if variance is significant (>5% or >10 units)
    const significantVariance = Math.abs(variance) > 10 || parseFloat(variancePercentage) > 5;

    return {
      systemCount: systemCount.current_quantity,
      physicalCount,
      variance,
      variancePercentage: variancePercentage + '%',
      significantVariance,
      requiresApproval: significantVariance
    };
  }
}

export const reconciliationService = new ReconciliationService();