import Database from 'better-sqlite3';
import { join } from 'path';

const isDev = process.env.NODE_ENV !== 'production';
const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'app.db');

let db: Database.Database;

if (isDev) {
  // In development, use a global variable so the DB persists across module reloads
  const globalForDb = globalThis as unknown as { db: Database.Database };
  if (!globalForDb.db) {
    globalForDb.db = new Database(dbPath);
    // Enable WAL mode for better concurrency
    globalForDb.db.pragma('journal_mode = WAL');
    globalForDb.db.pragma('synchronous = NORMAL');
    globalForDb.db.pragma('cache_size = 1000000');
    globalForDb.db.pragma('temp_store = memory');
    globalForDb.db.pragma('mmap_size = 268435456');
  }
  db = globalForDb.db;
} else {
  db = new Database(dbPath);
  // Production optimizations
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000000');
  db.pragma('temp_store = memory');
  db.pragma('mmap_size = 268435456');
}

// Initialize database schema
export function initializeDatabase() {
  console.log('Initializing database schema...');
  
  // Create magazines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS magazines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      max_net_explosive_weight_kg REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_magazines_code ON magazines(code);
    CREATE INDEX IF NOT EXISTS idx_magazines_location ON magazines(location);
  `);

  // Create products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      un_number TEXT NOT NULL,
      description TEXT,
      compatibility_group TEXT NOT NULL,
      explosive_type TEXT,
      unit TEXT NOT NULL,
      net_explosive_weight_per_unit_kg REAL,
      manufacturer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_un_number ON products(un_number);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  `);

  // Create employee_profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employee_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      approval_id TEXT,
      approval_expires_at INTEGER,
      active BOOLEAN DEFAULT true,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_employee_profiles_user_id ON employee_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_employee_profiles_active ON employee_profiles(active);
  `);

  // Create inventory_transactions table (ledger)
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_date INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN (
        'Receipt', 'Issue', 'TransferOut', 'TransferIn',
        'AdjustIncrease', 'AdjustDecrease', 'Destruction'
      )),
      magazine_from_id INTEGER REFERENCES magazines(id),
      magazine_to_id INTEGER REFERENCES magazines(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      reference_number TEXT,
      authorization_number TEXT,
      notes TEXT,
      entered_by_user_id TEXT NOT NULL,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON inventory_transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_transactions_product ON inventory_transactions(product_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_magazine_from ON inventory_transactions(magazine_from_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_magazine_to ON inventory_transactions(magazine_to_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON inventory_transactions(entered_by_user_id);
  `);

  // Create inventory_reconciliations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_reconciliations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reconciliation_date INTEGER NOT NULL,
      magazine_id INTEGER NOT NULL REFERENCES magazines(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      physical_count REAL NOT NULL,
      system_count_at_time REAL NOT NULL,
      variance REAL NOT NULL,
      variance_reason TEXT,
      entered_by_user_id TEXT NOT NULL,
      attachments TEXT,
      resolved BOOLEAN DEFAULT false,
      resolved_by_user_id TEXT,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reconciliations_magazine_date ON inventory_reconciliations(magazine_id, reconciliation_date);
    CREATE INDEX IF NOT EXISTS idx_reconciliations_product_date ON inventory_reconciliations(product_id, reconciliation_date);
    CREATE INDEX IF NOT EXISTS idx_reconciliations_variance ON inventory_reconciliations(variance);
  `);

  // Create audit_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      actor_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
  `);

  // Create users table for Clerk sync
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  console.log('Database schema initialized successfully');
}

// Initialize the database on import
initializeDatabase();

export default db;