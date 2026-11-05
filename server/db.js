import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.TURSO_DATABASE_URL || 'file:data/cafe_plus.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

// Ensure local data directory exists if running with a local file URL
if (url.startsWith('file:')) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export const db = createClient({
  url,
  authToken: authToken || undefined,
});

let isInitialized = false;

// Initialize schema and seed data
export async function initDB() {
  if (isInitialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER DEFAULT 0
    );
  `);

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

  await seedInitialData();
  isInitialized = true;
}

async function seedInitialData() {
  const catRes = await db.execute('SELECT COUNT(*) as count FROM categories');
  const catCount = Number(catRes.rows[0].count);
  if (catCount > 0) return; // already seeded

  console.log('Seeding initial categories and items into database...');

  // 1. Cookies
  const c1Res = await db.execute({ sql: 'INSERT INTO categories (name, display_order) VALUES (?, ?)', args: ['Cookies', 1] });
  const c1 = Number(c1Res.lastInsertRowid);
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c1, '10 Cookies', 10, 1] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c1, '20 Cookies', 20, 2] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c1, '30 Cookies', 30, 3] });

  // 2. Chocolates
  const c2Res = await db.execute({ sql: 'INSERT INTO categories (name, display_order) VALUES (?, ?)', args: ['Chocolates', 2] });
  const c2 = Number(c2Res.lastInsertRowid);
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c2, '05 Chocolate', 5, 1] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c2, '10 Chocolate', 10, 2] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c2, '20 Chocolate', 20, 3] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c2, '25 Chocolate', 25, 4] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c2, '30 Chocolate', 30, 5] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c2, '50 Chocolate', 50, 6] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c2, '70 Chocolate', 70, 7] });

  // 3. Cold Drinks & Water
  const c3Res = await db.execute({ sql: 'INSERT INTO categories (name, display_order) VALUES (?, ?)', args: ['Cold Drinks & Beverages', 3] });
  const c3 = Number(c3Res.lastInsertRowid);
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c3, 'M/water-20', 20, 1] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c3, 'M/water-30', 30, 2] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c3, 'Pepsi-20', 20, 3] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c3, 'T.C.W', 40, 4] });

  // 4. Bakery & Snacks
  const c4Res = await db.execute({ sql: 'INSERT INTO categories (name, display_order) VALUES (?, ?)', args: ['Snacks & Bakery', 4] });
  const c4 = Number(c4Res.lastInsertRowid);
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c4, 'Patties', 25, 1] });
  await db.execute({ sql: 'INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)', args: [c4, 'Veg Sandwich', 50, 2] });

  await seedSampleHistoricalDay();
}

async function seedSampleHistoricalDay() {
  const sampleDate = '2026-04-30';
  const regCheck = await db.execute({ sql: 'SELECT id FROM daily_registers WHERE date = ?', args: [sampleDate] });
  if (regCheck.rows.length > 0) return;

  const regResult = await db.execute({
    sql: `
      INSERT INTO daily_registers (date, status, cash_collected, paytm_collected, credit_collected, total_sale_entered, notes)
      VALUES (?, 'closed', ?, ?, ?, ?, ?)
    `,
    args: [sampleDate, 260, 10305, 1550, 12115, 'Sample record populated directly from original cafe register notebook']
  });

  const regId = Number(regResult.lastInsertRowid);

  const allItemsRes = await db.execute('SELECT id, name FROM items');
  const itemMap = {};
  allItemsRes.rows.forEach(i => { itemMap[i.name] = i.id; });

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
        sql: `INSERT INTO stock_entries (register_id, item_id, opening_balance, received, total, sale, balance, remarks)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [regId, itemMap[e.name], e.ob, e.rec, tot, e.sale, bal, e.remarks]
      });
    }
  }

  await db.execute({
    sql: `INSERT INTO purchases (register_id, item_name, quantity, amount, remarks) VALUES (?, ?, ?, ?, ?)`,
    args: [regId, 'Bananas Purchase', '2 Dozen', 120, 'Kitchen requirement']
  });
  await db.execute({
    sql: `INSERT INTO purchases (register_id, item_name, quantity, amount, remarks) VALUES (?, ?, ?, ?, ?)`,
    args: [regId, 'Dairy Milk', '5 L', 330, 'Morning tea/coffee supply']
  });
}
