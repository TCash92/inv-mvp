import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { productService, CreateProductSchema, UpdateProductSchema } from '../../../lib/services';

export const productsRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => {
    return productService.getAll();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      return productService.getById(input.id);
    }),

  getByCompatibilityGroup: publicProcedure
    .input(z.object({ compatibilityGroup: z.string() }))
    .query(({ input }) => {
      return productService.getByCompatibilityGroup(input.compatibilityGroup);
    }),

  create: protectedProcedure
    .input(CreateProductSchema)
    .mutation(async ({ input }) => {
      return productService.create(input);
    }),

  update: protectedProcedure
    .input(UpdateProductSchema)
    .mutation(async ({ input }) => {
      return productService.update(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return productService.delete(input.id);
    }),

  validateCompatibility: protectedProcedure
    .input(z.object({ productId: z.number(), magazineId: z.number() }))
    .query(({ input }) => {
      return productService.validateCompatibility(input.productId, input.magazineId);
    }),

  getCurrentStock: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return productService.getCurrentStock(input.productId);
    }),
});