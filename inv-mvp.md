# inv-mvp

## 1. Summary

Build a mobile‑first, audit‑ready explosives inventory system while remaining simple for field staff. The system tracks stock across 
magazines, supports daily operations (receive, issue, transfer, adjust, 
destroy), performs monthly reconciliations, and generates auditor‑friendly 
records and exports.

## 2. Goals

- **Compliance-first**: Capture every element required for legal records 
  (product identity, UN number, compatibility group, quantities, locations, 
  authorizations, approvals, timestamps, and audit trail).
- **Field-usability**: Two‑tap flows on phones; works with poor connectivity.
- **Traceability & audit**: durable exports (CSV) per period, magazine, and product.

## 3. Non‑Goals

- Complex procurement, purchase orders, or invoicing.
- Generalized WMS/ERP functionality.

## 4. Key Flows (MVP)

- **Receiving**: Record deliveries into a magazine; validate 
  future-dated entries and positive quantities.
- **Daily Operations**: Issue, Transfer, Adjust, Destruction with tight 
  validation; attachments/photos optional.
- **Monthly Reconciliation**: Enter physical counts by magazine/product, compute
  variance vs. system count at time, capture reasons, and resolve variances.
- **Emergency Read‑Only**: Current Stock by Magazine and Recent Transactions 
  list.
- **Exports**: Period/magazine/product CSV.

## 5. Data Model (MVP)

### Tables (MVP)

#### 1) magazines

- code (string, unique human code, e.g. “M-01”)
- name (string)
- location (string) — site / GPS / address
- maxNetExplosiveWeightKg (number)
- notes (string, optional)
- Indexes: by_code, by_location

#### 2) products

- name (string)
- unNumber (string) — e.g. “UN 0241”
- description (string)
- compatibilityGroup (string) — e.g. “D”
- explosiveType (string) — E/I/etc.
- unit (string) — “kg”, “cartridge”, etc.
- netExplosiveWeightPerUnitKg (number, optional)
- manufacturer (string, optional)
- Indexes: by_unNumber, by_name

#### 3) employee_profiles

- userId (string) — Clerk user ID
- approvalId (string) — approval doc ID
- approvalExpiresAt (number, ms)
- active (boolean)
- Indexes: by_user, by_active

#### 4) inventory_transactions (the ledger)

- transactionDate (number, ms) — user-entered date
- type (literal: “Receipt” | “Issue” | “TransferOut” | “TransferIn” | 
  “AdjustIncrease” | “AdjustDecrease” | “Destruction”)
- magazineFromId (id(“magazines”), optional)
- magazineToId (id(“magazines”), optional)
- productId (id(“products”))
- quantity (number) — in product.unit
- referenceNumber (string, optional) — PO / waybill / blast log #
- authorizationNumber (string, optional)
- notes (string, optional)
- enteredByUserId (string) — Clerk user ID
- attachments (array(fileStorageId), optional) — photos/docs
- Indexes: by_date, by_product, by_mag_from, by_mag_to, by_user

#### 5) inventory_reconciliations

- reconciliationDate (number, ms)
- magazineId (id(“magazines”))
- productId (id(“products”))
- physicalCount (number)
- systemCountAtTime (number)
- variance (number) — physical − system
- varianceReason (string, optional)
- enteredByUserId (string) — Clerk user ID
- attachments (array(fileStorageId), optional) — photos
- resolved (boolean, default false)
- resolvedByUserId (string, optional) — Clerk user ID
- resolutionNotes (string, optional)
- Indexes: by_mag_date, by_product_date, by_variance

#### 6) audit_logs

- ts (number, ms)
- actorUserId (string) — Clerk user ID
- action (string) — e.g. transaction.create, reconciliation.resolve
- entity (string) — inventory_transactions / inventory_reconciliations / etc.
- entityId (id(""))
- details (object) — minimal diff / summary
- Indexes: by_ts, by_actor, by_entity

*Note: Users come from Clerk's authentication service.*

## 6. Views & Reports

### Views to build (read-only pages)

- **Current Stock Levels**: Query that folds the ledger into balances by 
  (magazineId, productId); list sorted by magazine.
- **Recent Transactions**: inventory_transactions ordered by transactionDate 
  desc, limit 50.
- **Reconciliation Dashboard (manager)**: Variances not zero, filter by 
  month/magazine, with resolve action (writes resolved, resolutionNotes, logs to 
  audit_logs).

### Reports/Exports

- **CSV**: Transactions (by date range, magazine, product), Current Stock 
  snapshot, Reconciliation variances.

## 7. Operational Considerations

- **Offline Support**: Cache recent data for offline usage; sync when online.