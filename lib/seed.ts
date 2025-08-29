import db from './db';

export function seedDatabase() {
  console.log('Seeding database with sample data...');

  // Insert sample magazines
  const magazines = [
    { code: 'M-01', name: 'North Storage', location: 'North Site Building A', maxWeight: 5000, notes: 'Primary explosives storage' },
    { code: 'M-02', name: 'South Storage', location: 'South Site Building B', maxWeight: 3000, notes: 'Secondary storage facility' },
    { code: 'M-03', name: 'East Bunker', location: 'East Perimeter Bunker 1', maxWeight: 10000, notes: 'High capacity underground storage' },
  ];

  const magazineStmt = db.prepare(`
    INSERT OR IGNORE INTO magazines (code, name, location, max_net_explosive_weight_kg, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const mag of magazines) {
    magazineStmt.run(mag.code, mag.name, mag.location, mag.maxWeight, mag.notes);
  }

  // Insert sample products
  const products = [
    { 
      name: 'PETN Shaped Charge', 
      unNumber: 'UN 0059', 
      description: 'Pentaerythritol tetranitrate shaped charge',
      compatibilityGroup: 'B',
      explosiveType: 'I',
      unit: 'each',
      netWeight: 0.5,
      manufacturer: 'ExplosiveTech Inc'
    },
    { 
      name: 'TNT Block', 
      unNumber: 'UN 0209', 
      description: 'Trinitrotoluene demolition block',
      compatibilityGroup: 'D',
      explosiveType: 'I',
      unit: 'kg',
      netWeight: 1.0,
      manufacturer: 'DemoSupply Co'
    },
    { 
      name: 'Blasting Cap Electric', 
      unNumber: 'UN 0030', 
      description: 'Electric detonating cap #8',
      compatibilityGroup: 'B',
      explosiveType: 'I',
      unit: 'each',
      netWeight: 0.01,
      manufacturer: 'DetTech Systems'
    },
    { 
      name: 'ANFO Bulk', 
      unNumber: 'UN 0082', 
      description: 'Ammonium nitrate fuel oil mixture',
      compatibilityGroup: 'D',
      explosiveType: 'B',
      unit: 'kg',
      netWeight: 1.0,
      manufacturer: 'BlastMine Corp'
    },
  ];

  const productStmt = db.prepare(`
    INSERT OR IGNORE INTO products (name, un_number, description, compatibility_group, explosive_type, unit, net_explosive_weight_per_unit_kg, manufacturer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const prod of products) {
    productStmt.run(
      prod.name, 
      prod.unNumber, 
      prod.description, 
      prod.compatibilityGroup, 
      prod.explosiveType, 
      prod.unit, 
      prod.netWeight, 
      prod.manufacturer
    );
  }

  // Insert sample transactions (receipts to populate stock)
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const transactions = [
    // Receipts into M-01
    { date: now - (7 * dayMs), type: 'Receipt', magazineTo: 1, product: 1, quantity: 50, ref: 'PO-2024-001', auth: 'AUTH-001', userId: 'system' },
    { date: now - (7 * dayMs), type: 'Receipt', magazineTo: 1, product: 2, quantity: 100, ref: 'PO-2024-001', auth: 'AUTH-001', userId: 'system' },
    { date: now - (5 * dayMs), type: 'Receipt', magazineTo: 1, product: 3, quantity: 200, ref: 'PO-2024-002', auth: 'AUTH-002', userId: 'system' },
    
    // Receipts into M-02
    { date: now - (6 * dayMs), type: 'Receipt', magazineTo: 2, product: 2, quantity: 75, ref: 'PO-2024-003', auth: 'AUTH-003', userId: 'system' },
    { date: now - (4 * dayMs), type: 'Receipt', magazineTo: 2, product: 4, quantity: 500, ref: 'PO-2024-004', auth: 'AUTH-004', userId: 'system' },
    
    // Some issues
    { date: now - (3 * dayMs), type: 'Issue', magazineFrom: 1, product: 1, quantity: 10, ref: 'BLAST-001', auth: 'AUTH-005', userId: 'system' },
    { date: now - (2 * dayMs), type: 'Issue', magazineFrom: 1, product: 2, quantity: 25, ref: 'BLAST-002', auth: 'AUTH-006', userId: 'system' },
    { date: now - (1 * dayMs), type: 'Issue', magazineFrom: 2, product: 4, quantity: 100, ref: 'BLAST-003', auth: 'AUTH-007', userId: 'system' },
  ];

  const transactionStmt = db.prepare(`
    INSERT OR IGNORE INTO inventory_transactions (transaction_date, type, magazine_from_id, magazine_to_id, product_id, quantity, reference_number, authorization_number, entered_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const tx of transactions) {
    transactionStmt.run(
      tx.date,
      tx.type,
      tx.magazineFrom || null,
      tx.magazineTo || null,
      tx.product,
      tx.quantity,
      tx.ref,
      tx.auth,
      tx.userId
    );
  }

  console.log('Database seeded successfully!');
  console.log(`- ${magazines.length} magazines added`);
  console.log(`- ${products.length} products added`);
  console.log(`- ${transactions.length} transactions added`);
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}