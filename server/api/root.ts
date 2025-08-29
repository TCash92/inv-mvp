import { createTRPCRouter } from './trpc';
import { magazinesRouter } from './routers/magazines';
import { productsRouter } from './routers/products';
import { transactionsRouter } from './routers/transactions';
import { stockRouter } from './routers/stock';
import { reconciliationRouter } from './routers/reconciliation';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  magazines: magazinesRouter,
  products: productsRouter,
  transactions: transactionsRouter,
  stock: stockRouter,
  reconciliation: reconciliationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;