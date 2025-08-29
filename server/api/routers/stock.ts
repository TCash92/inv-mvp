import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const stockRouter = createTRPCRouter({
  getCurrentStock: publicProcedure.query(({ ctx }) => {
    // Calculate current stock by summing transactions
    const stmt = ctx.db.prepare(`
      SELECT 
        m.id as magazine_id,
        m.name as magazine_name,
        m.code as magazine_code,
        p.id as product_id,
        p.name as product_name,
        p.un_number,
        p.compatibility_group,
        p.unit,
        COALESCE(SUM(
          CASE t.type
            WHEN 'Receipt' THEN t.quantity
            WHEN 'TransferIn' THEN t.quantity
            WHEN 'AdjustIncrease' THEN t.quantity
            WHEN 'Issue' THEN -t.quantity
            WHEN 'TransferOut' THEN -t.quantity
            WHEN 'AdjustDecrease' THEN -t.quantity
            WHEN 'Destruction' THEN -t.quantity
            ELSE 0
          END
        ), 0) as current_quantity,
        COALESCE(p.net_explosive_weight_per_unit_kg * SUM(
          CASE t.type
            WHEN 'Receipt' THEN t.quantity
            WHEN 'TransferIn' THEN t.quantity
            WHEN 'AdjustIncrease' THEN t.quantity
            WHEN 'Issue' THEN -t.quantity
            WHEN 'TransferOut' THEN -t.quantity
            WHEN 'AdjustDecrease' THEN -t.quantity
            WHEN 'Destruction' THEN -t.quantity
            ELSE 0
          END
        ), 0) as net_explosive_weight
      FROM magazines m
      CROSS JOIN products p
      LEFT JOIN inventory_transactions t ON (
        (t.magazine_to_id = m.id OR t.magazine_from_id = m.id) AND t.product_id = p.id
      )
      GROUP BY m.id, p.id
      HAVING current_quantity > 0
      ORDER BY m.code, p.name
    `);
    return stmt.all();
  }),

  getStockByMagazine: publicProcedure
    .input(z.object({ magazineId: z.number() }))
    .query(({ input, ctx }) => {
      const stmt = ctx.db.prepare(`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.un_number,
          p.compatibility_group,
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
        GROUP BY p.id
        HAVING current_quantity > 0
        ORDER BY p.name
      `);
      return stmt.all(input.magazineId, input.magazineId, input.magazineId, input.magazineId, input.magazineId, input.magazineId, input.magazineId, input.magazineId, input.magazineId);
    }),
});