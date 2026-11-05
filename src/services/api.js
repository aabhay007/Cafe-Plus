const BASE_URL = '/api';

async function handleResponse(res, defaultError = 'Request failed') {
  if (!res.ok) {
    let message = defaultError;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch {
      // response wasn't JSON
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res, 'Authentication failed');
  },

  // Register
  getRegister: async (date) => {
    const res = await fetch(`${BASE_URL}/registers/${date}`);
    return handleResponse(res, `Failed to load register for ${date}`);
  },

  updateStockEntries: async (date, entries) => {
    const res = await fetch(`${BASE_URL}/registers/${date}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    return handleResponse(res, 'Failed to save stock entries');
  },

  updateSingleStockItem: async (date, itemData) => {
    const res = await fetch(`${BASE_URL}/registers/${date}/stock/item`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    return handleResponse(res, 'Failed to update stock item');
  },

  updateSettlement: async (date, settlementData) => {
    const res = await fetch(`${BASE_URL}/registers/${date}/settlement`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settlementData),
    });
    return handleResponse(res, 'Failed to update settlement');
  },

  // Purchases
  addPurchase: async (date, purchaseData) => {
    const res = await fetch(`${BASE_URL}/registers/${date}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData),
    });
    return handleResponse(res, 'Failed to add purchase');
  },

  deletePurchase: async (id) => {
    const res = await fetch(`${BASE_URL}/purchases/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res, 'Failed to delete purchase');
  },

  // Day Close & Rollover
  closeAndRolloverDay: async (date) => {
    const res = await fetch(`${BASE_URL}/registers/${date}/close-and-rollover`, {
      method: 'POST',
    });
    return handleResponse(res, 'Failed to close day and carry forward');
  },

  // Dates
  getRegisteredDates: async () => {
    const res = await fetch(`${BASE_URL}/registers/dates`);
    return handleResponse(res, 'Failed to fetch registered dates');
  },

  // Categories
  getCategories: async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    return handleResponse(res, 'Failed to fetch categories');
  },

  addCategory: async (categoryData) => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    return handleResponse(res, 'Failed to add category');
  },

  updateCategory: async (id, categoryData) => {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    return handleResponse(res, 'Failed to update category');
  },

  deleteCategory: async (id) => {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res, 'Failed to delete category');
  },

  // Items
  getItems: async () => {
    const res = await fetch(`${BASE_URL}/items`);
    return handleResponse(res, 'Failed to fetch items');
  },

  addItem: async (itemData) => {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    return handleResponse(res, 'Failed to add item');
  },

  updateItem: async (id, itemData) => {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    return handleResponse(res, 'Failed to update item');
  },

  deleteItem: async (id) => {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res, 'Failed to delete item');
  },

  // Reports
  getOverviewReport: async () => {
    const res = await fetch(`${BASE_URL}/reports/overview`);
    return handleResponse(res, 'Failed to fetch overview report');
  },

  getExportUrl: (date) => `${BASE_URL}/registers/${date}/export-csv`,
};
