import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { db, initDB } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json());

// Ensure database schema and seed data are initialized
app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('Database initialization error:', err);
    res.status(500).json({ error: 'Database initialization error: ' + err.message });
  }
});

// ------------------------------------
// 0. Authentication Endpoints
// ------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Read credentials from environment variables (with fallback defaults)
    const expectedUsername = process.env.AUTH_USERNAME || process.env.STAFF_USERNAME || 'Shubham';
    const expectedPassword = process.env.AUTH_PASSWORD || process.env.STAFF_PASSWORD || 'shubham@cafeplus';

    const isUsernameMatch = username.trim().toLowerCase() === expectedUsername.trim().toLowerCase();
    const isPasswordMatch = password === expectedPassword;

    if (isUsernameMatch && isPasswordMatch) {
      const token = Buffer.from(`${expectedUsername}:${Date.now()}`).toString('base64');
      return res.json({
        success: true,
        token,
        user: {
          username: expectedUsername,
          name: expectedUsername,
          role: 'Manager'
        }
      });
    }

    return res.status(401).json({ error: 'Invalid username or password. Please try again.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------
// 1. Categories & Items Endpoints
// ------------------------------------

app.get('/api/categories', async (req, res) => {
  try {
    const catRes = await db.execute('SELECT * FROM categories ORDER BY display_order ASC, id ASC');
    const itemsRes = await db.execute('SELECT * FROM items WHERE is_active = 1 ORDER BY display_order ASC, id ASC');

    const result = catRes.rows.map(cat => ({
      ...cat,
      items: itemsRes.rows.filter(it => it.category_id === cat.id)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, display_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const trimmedName = name.trim();

    // Check if category already exists (case-insensitive)
    const existingRes = await db.execute({
      sql: 'SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)',
      args: [trimmedName]
    });
    if (existingRes.rows.length > 0) {
      return res.status(400).json({ error: `Category "${existingRes.rows[0].name}" already exists.` });
    }

    const maxOrderRes = await db.execute('SELECT COALESCE(MAX(display_order), 0) as max_order FROM categories');
    const maxOrder = Number(maxOrderRes.rows[0].max_order);
    const order = display_order !== undefined ? display_order : (maxOrder + 1);

    const info = await db.execute({
      sql: 'INSERT INTO categories (name, display_order) VALUES (?, ?)',
      args: [trimmedName, order]
    });
    const newId = Number(info.lastInsertRowid);
    res.status(201).json({ id: newId, name: trimmedName, display_order: order, items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order } = req.body;
    if (name && name.trim()) {
      const existingRes = await db.execute({
        sql: 'SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?',
        args: [name.trim(), id]
      });
      if (existingRes.rows.length > 0) {
        return res.status(400).json({ error: `Another category named "${existingRes.rows[0].name}" already exists.` });
      }
    }

    await db.execute({
      sql: `
        UPDATE categories 
        SET name = COALESCE(?, name),
            display_order = COALESCE(?, display_order)
        WHERE id = ?
      `,
      args: [name ? name.trim() : null, display_order !== undefined ? display_order : null, id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM items WHERE category_id = ? AND is_active = 1',
      args: [id]
    });
    const activeItemCount = Number(countRes.rows[0].count);
    if (activeItemCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete this category because it contains ${activeItemCount} active menu item(s). Please delete or move the items first.` 
      });
    }
    await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const itemsRes = await db.execute(`
      SELECT items.*, categories.name as category_name 
      FROM items 
      LEFT JOIN categories ON items.category_id = categories.id 
      WHERE items.is_active = 1
      ORDER BY categories.display_order ASC, items.display_order ASC, items.id ASC
    `);
    res.json(itemsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { category_id, name, unit_price = 0, display_order } = req.body;
    if (!name?.trim() || !category_id) {
      return res.status(400).json({ error: 'Item name and category are required' });
    }

    const catRes = await db.execute({ sql: 'SELECT id FROM categories WHERE id = ?', args: [category_id] });
    if (catRes.rows.length === 0) {
      return res.status(400).json({ error: 'Selected category does not exist' });
    }

    const trimmedName = name.trim();
    const existingRes = await db.execute({
      sql: 'SELECT id, is_active FROM items WHERE LOWER(name) = LOWER(?) AND category_id = ?',
      args: [trimmedName, category_id]
    });
    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      if (existing.is_active === 0) {
        await db.execute({
          sql: 'UPDATE items SET is_active = 1, unit_price = ? WHERE id = ?',
          args: [parseFloat(unit_price) || 0, existing.id]
        });
        return res.json({ id: existing.id, category_id, name: trimmedName, unit_price: parseFloat(unit_price) || 0 });
      }
      return res.status(400).json({ error: `Item "${trimmedName}" already exists in this category.` });
    }

    const maxOrderRes = await db.execute({
      sql: 'SELECT COALESCE(MAX(display_order), 0) as max_order FROM items WHERE category_id = ?',
      args: [category_id]
    });
    const maxOrder = Number(maxOrderRes.rows[0].max_order);
    const order = display_order !== undefined ? display_order : (maxOrder + 1);

    const info = await db.execute({
      sql: `INSERT INTO items (category_id, name, unit_price, display_order) VALUES (?, ?, ?, ?)`,
      args: [category_id, trimmedName, parseFloat(unit_price) || 0, order]
    });
    const newItemId = Number(info.lastInsertRowid);

    // Auto-add stock entry to all open registers so the item immediately appears on today's register
    const openRegsRes = await db.execute("SELECT id FROM daily_registers WHERE status = 'open'");
    for (const reg of openRegsRes.rows) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO stock_entries (register_id, item_id, opening_balance, received, total, sale, balance, remarks)
              VALUES (?, ?, 0, 0, 0, 0, 0, '')`,
        args: [reg.id, newItemId]
      });
    }

    res.status(201).json({ id: newItemId, category_id, name: trimmedName, unit_price: parseFloat(unit_price) || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, unit_price, display_order } = req.body;
    await db.execute({
      sql: `
        UPDATE items 
        SET name = COALESCE(?, name),
            category_id = COALESCE(?, category_id),
            unit_price = COALESCE(?, unit_price),
            display_order = COALESCE(?, display_order)
        WHERE id = ?
      `,
      args: [name ? name.trim() : null, category_id || null, unit_price !== undefined ? parseFloat(unit_price) : null, display_order || null, id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'UPDATE items SET is_active = 0 WHERE id = ?', args: [id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------
// 2. Daily Register Endpoints
// ------------------------------------

app.get('/api/registers/dates', async (req, res) => {
  try {
    const datesRes = await db.execute(`
      SELECT date, status, total_sale_entered, 
             cash_collected + paytm_collected + credit_collected as total_reconciled
      FROM daily_registers 
      ORDER BY date DESC
    `);
    res.json(datesRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getOrInitRegister(dateStr) {
  const regCheckRes = await db.execute({
    sql: 'SELECT * FROM daily_registers WHERE date = ?',
    args: [dateStr]
  });
  let reg = regCheckRes.rows[0];

  if (!reg) {
    const prevRegRes = await db.execute({
      sql: 'SELECT id, date FROM daily_registers WHERE date < ? ORDER BY date DESC LIMIT 1',
      args: [dateStr]
    });
    const prevReg = prevRegRes.rows[0];

    let prevBalances = {};
    if (prevReg) {
      const prevEntriesRes = await db.execute({
        sql: 'SELECT item_id, balance FROM stock_entries WHERE register_id = ?',
        args: [prevReg.id]
      });
      prevEntriesRes.rows.forEach(pe => {
        prevBalances[pe.item_id] = pe.balance;
      });
    }

    const newRegRes = await db.execute({
      sql: `INSERT INTO daily_registers (date, status, cash_collected, paytm_collected, credit_collected, total_sale_entered)
            VALUES (?, 'open', 0, 0, 0, 0)`,
      args: [dateStr]
    });
    const regId = Number(newRegRes.lastInsertRowid);

    const regLoad = await db.execute({ sql: 'SELECT * FROM daily_registers WHERE id = ?', args: [regId] });
    reg = regLoad.rows[0];

    const activeItemsRes = await db.execute('SELECT id FROM items WHERE is_active = 1');
    for (const item of activeItemsRes.rows) {
      const ob = prevBalances[item.id] || 0;
      await db.execute({
        sql: `INSERT INTO stock_entries (register_id, item_id, opening_balance, received, total, sale, balance, remarks)
              VALUES (?, ?, ?, 0, ?, 0, ?, '')`,
        args: [reg.id, item.id, ob, ob, ob]
      });
    }
  } else {
    const existingRes = await db.execute({
      sql: 'SELECT item_id FROM stock_entries WHERE register_id = ?',
      args: [reg.id]
    });
    const existingItemIds = existingRes.rows.map(x => x.item_id);

    const activeItemsRes = await db.execute('SELECT id FROM items WHERE is_active = 1');
    for (const item of activeItemsRes.rows) {
      if (!existingItemIds.includes(item.id)) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO stock_entries (register_id, item_id, opening_balance, received, total, sale, balance, remarks)
                VALUES (?, ?, 0, 0, 0, 0, 0, '')`,
          args: [reg.id, item.id]
        });
      }
    }
  }

  const entriesRes = await db.execute({
    sql: `
      SELECT 
        se.id as entry_id,
        se.register_id,
        se.item_id,
        se.opening_balance,
        se.received,
        se.total,
        se.sale,
        se.balance,
        se.remarks,
        i.name as item_name,
        i.unit_price,
        c.id as category_id,
        c.name as category_name
      FROM stock_entries se
      JOIN items i ON se.item_id = i.id
      JOIN categories c ON i.category_id = c.id
      WHERE se.register_id = ? AND i.is_active = 1
      ORDER BY c.display_order ASC, i.display_order ASC, i.id ASC
    `,
    args: [reg.id]
  });

  const purchasesRes = await db.execute({
    sql: 'SELECT * FROM purchases WHERE register_id = ? ORDER BY id ASC',
    args: [reg.id]
  });

  return { register: reg, entries: entriesRes.rows, purchases: purchasesRes.rows };
}

app.get('/api/registers/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const data = await getOrInitRegister(date);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/registers/:date/stock', async (req, res) => {
  try {
    const { date } = req.params;
    const { entries } = req.body;

    const regRes = await db.execute({ sql: 'SELECT id FROM daily_registers WHERE date = ?', args: [date] });
    const reg = regRes.rows[0];
    if (!reg) return res.status(404).json({ error: 'Register not found' });

    for (const e of entries) {
      const ob = parseInt(e.opening_balance, 10) || 0;
      const rec = parseInt(e.received, 10) || 0;
      const total = ob + rec;
      const sale = parseInt(e.sale, 10) || 0;
      const balance = e.balance !== undefined ? parseInt(e.balance, 10) : (total - sale);
      const remarks = (e.remarks || '').trim();

      await db.execute({
        sql: `
          UPDATE stock_entries 
          SET opening_balance = ?,
              received = ?,
              total = ?,
              sale = ?,
              balance = ?,
              remarks = ?
          WHERE register_id = ? AND item_id = ?
        `,
        args: [ob, rec, total, sale, balance, remarks, reg.id, e.item_id]
      });
    }

    await db.execute({
      sql: "UPDATE daily_registers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [reg.id]
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/registers/:date/settlement', async (req, res) => {
  try {
    const { date } = req.params;
    const { cash_collected, paytm_collected, credit_collected, total_sale_entered, notes, status } = req.body;

    const regRes = await db.execute({ sql: 'SELECT id FROM daily_registers WHERE date = ?', args: [date] });
    const reg = regRes.rows[0];
    if (!reg) return res.status(404).json({ error: 'Register not found' });

    const cash = parseFloat(cash_collected) || 0;
    const paytm = parseFloat(paytm_collected) || 0;
    const credit = parseFloat(credit_collected) || 0;
    const totalSale = total_sale_entered !== undefined ? parseFloat(total_sale_entered) : (cash + paytm + credit);

    await db.execute({
      sql: `
        UPDATE daily_registers 
        SET cash_collected = ?,
            paytm_collected = ?,
            credit_collected = ?,
            total_sale_entered = ?,
            notes = COALESCE(?, notes),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [cash, paytm, credit, totalSale, notes !== undefined ? notes : null, status !== undefined ? status : null, reg.id]
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------
// 3. Purchases Endpoints
// ------------------------------------

app.post('/api/registers/:date/purchases', async (req, res) => {
  try {
    const { date } = req.params;
    const { item_name, quantity = '', amount = 0, remarks = '' } = req.body;
    if (!item_name?.trim()) return res.status(400).json({ error: 'Item name is required' });

    const regRes = await db.execute({ sql: 'SELECT id FROM daily_registers WHERE date = ?', args: [date] });
    const reg = regRes.rows[0];
    if (!reg) return res.status(404).json({ error: 'Register not found' });

    const info = await db.execute({
      sql: `INSERT INTO purchases (register_id, item_name, quantity, amount, remarks) VALUES (?, ?, ?, ?, ?)`,
      args: [reg.id, item_name.trim(), quantity.trim(), parseFloat(amount) || 0, remarks.trim()]
    });

    res.status(201).json({ id: Number(info.lastInsertRowid), item_name: item_name.trim(), quantity, amount, remarks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM purchases WHERE id = ?', args: [id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------
// 4. Close Day & Auto-Rollover to Next Day
// ------------------------------------

app.post('/api/registers/:date/close-and-rollover', async (req, res) => {
  try {
    const { date } = req.params;
    const regRes = await db.execute({ sql: 'SELECT * FROM daily_registers WHERE date = ?', args: [date] });
    const reg = regRes.rows[0];
    if (!reg) return res.status(404).json({ error: 'Register not found' });

    await db.execute({
      sql: "UPDATE daily_registers SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [reg.id]
    });

    // Calculate tomorrow's date using UTC to prevent timezone offset shifts
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDate = d.toISOString().split('T')[0];

    const nextDayData = await getOrInitRegister(nextDate);

    // Sync tomorrow's opening balances with today's closing balances
    const todayEntriesRes = await db.execute({
      sql: 'SELECT item_id, balance FROM stock_entries WHERE register_id = ?',
      args: [reg.id]
    });

    for (const te of todayEntriesRes.rows) {
      await db.execute({
        sql: `
          UPDATE stock_entries 
          SET opening_balance = ?, 
              total = ? + received, 
              balance = (? + received) - sale 
          WHERE register_id = ? AND item_id = ?
        `,
        args: [te.balance, te.balance, te.balance, nextDayData.register.id, te.item_id]
      });
    }

    res.json({ success: true, message: `Day ${date} closed successfully. Initialized next day ${nextDate}.`, nextDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------
// 5. Reports & Aggregations
// ------------------------------------

app.get('/api/reports/overview', async (req, res) => {
  try {
    const daysRes = await db.execute('SELECT COUNT(*) as count FROM daily_registers');
    const totalDays = Number(daysRes.rows[0].count);

    const totalsRes = await db.execute(`
      SELECT 
        SUM(cash_collected) as total_cash,
        SUM(paytm_collected) as total_paytm,
        SUM(credit_collected) as total_credit,
        SUM(total_sale_entered) as total_sales
      FROM daily_registers
    `);
    const totals = totalsRes.rows[0];

    const purRes = await db.execute('SELECT SUM(amount) as total FROM purchases');
    const totalPurchases = Number(purRes.rows[0].total) || 0;

    const topSellingRes = await db.execute(`
      SELECT i.name, SUM(se.sale) as total_sold, SUM(se.sale * i.unit_price) as estimated_revenue
      FROM stock_entries se
      JOIN items i ON se.item_id = i.id
      GROUP BY i.id
      HAVING total_sold > 0
      ORDER BY total_sold DESC
      LIMIT 6
    `);

    res.json({
      totalDays,
      totals: {
        cash: Number(totals.total_cash) || 0,
        paytm: Number(totals.total_paytm) || 0,
        credit: Number(totals.total_credit) || 0,
        sales: Number(totals.total_sales) || 0,
        purchases: totalPurchases,
        netRevenue: (Number(totals.total_sales) || 0) - totalPurchases
      },
      topSelling: topSellingRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export
app.get('/api/registers/:date/export-csv', async (req, res) => {
  try {
    const { date } = req.params;
    const data = await getOrInitRegister(date);

    let csv = `Cafe Plus - Daily Stock Register\n`;
    csv += `Date: ${date}\n\n`;
    csv += `Category,Item Name,Rate,Opening Balance (O.B),Received (Rec),Total Stock,Sale,Closing Balance,Remarks,Sales Revenue\n`;

    let totalUnitsSold = 0;
    let totalStockRevenue = 0;

    data.entries.forEach(e => {
      const rev = e.sale * e.unit_price;
      totalUnitsSold += e.sale;
      totalStockRevenue += rev;
      csv += `"${e.category_name}","${e.item_name}",${e.unit_price},${e.opening_balance},${e.received},${e.total},${e.sale},${e.balance},"${e.remarks || ''}",${rev}\n`;
    });

    csv += `\nTotal Units Sold: ${totalUnitsSold},Total Stock Value: Rs. ${totalStockRevenue}\n\n`;
    csv += `End of Day Collection Reconciliation:\n`;
    csv += `Payment Mode,Amount (Rs)\n`;
    csv += `Cash,${data.register.cash_collected}\n`;
    csv += `Paytm / UPI,${data.register.paytm_collected}\n`;
    csv += `Credit / Tab,${data.register.credit_collected}\n`;
    csv += `Total Daily Sale,${data.register.total_sale_entered}\n\n`;

    if (data.purchases && data.purchases.length > 0) {
      csv += `Daily Purchases & Expenses:\n`;
      csv += `Item Name,Quantity,Amount (Rs),Remarks\n`;
      let totalPurchasesAmt = 0;
      data.purchases.forEach(p => {
        totalPurchasesAmt += p.amount;
        csv += `"${p.item_name}","${p.quantity || ''}",${p.amount},"${p.remarks || ''}"\n`;
      });
      csv += `Total Purchases,${totalPurchasesAmt}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cafe-plus-register-${date}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static build in standalone production mode
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
