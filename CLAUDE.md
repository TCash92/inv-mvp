# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **explosives inventory management system MVP** built for industrial teams in field/explosive storage environments. The application provides audit-ready tracking of explosives across storage magazines, supporting daily operations (receive, issue, transfer, adjust, destroy), monthly reconciliations, and compliance reporting. Designed for mobile-first access via IP:port on VPS and optimized for challenging conditions (bright light, protective gear, outdoor use).

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

### Field-Specific Considerations
- **Glove-Friendly Interface**: All touch targets sized for work gloves (minimum 56pt)
- **High Visibility Design**: Strong contrast ratios for outdoor visibility and safety glasses
- **Error Prevention**: Clear visual feedback and confirmation dialogs for critical actions
- **Offline Capability**: Cache critical data for offline access during network outages
- **Two-Tap Workflows**: Minimize interaction complexity for common operations
- **Quick Access**: Emergency read-only views for current stock and recent transactions

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

The application uses a user sync pattern where Clerk handles authentication and user data is replicated to local SQLite tables. The explosives inventory system requires the following core tables:

### Core Tables

#### 1) magazines
- `code` (string, unique) - Human-readable code like "M-01"
- `name` (string) - Magazine display name
- `location` (string) - Site/GPS/address information
- `maxNetExplosiveWeightKg` (number) - Maximum explosive capacity
- `notes` (string, optional) - Additional information
- Indexes: by_code, by_location

#### 2) products
- `name` (string) - Product name
- `unNumber` (string) - UN classification like "UN 0241"
- `description` (string) - Product description
- `compatibilityGroup` (string) - Compatibility group like "D"
- `explosiveType` (string) - Type like "E/I"
- `unit` (string) - Unit of measure like "kg", "cartridge"
- `netExplosiveWeightPerUnitKg` (number, optional) - Weight per unit
- `manufacturer` (string, optional) - Manufacturer name
- Indexes: by_unNumber, by_name

#### 3) employee_profiles
- `userId` (string) - Clerk user ID
- `approvalId` (string) - Approval document ID
- `approvalExpiresAt` (number, ms) - Approval expiration timestamp
- `active` (boolean) - Active status
- Indexes: by_user, by_active

#### 4) inventory_transactions (ledger)
- `transactionDate` (number, ms) - User-entered transaction date
- `type` (literal) - "Receipt" | "Issue" | "TransferOut" | "TransferIn" | "AdjustIncrease" | "AdjustDecrease" | "Destruction"
- `magazineFromId` (id("magazines"), optional) - Source magazine
- `magazineToId` (id("magazines"), optional) - Destination magazine
- `productId` (id("products")) - Product reference
- `quantity` (number) - Quantity in product units
- `referenceNumber` (string, optional) - PO/waybill/blast log number
- `authorizationNumber` (string, optional) - Authorization reference
- `notes` (string, optional) - Additional notes
- `enteredByUserId` (string) - Clerk user ID of person who entered transaction
- `attachments` (array(fileStorageId), optional) - Photos/documents
- Indexes: by_date, by_product, by_mag_from, by_mag_to, by_user

#### 5) inventory_reconciliations
- `reconciliationDate` (number, ms) - Reconciliation date
- `magazineId` (id("magazines")) - Magazine reference
- `productId` (id("products")) - Product reference
- `physicalCount` (number) - Physical count result
- `systemCountAtTime` (number) - System count at reconciliation time
- `variance` (number) - Difference (physical - system)
- `varianceReason` (string, optional) - Reason for variance
- `enteredByUserId` (string) - User who performed reconciliation
- `attachments` (array(fileStorageId), optional) - Supporting photos
- `resolved` (boolean, default false) - Variance resolution status
- `resolvedByUserId` (string, optional) - User who resolved variance
- `resolutionNotes` (string, optional) - Resolution notes
- Indexes: by_mag_date, by_product_date, by_variance

#### 6) audit_logs
- `ts` (number, ms) - Timestamp
- `actorUserId` (string) - Clerk user ID performing action
- `action` (string) - Action type like "transaction.create", "reconciliation.resolve"
- `entity` (string) - Entity type like "inventory_transactions"
- `entityId` (id("")) - Entity ID
- `details` (object) - Minimal diff/summary of changes
- Indexes: by_ts, by_actor, by_entity

### User Tables
- `users` - Core user data synced from Clerk
- `user_profiles` - Extended profile information specific to the application

## Domain-Specific Requirements

### Explosives Compliance
- **UN Classification**: All products must have valid UN numbers and compatibility groups
- **Authorization Tracking**: All transactions require authorization numbers for regulatory compliance
- **Approval Management**: Employee approvals must be tracked with expiration dates
- **Audit Trail**: Complete audit trail required for all inventory movements and changes

### Safety Validations
- **Magazine Capacity**: Validate that magazine capacity limits are never exceeded
- **Compatibility Groups**: Ensure only compatible explosives are stored together
- **Quantity Validation**: All quantities must be positive for receipts/adjustments
- **Date Validation**: Transaction dates cannot be in the future
- **Authorization Checks**: Verify user approvals are current and active

### Transaction Types
- **Receipt**: Incoming inventory to a magazine
- **Issue**: Outgoing inventory from a magazine for use
- **TransferOut/TransferIn**: Movement between magazines
- **AdjustIncrease/AdjustDecrease**: Inventory adjustments with justification
- **Destruction**: Disposal of expired or damaged explosives

### Reconciliation Process
- **Monthly Reconciliation**: Physical counts vs system counts for each magazine/product combination
- **Variance Tracking**: Automatic calculation and tracking of discrepancies
- **Resolution Workflow**: Manager approval process for resolving variances
- **Supporting Documentation**: Photo and document attachment capabilities

## Key Business Logic

### Stock Calculation
- **Ledger-Based Inventory**: Current stock calculated by summing all transactions for each magazine/product combination
- **Real-Time Updates**: Stock levels update immediately upon transaction entry
- **Historical Accuracy**: System maintains complete transaction history for audit purposes

### Validation Rules
- **Future Date Prevention**: Transaction dates cannot exceed current date
- **Positive Quantity Enforcement**: Receipts and adjustments must have positive quantities
- **Magazine Capacity Checks**: Validate total explosive weight doesn't exceed magazine limits
- **Sufficient Stock Validation**: Issues and transfers require adequate stock levels
- **Authorization Verification**: All transactions require valid authorization numbers

### Data Integrity
- **Atomic Transactions**: All database operations must be atomic to prevent data corruption
- **Referential Integrity**: Foreign key constraints prevent orphaned records
- **Audit Logging**: Every create/update/delete operation logged with user and timestamp
- **Concurrency Control**: Handle multiple users accessing same inventory simultaneously

## Views and Reports

### Core Views
- **Current Stock Levels**: Real-time inventory by magazine and product with running totals
- **Recent Transactions**: Last 50 transactions with full details and user information
- **Reconciliation Dashboard**: Outstanding variances requiring manager attention
- **Magazine Utilization**: Capacity usage by magazine with safety thresholds

### Audit Reports
- **Transaction History**: Filterable by date range, magazine, product, or transaction type
- **Stock Movement Report**: Detailed movement history for specific products
- **Reconciliation Summary**: Monthly reconciliation results with variance analysis
- **Compliance Report**: Authorization tracking and approval status

### Export Capabilities
- **CSV Exports**: All reports exportable to CSV for external audit systems
- **Period Reports**: Generate reports for specific date ranges
- **Magazine Reports**: Individual magazine activity summaries
- **Product Reports**: Product-specific transaction and stock histories

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
- Always use port 3000 when using npm run dev