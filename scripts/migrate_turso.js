import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Connecting to Turso Cloud Database...');
console.log('URL:', url);
console.log('Auth Token:', authToken ? `${authToken.substring(0, 20)}...` : 'MISSING');

const db = createClient({ url, authToken });

async function migrateAndSeed() {
  console.log('\n1. Creating database schema...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER DEFAULT 0
    );
  `);
  console.log(' - categories table created/verified');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      unit_price REAL NOT NULL DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);
  console.log(' - items table created/verified');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'open',
      cash_collected REAL DEFAULT 0,
      paytm_collected REAL DEFAULT 0,
      credit_collected REAL DEFAULT 0,
      total_sale_entered REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log(' - daily_registers table created/verified');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS stock_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id INTEGER NOT NULL REFERENCES daily_registers(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      opening_balance INTEGER DEFAULT 0,
      received INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      sale INTEGER DEFAULT 0,
      balance INTEGER DEFAULT 0,
      remarks TEXT DEFAULT '',
      UNIQUE(register_id, item_id)
    );
  `);
  console.log(' - stock_entries table created/verified');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id INTEGER NOT NULL REFERENCES daily_registers(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      quantity TEXT DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      remarks TEXT DEFAULT ''
    );
  `);
  console.log(' - purchases table created/verified');

  console.log('\n2. Seeding menu categories and items into Turso...');

  // Helper function to insert category safely
  async function getOrCreateCategory(name, order) {
    const existing = await db.execute({ sql: 'SELECT id FROM categories WHERE name = ?', args: [name] });
    if (existing.rows.length > 0) return Number(existing.rows[0].id);
    const ins = await db.execute({ sql: 'INSERT INTO categories (name, display_order) VALUES (?, ?)', args: [name, order] });
    return Number(ins.lastInsertRowid);
  }

  // Helper function to insert item safely
  async function insertItem(catId, name, price, order) {
    const existing = await db.execute({ sql: 'SELECT id FROM items WHERE name = ? AND category_id = ?', args: [name, catId] });
    if (existing.rows.length > 0) return Number(existing.rows[0].id);
    const ins = await db.execute({
      sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)',
      args: [catId, name, price, order]
    });
    return Number(ins.lastInsertRowid);
  }

  // 1. Cookies
  const c1 = await getOrCreateCategory('Cookies', 1);
  await insertItem(c1, '10 Cookies', 10, 1);
  await insertItem(c1, '20 Cookies', 20, 2);
  await insertItem(c1, '30 Cookies', 30, 3);

  // 2. Chocolates
  const c2 = await getOrCreateCategory('Chocolates', 2);
  await insertItem(c2, '05 Chocolate', 5, 1);
  await insertItem(c2, '10 Chocolate', 10, 2);
  await insertItem(c2, '20 Chocolate', 20, 3);
  await insertItem(c2, '25 Chocolate', 25, 4);
  await insertItem(c2, '30 Chocolate', 30, 5);
  await insertItem(c2, '50 Chocolate', 50, 6);
  await insertItem(c2, '70 Chocolate', 70, 7);

  // 3. Cold Drinks & Water
  const c3 = await getOrCreateCategory('Cold Drinks & Beverages', 3);
  await insertItem(c3, 'M/water-20', 20, 1);
  await insertItem(c3, 'M/water-30', 30, 2);
  await insertItem(c3, 'Pepsi-20', 20, 3);
  await insertItem(c3, 'T.C.W', 40, 4);

  // 4. Bakery & Snacks
  const c4 = await getOrCreateCategory('Snacks & Bakery', 4);
  await insertItem(c4, 'Patties', 25, 1);
  await insertItem(c4, 'Veg Sandwich', 50, 2);

  console.log(' - Menu categories and items seeded successfully');

  console.log('\n3. Seeding notebook sample historical day (30/04/26)...');
  const sampleDate = '2026-04-30';
  const existingReg = await db.execute({ sql: 'SELECT id FROM daily_registers WHERE date = ?', args: [sampleDate] });
  
  let regId;
  if (existingReg.rows.length === 0) {
    const regRes = await db.execute({
      sql: `
        INSERT INTO daily_registers (date, status, cash_collected, paytm_collected, credit_collected, total_sale_entered, notes)
        VALUES (?, 'closed', ?, ?, ?, ?, ?)
      `,
      args: [sampleDate, 260, 10305, 1550, 12115, 'Sample record populated directly from original cafe register notebook (30/04/26)']
    });
    regId = Number(regRes.lastInsertRowid);
  } else {
    regId = Number(existingReg.rows[0].id);
  }

  // Load items to map names
  const allItemsRes = await db.execute('SELECT id, name FROM items');
  const itemMap = {};
  allItemsRes.rows.forEach(i => { itemMap[i.name] = Number(i.id); });

  const entries = [
    { name: '10 Cookies', ob: 4, rec: 0, sale: 2, remarks: '' },
    { name: '20 Cookies', ob: 19, rec: 0, sale: 0, remarks: '' },
    { name: '30 Cookies', ob: 22, rec: 0, sale: 1, remarks: '' },
    { name: '05 Chocolate', ob: 0, rec: 0, sale: 0, remarks: '' },
    { name: '10 Chocolate', ob: 3, rec: 0, sale: 3, remarks: '' },
    { name: '20 Chocolate', ob: 0, rec: 0, sale: 0, remarks: '' },
    { name: '25 Chocolate', ob: 15, rec: 0, sale: 1, remarks: '' },
    { name: '30 Chocolate', ob: 4, rec: 0, sale: 1, remarks: '' },
    { name: '50 Chocolate', ob: 7, rec: 0, sale: 4, remarks: '' },
    { name: '70 Chocolate', ob: 1, rec: 0, sale: 0, remarks: '' },
    { name: 'M/water-20', ob: 0, rec: 0, sale: 0, remarks: '' },
    { name: 'M/water-30', ob: 36, rec: 0, sale: 0, remarks: '' },
    { name: 'Pepsi-20', ob: 126, rec: 0, sale: 35, remarks: '02 credit' },
    { name: 'T.C.W', ob: 20, rec: 0, sale: 16, remarks: '' },
  ];

  for (const e of entries) {
    if (itemMap[e.name]) {
      const tot = e.ob + e.rec;
      const bal = tot - e.sale;
      await db.execute({
        sql: `INSERT OR REPLACE INTO stock_entries (register_id, item_id, opening_balance, received, total, sale, balance, remarks)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [regId, itemMap[e.name], e.ob, e.rec, tot, e.sale, bal, e.remarks]
      });
    }
  }

  // Purchases for 30/04/26
  const existingPur = await db.execute({ sql: 'SELECT id FROM purchases WHERE register_id = ?', args: [regId] });
  if (existingPur.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO purchases (register_id, item_name, quantity, amount, remarks) VALUES (?, ?, ?, ?, ?)`,
      args: [regId, 'Bananas Purchase', '2 Dozen', 120, 'Kitchen requirement']
    });
    await db.execute({
      sql: `INSERT INTO purchases (register_id, item_name, quantity, amount, remarks) VALUES (?, ?, ?, ?, ?)`,
      args: [regId, 'Dairy Milk', '5 L', 330, 'Morning tea/coffee supply']
    });
  }

  console.log(' - Register entries and purchases for 30/04/26 seeded successfully');

  // Verify counts
  console.log('\n4. Verifying Turso Cloud Database contents...');
  const catCount = await db.execute('SELECT COUNT(*) as c FROM categories');
  const itemCount = await db.execute('SELECT COUNT(*) as c FROM items');
  const regCount = await db.execute('SELECT COUNT(*) as c FROM daily_registers');
  const stockCount = await db.execute('SELECT COUNT(*) as c FROM stock_entries');
  const purCount = await db.execute('SELECT COUNT(*) as c FROM purchases');

  console.log(` ✅ Categories in Turso: ${catCount.rows[0].c}`);
  console.log(` ✅ Items in Turso: ${itemCount.rows[0].c}`);
  console.log(` ✅ Registers in Turso: ${regCount.rows[0].c}`);
  console.log(` ✅ Stock entries in Turso: ${stockCount.rows[0].c}`);
  console.log(` ✅ Purchases in Turso: ${purCount.rows[0].c}`);

  console.log('\n🎉 ALL SCHEMA AND DATA SUCCESSFULLY CREATED IN TURSO!');
}

migrateAndSeed().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
