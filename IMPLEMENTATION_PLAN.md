# Explosives Inventory System MVP - Implementation Plan

## Project Overview
Building a mobile-first, audit-ready explosives inventory management system for field staff. The system tracks stock across magazines, supports daily operations (receive, issue, transfer, adjust, destroy), performs monthly reconciliations, and generates auditor-friendly records and exports. Optimized for compliance, field usability, and complete traceability.

## Core Requirements
- **Compliance-first**: Capture all legally required elements (product identity, UN numbers, compatibility groups, quantities, locations, authorizations, timestamps, audit trail)
- **Field-usability**: Two-tap flows on phones, works with poor connectivity
- **Traceability & audit**: Durable CSV exports by period, magazine, and product

## Implementation Phases

### Phase 1: Project Foundation

#### 1. Initialize Next.js App Router Structure
- Create `app` directory with `layout.tsx` and `page.tsx`
- Set up global styles with Tailwind CSS for industrial UI
- Configure TypeScript with strict settings
- Create `next.config.js` with PWA and offline optimizations

#### 2. Set up Clerk Authentication
- Create `middleware.ts` with `clerkMiddleware()`
- Wrap app with `ClerkProvider` in `layout.tsx`
- Create sign-in and sign-up pages
- Implement `UserButton` component
- Configure employee approval validation

### Phase 2: Database & Backend

#### 3. Initialize SQLite Database
- Create database schema:
  - `magazines` - Storage locations with capacity limits
  - `products` - Explosives catalog with UN numbers
  - `employee_profiles` - Staff with approval documents
  - `inventory_transactions` - Complete ledger of all movements
  - `inventory_reconciliations` - Monthly physical count records
  - `audit_logs` - Complete audit trail
- Set up better-sqlite3 connection with WAL mode
- Implement database utilities and migrations
- Configure proper file permissions (600)

#### 4. Implement tRPC API Layer
- Set up tRPC router structure
- Create routers for:
  - Magazine operations
  - Product management
  - Transaction processing (receive, issue, transfer, adjust, destroy)
  - Reconciliation workflows
  - Stock calculations
  - Export generation
- Implement type-safe procedures with Zod validation
- Add business rule validations

#### 5. Clerk Webhook Integration
- Create webhook handler at `/api/webhooks/clerk`
- Sync users to `employee_profiles` table
- Validate approval documents and expiry dates
- Set up Svix verification

### Phase 3: Core Features

#### 6. Mobile-Optimized UI Components
- **Large Touch Targets**: 56-64dp for primary actions (receive, issue)
- **Status Indicators**: Color-coded for stock levels and compliance
- **Quick Action Cards**: Two-tap flows for common operations
- **Bottom Navigation**: Quick access to daily operations
- **Attachment Upload**: Camera integration for photos/documents

#### 7. Daily Operation Pages
- **Receiving**: Record deliveries with validation
  - Future-dated entries allowed
  - Positive quantity validation
  - Magazine capacity checks
- **Issue**: Remove stock for use
  - Authorization number capture
  - Reference number (blast log) entry
- **Transfer**: Move between magazines
  - From/to magazine selection
  - Quantity validation against available stock
- **Adjust**: Increase/decrease for corrections
  - Reason capture required
  - Manager approval for large adjustments
- **Destruction**: Record destroyed explosives
  - Destruction certificate upload
  - Authorization tracking

#### 8. Monthly Reconciliation System
- **Physical Count Entry**: By magazine and product
- **Variance Calculation**: Automatic computation vs system count
- **Variance Resolution**: 
  - Reason capture for discrepancies
  - Manager review workflow
  - Resolution tracking
- **Reconciliation Dashboard**: Manager view of all variances

#### 9. Emergency Read-Only Views
- **Current Stock by Magazine**: Real-time inventory levels
- **Recent Transactions**: Last 50 operations for quick reference
- **Quick Search**: Find product location rapidly

### Phase 4: Reporting & Compliance

#### 10. Export System
- **CSV Exports**:
  - Transactions by date range
  - Magazine inventory snapshots
  - Product movement reports
  - Reconciliation variance reports
- **Audit Reports**:
  - Complete audit trail by period
  - User activity logs
  - Compliance documentation

#### 11. Offline Support
- Service worker for offline operation
- Local data caching with IndexedDB
- Queue for offline transactions
- Sync mechanism when connection restored

### Phase 5: Security & Deployment

#### 12. Security Implementation
- Employee approval validation
- Transaction authorization checks
- Rate limiting on sensitive operations
- Audit trail for all actions
- Secure attachment storage

#### 13. Testing & Validation
- Field testing with actual users
- Compliance validation checklist
- Mobile device testing (various screen sizes)
- Offline/online transition testing
- Data integrity verification

## Database Schema

### magazines Table
```sql
CREATE TABLE magazines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- e.g., "M-01"
    name TEXT NOT NULL,
    location TEXT NOT NULL, -- site/GPS/address
    max_net_explosive_weight_kg REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_magazines_code ON magazines(code);
CREATE INDEX idx_magazines_location ON magazines(location);
```

### products Table
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    un_number TEXT NOT NULL, -- e.g., "UN 0241"
    description TEXT,
    compatibility_group TEXT NOT NULL, -- e.g., "D"
    explosive_type TEXT, -- E/I/etc.
    unit TEXT NOT NULL, -- "kg", "cartridge", etc.
    net_explosive_weight_per_unit_kg REAL,
    manufacturer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_un_number ON products(un_number);
CREATE INDEX idx_products_name ON products(name);
```

### employee_profiles Table
```sql
CREATE TABLE employee_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
    approval_id TEXT,
    approval_expires_at INTEGER, -- milliseconds
    active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_employee_profiles_user_id ON employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_active ON employee_profiles(active);
```

### inventory_transactions Table (Ledger)
```sql
CREATE TABLE inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_date INTEGER NOT NULL, -- user-entered date in ms
    type TEXT NOT NULL CHECK(type IN (
        'Receipt', 'Issue', 'TransferOut', 'TransferIn',
        'AdjustIncrease', 'AdjustDecrease', 'Destruction'
    )),
    magazine_from_id INTEGER REFERENCES magazines(id),
    magazine_to_id INTEGER REFERENCES magazines(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL, -- in product.unit
    reference_number TEXT, -- PO/waybill/blast log
    authorization_number TEXT,
    notes TEXT,
    entered_by_user_id TEXT NOT NULL,
    attachments TEXT, -- JSON array of file IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_transactions_magazine_from ON inventory_transactions(magazine_from_id);
CREATE INDEX idx_transactions_magazine_to ON inventory_transactions(magazine_to_id);
CREATE INDEX idx_transactions_user ON inventory_transactions(entered_by_user_id);
```

### inventory_reconciliations Table
```sql
CREATE TABLE inventory_reconciliations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reconciliation_date INTEGER NOT NULL, -- ms
    magazine_id INTEGER NOT NULL REFERENCES magazines(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    physical_count REAL NOT NULL,
    system_count_at_time REAL NOT NULL,
    variance REAL NOT NULL, -- physical - system
    variance_reason TEXT,
    entered_by_user_id TEXT NOT NULL,
    attachments TEXT, -- JSON array
    resolved BOOLEAN DEFAULT false,
    resolved_by_user_id TEXT,
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);
CREATE INDEX idx_reconciliations_magazine_date ON inventory_reconciliations(magazine_id, reconciliation_date);
CREATE INDEX idx_reconciliations_product_date ON inventory_reconciliations(product_id, reconciliation_date);
CREATE INDEX idx_reconciliations_variance ON inventory_reconciliations(variance);
```

### audit_logs Table
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL, -- ms
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- e.g., "transaction.create"
    entity TEXT NOT NULL, -- table name
    entity_id INTEGER,
    details TEXT, -- JSON with changes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
```

## UI/UX Design for Field Use

### Mobile-First Design Principles
- **Two-Tap Flows**: Most operations completable in 2 taps
- **Large Touch Targets**: Minimum 56dp for primary actions
- **High Contrast**: WCAG AAA compliance for outdoor visibility
- **Offline-First**: Core functions work without connection
- **Quick Actions**: Bottom sheet for common operations

### Color System for Safety
- 🟢 **Green**: Safe stock levels, successful operations
- 🟡 **Yellow**: Near capacity, pending reconciliation
- 🔴 **Red**: Over capacity, expired approvals, critical variances
- 🔵 **Blue**: Information, standard actions
- ⚫ **Black/Gray**: Inactive, historical data

### Key Screens Layout

#### Dashboard
- Current magazine stock summary cards
- Quick action buttons (Receive, Issue, Transfer)
- Alerts for reconciliation due or capacity warnings
- Recent transactions list

#### Transaction Entry
- Large product selector (searchable)
- Numeric keypad for quantity
- Magazine dropdown (pre-selected based on context)
- Photo capture button for attachments
- Single "Confirm" button

#### Reconciliation Screen
- Magazine/product grid view
- Physical count entry with numeric keypad
- Automatic variance calculation
- Color-coded variance indicators
- Batch entry mode for efficiency

## Critical Validations

### Business Rules
1. **Receiving**: Only positive quantities, future dates allowed
2. **Issue**: Cannot exceed available stock
3. **Transfer**: Validate source has stock, destination has capacity
4. **Adjustments**: Require reason, large adjustments need approval
5. **Destruction**: Require authorization number
6. **Reconciliation**: Physical count must be non-negative

### Compliance Checks
- UN number validation
- Compatibility group restrictions
- Magazine capacity limits
- Employee approval expiry
- Authorization number format

## File Structure
```
inv-mvp/
├── app/
│   ├── layout.tsx                    # Root layout with ClerkProvider
│   ├── page.tsx                      # Landing/redirect
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── dashboard/
│   │   └── page.tsx                  # Main dashboard
│   ├── transactions/
│   │   ├── receive/page.tsx         # Receiving form
│   │   ├── issue/page.tsx           # Issue form
│   │   ├── transfer/page.tsx        # Transfer form
│   │   ├── adjust/page.tsx          # Adjustment form
│   │   └── destroy/page.tsx         # Destruction form
│   ├── reconciliation/
│   │   ├── page.tsx                  # Reconciliation list
│   │   ├── new/page.tsx             # New reconciliation
│   │   └── [id]/page.tsx            # Reconciliation detail
│   ├── stock/
│   │   └── page.tsx                  # Current stock view
│   ├── reports/
│   │   └── page.tsx                  # Export center
│   └── api/
│       ├── trpc/[trpc]/route.ts
│       └── webhooks/clerk/route.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx                # Large touch target button
│   │   ├── Card.tsx                  # Stock/magazine cards
│   │   ├── Input.tsx                 # Mobile-optimized inputs
│   │   ├── Select.tsx                # Large select dropdowns
│   │   └── StatusBadge.tsx          # Color-coded badges
│   ├── forms/
│   │   ├── ProductSelector.tsx      # Product search/select
│   │   ├── QuantityInput.tsx        # Numeric keypad input
│   │   └── AttachmentUpload.tsx     # Photo/doc upload
│   └── layout/
│       ├── BottomNav.tsx            # Mobile navigation
│       └── QuickActions.tsx         # FAB menu
├── lib/
│   ├── db.ts                         # SQLite connection
│   ├── trpc.ts                       # tRPC setup
│   ├── validations.ts                # Business rules
│   └── calculations.ts               # Stock calculations
├── server/
│   ├── api/
│   │   ├── routers/
│   │   │   ├── magazines.ts
│   │   │   ├── products.ts
│   │   │   ├── transactions.ts
│   │   │   ├── reconciliation.ts
│   │   │   └── reports.ts
│   │   └── root.ts
│   └── db/
│       ├── schema.sql
│       └── seed.sql
└── middleware.ts
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Database setup
npm run db:init      # Create tables
npm run db:seed      # Add test data

# Testing
npm run test         # Unit tests
npm run test:e2e     # E2E tests
```

## Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_PATH=./data/app.db

# App Configuration
NEXT_PUBLIC_APP_NAME="Explosives Inventory"
NEXT_PUBLIC_COMPANY_NAME="Your Company"

# File Storage (for attachments)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Export Settings
EXPORT_DIR=./exports
EXPORT_RETENTION_DAYS=90
```

## Deployment Considerations

### Production Checklist
- [ ] Database backups configured (hourly)
- [ ] SSL certificate installed
- [ ] Offline service worker tested
- [ ] File upload limits configured
- [ ] Export directory secured
- [ ] Audit log retention policy set
- [ ] Employee approval validation active
- [ ] Magazine capacity limits enforced

### Performance Targets
- Page load: < 2 seconds on 3G
- Transaction save: < 1 second
- Stock calculation: < 500ms
- Export generation: < 5 seconds for 10,000 records
- Offline sync: < 10 seconds for 100 transactions

## Next Steps

1. **Immediate**: Set up project foundation with Clerk auth
2. **Priority 1**: Create database schema and seed data
3. **Priority 2**: Implement receiving and issue transactions
4. **Priority 3**: Build stock view and calculations
5. **Priority 4**: Add reconciliation system
6. **Priority 5**: Implement offline support and exports

## Compliance Notes

- All transactions must be immutable once created
- Audit logs must capture all data changes
- Exports must be retained per regulatory requirements
- Employee approvals must be validated before operations
- Magazine capacity limits must be enforced in real-time