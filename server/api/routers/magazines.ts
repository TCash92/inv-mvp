import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { magazineService, CreateMagazineSchema, UpdateMagazineSchema } from '../../../lib/services';

export const magazinesRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => {
    return magazineService.getAll();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      return magazineService.getById(input.id);
    }),

  create: protectedProcedure
    .input(CreateMagazineSchema)
    .mutation(async ({ input }) => {
      return magazineService.create(input);
    }),

  update: protectedProcedure
    .input(UpdateMagazineSchema)
    .mutation(async ({ input }) => {
      return magazineService.update(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return magazineService.delete(input.id);
    }),

  getCurrentCapacity: protectedProcedure
    .input(z.object({ magazineId: z.number() }))
    .query(async ({ input }) => {
      return magazineService.getCurrentCapacity(input.magazineId);
    }),

  validateCapacity: protectedProcedure
    .input(z.object({ 
      magazineId: z.number(), 
      productId: z.number(), 
      quantity: z.number() 
    }))
    .query(async ({ input }) => {
      return magazineService.validateCapacity(input.magazineId, input.productId, input.quantity);
    }),
});