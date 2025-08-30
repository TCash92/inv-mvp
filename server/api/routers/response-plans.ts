import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import db from "../../../lib/db";

export const responsePlansRouter = createTRPCRouter({
  getAll: protectedProcedure.query(() => {
    try {
      const getActivePlans = db.prepare(`
        SELECT 
          id,
          plan_type,
          file_name,
          file_path,
          file_size,
          uploaded_at,
          uploaded_by_user_id,
          version,
          is_active
        FROM response_plans 
        WHERE is_active = true
        ORDER BY plan_type, uploaded_at DESC
      `);
      
      const plans = getActivePlans.all();
      return plans;
    } catch (error) {
      console.error('Error fetching response plans:', error);
      throw new Error('Failed to fetch response plans');
    }
  }),

  getByType: protectedProcedure
    .input(z.object({
      planType: z.enum(['fire', 'security', 'erap'])
    }))
    .query(({ input }) => {
      try {
        const getPlan = db.prepare(`
          SELECT 
            id,
            plan_type,
            file_name,
            file_path,
            file_size,
            uploaded_at,
            uploaded_by_user_id,
            version,
            is_active
          FROM response_plans 
          WHERE plan_type = ? AND is_active = true
          ORDER BY uploaded_at DESC
          LIMIT 1
        `);
        
        const plan = getPlan.get(input.planType);
        return plan;
      } catch (error) {
        console.error('Error fetching response plan by type:', error);
        throw new Error('Failed to fetch response plan');
      }
    }),

  getHistory: protectedProcedure
    .input(z.object({
      planType: z.enum(['fire', 'security', 'erap']).optional()
    }))
    .query(({ input }) => {
      try {
        let query = `
          SELECT 
            id,
            plan_type,
            file_name,
            file_path,
            file_size,
            uploaded_at,
            uploaded_by_user_id,
            version,
            is_active
          FROM response_plans
        `;
        
        const params: any[] = [];
        
        if (input.planType) {
          query += ' WHERE plan_type = ?';
          params.push(input.planType);
        }
        
        query += ' ORDER BY uploaded_at DESC';
        
        const getPlansHistory = db.prepare(query);
        const plans = getPlansHistory.all(...params);
        return plans;
      } catch (error) {
        console.error('Error fetching response plans history:', error);
        throw new Error('Failed to fetch response plans history');
      }
    }),

  deactivate: protectedProcedure
    .input(z.object({
      planType: z.enum(['fire', 'security', 'erap'])
    }))
    .mutation(({ input, ctx }) => {
      try {
        // Start transaction
        const deactivatePlan = db.prepare(`
          UPDATE response_plans 
          SET is_active = false 
          WHERE plan_type = ? AND is_active = true
        `);

        const result = deactivatePlan.run(input.planType);

        if (result.changes === 0) {
          throw new Error('No active plan found to deactivate');
        }

        // Log the action
        const logAction = db.prepare(`
          INSERT INTO audit_logs (
            timestamp, actor_user_id, action, entity, entity_id, details
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        logAction.run(
          Date.now(),
          ctx.userId,
          'response_plan.deactivated',
          'response_plans',
          null,
          JSON.stringify({ plan_type: input.planType })
        );

        return {
          success: true,
          message: `${input.planType} plan deactivated successfully`
        };
      } catch (error) {
        console.error('Error deactivating response plan:', error);
        throw new Error('Failed to deactivate response plan');
      }
    }),

  getUploadStats: protectedProcedure.query(() => {
    try {
      const getStats = db.prepare(`
        SELECT 
          plan_type,
          COUNT(*) as total_uploads,
          MAX(uploaded_at) as last_uploaded,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_count
        FROM response_plans
        GROUP BY plan_type
        ORDER BY plan_type
      `);
      
      const stats = getStats.all();
      return stats;
    } catch (error) {
      console.error('Error fetching upload stats:', error);
      throw new Error('Failed to fetch upload statistics');
    }
  }),
});