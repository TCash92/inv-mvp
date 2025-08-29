import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { transactionService, CreateTransactionSchema, TransferTransactionSchema } from '../../../lib/services';

export const transactionsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(() => {
    return transactionService.getAll();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      return transactionService.getById(input.id);
    }),

  getByDateRange: protectedProcedure
    .input(z.object({ startDate: z.number(), endDate: z.number() }))
    .query(({ input }) => {
      return transactionService.getByDateRange(input.startDate, input.endDate);
    }),

  getByMagazine: protectedProcedure
    .input(z.object({ magazineId: z.number() }))
    .query(({ input }) => {
      return transactionService.getByMagazine(input.magazineId);
    }),

  createReceipt: protectedProcedure
    .input(z.object({
      transactionDate: z.number(),
      magazineToId: z.number(),
      productId: z.number(),
      quantity: z.number().positive(),
      referenceNumber: z.string(),
      authorizationNumber: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return transactionService.createReceipt({
        ...input,
        enteredByUserId: ctx.session.userId
      });
    }),

  createIssue: protectedProcedure
    .input(z.object({
      transactionDate: z.number(),
      magazineFromId: z.number(),
      productId: z.number(),
      quantity: z.number().positive(),
      referenceNumber: z.string(),
      authorizationNumber: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return transactionService.createIssue({
        ...input,
        enteredByUserId: ctx.session.userId
      });
    }),

  createTransfer: protectedProcedure
    .input(TransferTransactionSchema.omit({ enteredByUserId: true }))
    .mutation(async ({ input, ctx }) => {
      return transactionService.createTransfer({
        ...input,
        enteredByUserId: ctx.session.userId
      });
    }),

  createAdjustment: protectedProcedure
    .input(z.object({
      transactionDate: z.number(),
      adjustmentType: z.enum(['increase', 'decrease']),
      magazineFromId: z.number().optional(),
      magazineToId: z.number().optional(),
      productId: z.number(),
      quantity: z.number().positive(),
      referenceNumber: z.string(),
      authorizationNumber: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return transactionService.createAdjustment({
        ...input,
        enteredByUserId: ctx.session.userId
      });
    }),

  createDestruction: protectedProcedure
    .input(z.object({
      transactionDate: z.number(),
      magazineFromId: z.number(),
      productId: z.number(),
      quantity: z.number().positive(),
      referenceNumber: z.string(),
      authorizationNumber: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return transactionService.createDestruction({
        ...input,
        enteredByUserId: ctx.session.userId
      });
    }),

  getCurrentStock: protectedProcedure
    .input(z.object({ magazineId: z.number(), productId: z.number() }))
    .query(({ input }) => {
      return transactionService.getCurrentStockByMagazineAndProduct(input.magazineId, input.productId);
    }),
});