import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { reconciliationService, CreateReconciliationSchema, ResolveReconciliationSchema } from '../../../lib/services';

export const reconciliationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(() => {
    return reconciliationService.getAll();
  }),

  getUnresolved: protectedProcedure.query(() => {
    return reconciliationService.getUnresolved();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      return reconciliationService.getById(input.id);
    }),

  getByMagazine: protectedProcedure
    .input(z.object({ magazineId: z.number() }))
    .query(({ input }) => {
      return reconciliationService.getByMagazine(input.magazineId);
    }),

  getByDateRange: protectedProcedure
    .input(z.object({ startDate: z.number(), endDate: z.number() }))
    .query(({ input }) => {
      return reconciliationService.getByDateRange(input.startDate, input.endDate);
    }),

  create: protectedProcedure
    .input(CreateReconciliationSchema.omit({ enteredByUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return reconciliationService.create({
        ...input,
        enteredByUserId: ctx.session.userId
      });
    }),

  resolve: protectedProcedure
    .input(ResolveReconciliationSchema.omit({ resolvedByUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return reconciliationService.resolve({
        ...input,
        resolvedByUserId: ctx.session.userId
      });
    }),

  validateReconciliationData: protectedProcedure
    .input(z.object({ 
      magazineId: z.number(), 
      productId: z.number(), 
      physicalCount: z.number() 
    }))
    .query(async ({ input }) => {
      return reconciliationService.validateReconciliationData(
        input.magazineId,
        input.productId,
        input.physicalCount
      );
    }),

  generateReport: protectedProcedure
    .input(z.object({
      magazineId: z.number().optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return reconciliationService.generateReconciliationReport(
        input.magazineId,
        input.startDate,
        input.endDate
      );
    }),
});