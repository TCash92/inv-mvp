# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **industrial team webapp MVP** built for internal use in field/industrial environments. The application is designed for mobile-first access via IP:port on VPS and optimized for challenging conditions (bright light, protective gear, outdoor use).

**Tech Stack:**
- **Frontend:** Next.js with App Router (React)
- **Authentication:** Clerk (@clerk/nextjs v6.31.6)
- **Database:** SQLite with better-sqlite3
- **API Layer:** tRPC for type-safe API calls
- **State Management:** Zustand for client state, @tanstack/react-query for server state
- **Styling:** Tailwind CSS with industrial/high-contrast design principles
- **Forms:** React Hook Form with Zod validation

## Architecture

### Database
- **SQLite Database:** Located at `data/app.db`
- **Connection:** Uses better-sqlite3 with WAL mode enabled for better concurrency
- **User Sync:** Clerk webhooks automatically sync user data to local SQLite tables
- **Permissions:** Database files must have 600 permissions in production

### Authentication Flow
- **Clerk Integration:** Handles all authentication (login/signup/sessions)
- **User Sync:** Webhook at `/api/webhooks/clerk` syncs user data to SQLite
- **Session Management:** 60-second session tokens with automatic refresh

### API Architecture
- **tRPC:** Type-safe API layer with routers for different domains
- **Server Actions:** Next.js App Router API routes under `/app/api/`
- **Rate Limiting:** 100 requests per minute per user on protected endpoints

## Development Commands

Since this project uses the standard Next.js structure, use these commands:

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting (if configured)
npm run lint

# Type checking (if configured)
npm run typecheck
```

## Key Files and Directories

- `data/app.db` - SQLite database (create with 600 permissions)
- `app/api/webhooks/clerk/` - Clerk webhook handler for user sync
- `lib/db.ts` - Database connection and utilities
- `server/api/` - tRPC router definitions
- `components/ui/` - Reusable UI components optimized for industrial use

## Development Guidelines

### Mobile-First Industrial Design
- **Touch Targets:** Minimum 44pt/48dp, larger for primary actions (56-64pt)
- **Spacing:** Generous spacing between interactive elements (8-12dp minimum)
- **Colors:** High-contrast palette with ANSI safety color semantics
- **Typography:** Bold, humanist sans-serif (≥500 weight) with generous sizing

### Security Requirements
- **Database Permissions:** Always use 600 permissions on .db files
- **Authentication:** All API routes must verify Clerk session tokens
- **Input Validation:** Use Zod schemas for all user inputs
- **Headers:** Implement security headers (X-Frame-Options, CSP, etc.)

### Code Conventions
- **TypeScript:** Strict typing throughout
- **Error Handling:** Use proper error boundaries and validation
- **Async Operations:** Use React Query for server state management
- **Forms:** React Hook Form with Zod resolvers

### Clerk Integration Requirements (CRITICAL)
- **Middleware:** MUST use `clerkMiddleware()` from `@clerk/nextjs/server` in `middleware.ts`
- **Provider:** Wrap app with `<ClerkProvider>` in `app/layout.tsx` (App Router only)
- **Imports:** Use `@clerk/nextjs` for components and `@clerk/nextjs/server` for server functions
- **Auth Methods:** Use `auth()` from `@clerk/nextjs/server` with async/await pattern
- **NEVER use:** `authMiddleware()`, `_app.tsx` patterns, or pages router approaches

## Environment Setup

Required environment variables:
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_PATH=./data/app.db

# Next.js URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

## Database Schema

The application uses a user sync pattern where Clerk handles authentication and user data is replicated to local SQLite tables:

- `users` - Core user data synced from Clerk
- `user_profiles` - Extended profile information specific to the application

## Deployment Notes

- **Platform:** Ubuntu 24.04 LTS VPS
- **Process Manager:** PM2 for production deployment
- **Reverse Proxy:** Nginx with SSL termination
- **Security:** UFW firewall, SSH hardening, automated security updates

## Performance Optimizations

- **SQLite:** WAL mode enabled, PRAGMA optimizations applied
- **Caching:** React Query for server state caching
- **Bundle:** Next.js automatic optimizations, image optimization enabled
- **PWA:** Progressive Web App capabilities for offline-first experience

## Testing Strategy

Check the codebase for existing test configurations. Common patterns:
- **Unit Tests:** For utility functions and components
- **Integration Tests:** For API routes and database operations
- **E2E Tests:** For critical user flows

Always run tests before deployment and ensure all security validations pass.