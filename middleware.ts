import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
]);

export default function middleware(req: NextRequest) {
  // Bypass all authentication in testing mode
  console.log('TESTING_MODE:', process.env.TESTING_MODE);
  if (process.env.TESTING_MODE === 'true') {
    console.log('Testing mode: bypassing auth for', req.nextUrl.pathname);
    return NextResponse.next();
  }

  console.log('Production mode: using Clerk middleware');
  // Use normal Clerk middleware in production
  return clerkMiddleware(async (auth) => {
    // Protect all routes except public ones
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  })(req);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};