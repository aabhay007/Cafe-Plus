import http from 'node:http';

const PORT = 3001;
const BASE = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('--- STARTING COMPLETE SUITE OF TESTS (TURSO / LIBSQL READY) ---');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 0. Auth Tests
    const failLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Shubham', password: 'wrongpassword' })
    });
    const failLoginData = await failLoginRes.json();
    assert(failLoginRes.status === 401 && failLoginData.error, '0a. Invalid credentials returns 401 Unauthorized');

    const passLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Shubham', password: 'shubham@cafeplus' })
    });
    const passLoginData = await passLoginRes.json();
    assert(passLoginRes.status === 200 && passLoginData.user.name === 'Shubham', '0b. Valid credentials log in successfully as Shubham');

    // 1. Get Categories
    const catRes = await fetch(`${BASE}/categories`);
    const categories = await catRes.json();
    assert(Array.isArray(categories) && categories.length > 0, '1. GET /api/categories returns category array');

    // 2. Add New Category
    const newCatName = 'Desserts & Pastries ' + Date.now();
    const addCatRes = await fetch(`${BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName })
    });
    const addCatData = await addCatRes.json();
    assert(addCatRes.status === 201 && addCatData.name === newCatName, '2. POST /api/categories creates new category');
    const newCatId = addCatData.id;

    // 3. Duplicate Category Check
    const dupRes = await fetch(`${BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400 && dupData.error.includes('already exists'), '3. Duplicate category returns friendly 400 error message');

    // 4. Update / Rename Category
    const renamedCat = newCatName + ' (Updated)';
    const renRes = await fetch(`${BASE}/categories/${newCatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renamedCat })
    });
    const renData = await renRes.json();
    assert(renRes.status === 200 && renData.success, '4. PUT /api/categories/:id renames category');

    // 5. Add New Item under Category
    const addItemRes = await fetch(`${BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: newCatId,
        name: 'Choco Brownie',
        unit_price: 65
      })
    });
    const addItemData = await addItemRes.json();
    assert(addItemRes.status === 201 && addItemData.name === 'Choco Brownie' && addItemData.unit_price === 65, '5. POST /api/items creates new item');
    const newItemId = addItemData.id;

    // 6. Update Item Price
    const updItemRes = await fetch(`${BASE}/items/${newItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit_price: 75 })
    });
    const updItemData = await updItemRes.json();
    assert(updItemRes.status === 200 && updItemData.success, '6. PUT /api/items/:id updates price');

    // 7. Get or Init Register for a Date
    const testDate = '2026-11-05';
    const regRes = await fetch(`${BASE}/registers/${testDate}`);
    const regData = await regRes.json();
    assert(regRes.status === 200 && regData.register.date === testDate, '7. GET /api/registers/:date loads/inits register');
    
    // Check if new item exists in the register
    const hasItem = regData.entries.some(e => e.item_id === newItemId);
    assert(hasItem, '8. Newly added item automatically appears in active register');

    // 8. Update Stock Entries
    const entryToUpdate = regData.entries.find(e => e.item_id === newItemId);
    const stockUpdateRes = await fetch(`${BASE}/registers/${testDate}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: [{
          item_id: newItemId,
          opening_balance: 10,
          received: 5,
          total: 15,
          sale: 4,
          balance: 11,
          remarks: '01 sample'
        }]
      })
    });
    const stockUpdateData = await stockUpdateRes.json();
    assert(stockUpdateRes.status === 200 && stockUpdateData.success, '9. PUT /api/registers/:date/stock updates stock');

    // Verify stock entry updated in DB
    const verifyStockRes = await fetch(`${BASE}/registers/${testDate}`);
    const verifyStockData = await verifyStockRes.json();
    const updatedEntry = verifyStockData.entries.find(e => e.item_id === newItemId);
    assert(updatedEntry && updatedEntry.opening_balance === 10 && updatedEntry.sale === 4 && updatedEntry.balance === 11, '10. Stock entry values verified (OB: 10, Rec: 5, Total: 15, Sale: 4, Bal: 11)');

    // 9. Update EOD Settlement (Reconciliation)
    const setRes = await fetch(`${BASE}/registers/${testDate}/settlement`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cash_collected: 500,
        paytm_collected: 8500,
        credit_collected: 1200,
        total_sale_entered: 10200,
        notes: 'Smooth operations today'
      })
    });
    const setData = await setRes.json();
    assert(setRes.status === 200 && setData.success, '11. PUT /api/registers/:date/settlement saves Cash/Paytm/Credit');

    // 10. Add Daily Purchase / Expense
    const purRes = await fetch(`${BASE}/registers/${testDate}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: 'Amul Milk Crates',
        quantity: '10 Packets',
        amount: 600,
        remarks: 'Dairy vendor'
      })
    });
    const purData = await purRes.json();
    assert(purRes.status === 201 && purData.amount === 600, '12. POST /api/registers/:date/purchases records expense');
    const purId = purData.id;

    // 11. Delete Purchase
    const delPurRes = await fetch(`${BASE}/purchases/${purId}`, { method: 'DELETE' });
    const delPurData = await delPurRes.json();
    assert(delPurRes.status === 200 && delPurData.success, '13. DELETE /api/purchases/:id removes expense');

    // 12. Close Day & Rollover to Tomorrow
    const closeRes = await fetch(`${BASE}/registers/${testDate}/close-and-rollover`, { method: 'POST' });
    const closeData = await closeRes.json();
    assert(closeRes.status === 200 && closeData.nextDate === '2026-11-06', '14. POST /api/registers/:date/close-and-rollover advances to next date 2026-11-06');

    // 13. Verify Rollover: Tomorrow's Opening Balance must equal Today's Closing Balance (11)
    const nextDayRes = await fetch(`${BASE}/registers/2026-11-06`);
    const nextDayData = await nextDayRes.json();
    const nextDayItem = nextDayData.entries.find(e => e.item_id === newItemId);
    assert(nextDayItem && nextDayItem.opening_balance === 11, '15. Rollover Verified: Tomorrow OB equals Today Closing Balance (11 units)');

    // 14. Overview Report
    const repRes = await fetch(`${BASE}/reports/overview`);
    const repData = await repRes.json();
    assert(repRes.status === 200 && repData.totals.sales > 0, '16. GET /api/reports/overview calculates cumulative statistics');

    // 15. Export CSV
    const csvRes = await fetch(`${BASE}/registers/${testDate}/export-csv`);
    const csvText = await csvRes.text();
    assert(csvRes.status === 200 && csvText.includes('Cafe Plus - Daily Stock Register'), '17. GET /api/registers/:date/export-csv produces clean CSV sheet');

    // 16. Delete Item & Delete Category
    await fetch(`${BASE}/items/${newItemId}`, { method: 'DELETE' });
    const delCatRes = await fetch(`${BASE}/categories/${newCatId}`, { method: 'DELETE' });
    const delCatData = await delCatRes.json();
    assert(delCatRes.status === 200 && delCatData.success, '18. DELETE /api/categories/:id deletes category cleanly');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is already running, otherwise start it
fetch(`http://localhost:${PORT}/api/categories`)
  .then(() => {
    console.log(`Connected to existing server on port ${PORT}...`);
    runTests();
  })
  .catch(() => {
    import('./server/index.js').then(() => {
      setTimeout(runTests, 1000);
    });
  });
