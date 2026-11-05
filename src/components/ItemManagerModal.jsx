import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit2, Trash2, Check, Tag, FolderPlus, 
  Layers, AlertCircle, CheckCircle2, ChevronRight 
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { api } from '../services/api';

export default function ItemManagerModal({ isOpen, onClose, onRefreshData }) {
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'categories'
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [pendingDelete, setPendingDelete] = useState(null); // { type: 'item'|'category', id, name }

  // New item form state
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState('');

  // New category form state
  const [newCatName, setNewCatName] = useState('');

  // Edit states
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');

  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  const showStatus = (text, type = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
      if (data.length > 0) {
        // Keep current selection if valid, else pick first
        setSelectedCatId(prev => {
          const exists = data.some(c => c.id === Number(prev));
          return exists ? prev : String(data[0].id);
        });
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      loadData();
    }
  }, [isOpen]);

  // Handle Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showStatus('Please enter a category name', 'error');
      return;
    }

    try {
      const created = await api.addCategory({ name: newCatName.trim() });
      setNewCatName('');
      showStatus(`Category "${created.name}" created successfully!`);
      await loadData();
      setSelectedCatId(String(created.id));
      onRefreshData();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Handle Edit Category
  const handleSaveCatEdit = async (catId) => {
    if (!editCatName.trim()) return;
    try {
      await api.updateCategory(catId, { name: editCatName.trim() });
      setEditingCatId(null);
      showStatus('Category renamed successfully');
      await loadData();
      onRefreshData();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = (cat) => {
    setPendingDelete({ type: 'category', id: cat.id, name: cat.name });
  };

  // Handle Delete Item
  const handleDeleteItem = (itemId, itemName) => {
    setPendingDelete({ type: 'item', id: itemId, name: itemName });
  };

  // Execute confirmed delete
  const executeConfirmedDelete = async () => {
    if (!pendingDelete) return;
    const { type, id, name } = pendingDelete;
    setPendingDelete(null);

    try {
      if (type === 'category') {
        await api.deleteCategory(id);
        showStatus(`Category "${name}" deleted.`);
      } else {
        await api.deleteItem(id);
        showStatus(`Item "${name}" removed from menu.`);
      }
      await loadData();
      onRefreshData();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Handle Add Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !selectedCatId) {
      showStatus('Please fill in item name and select a category', 'error');
      return;
    }

    try {
      const added = await api.addItem({
        category_id: parseInt(selectedCatId, 10),
        name: newItemName.trim(),
        unit_price: parseFloat(newUnitPrice) || 0
      });
      setNewItemName('');
      setNewUnitPrice('');
      showStatus(`Item "${added.name}" added to menu!`);
      await loadData();
      onRefreshData();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Handle Edit Item
  const handleSaveItemEdit = async (itemId) => {
    if (!editItemName.trim()) return;
    try {
      await api.updateItem(itemId, {
        name: editItemName.trim(),
        unit_price: parseFloat(editItemPrice) || 0
      });
      setEditingItemId(null);
      showStatus('Item updated successfully');
      await loadData();
      onRefreshData();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Menu & Category Master
              </h2>
              <p className="text-xs text-slate-500">
                Configure cafe items, prices, and register categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 sm:px-5 bg-white">
          <button
            onClick={() => { setActiveTab('items'); setStatusMessage(null); }}
            className={`py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'items'
                ? 'border-amber-700 text-amber-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Menu Items ({categories.reduce((s, c) => s + (c.items?.length || 0), 0)})</span>
          </button>

          <button
            onClick={() => { setActiveTab('categories'); setStatusMessage(null); }}
            className={`py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'border-amber-700 text-amber-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>
        </div>

        {/* Status Message Notification Bar */}
        {statusMessage && (
          <div className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b transition-all ${
            statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading menu configuration...</div>
          ) : activeTab === 'categories' ? (
            /* ============================================================ */
            /* CATEGORIES MANAGEMENT TAB                                     */
            /* ============================================================ */
            <div className="space-y-4">
              
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1">
                  <FolderPlus className="w-3.5 h-3.5 text-amber-700" /> Add New Category
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Pastries, Desserts, Tea..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-2xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    + Add Category
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Existing Categories ({categories.length})
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-150 overflow-hidden">
                  {categories.map((cat, index) => {
                    const isEditing = editingCatId === cat.id;
                    const itemCount = cat.items?.length || 0;

                    return (
                      <div key={cat.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2 mr-2">
                            <input
                              type="text"
                              value={editCatName}
                              onChange={(e) => setEditCatName(e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs border border-amber-400 rounded-md focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCatEdit(cat.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Save Name"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2.5">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <div>
                                <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                                <span className="text-xs text-slate-400 ml-2">
                                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditCatName(cat.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-800 rounded-lg hover:bg-amber-50 transition-colors"
                                title="Rename Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {itemCount === 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Delete Empty Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* ============================================================ */
            /* MENU ITEMS TAB                                               */
            /* ============================================================ */
            <div className="space-y-4">
              
              {/* Add Item Form */}
              <form onSubmit={handleAddItem} className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center justify-between">
                  <span>+ Add New Menu Item</span>
                  {categories.length === 0 && (
                    <span className="text-rose-600 lowercase font-normal">
                      (Create a category first!)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="sm:col-span-2 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Item Name (e.g. 40 Cookies)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                    className="sm:col-span-3 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />

                  <div className="sm:col-span-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Rate"
                      value={newUnitPrice}
                      onChange={(e) => setNewUnitPrice(e.target.value)}
                      required
                      className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-1 px-3 py-1.5 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors shadow-2xs"
                  >
                    + Add
                  </button>
                </div>
              </form>

              {/* Items Grouped by Category */}
              <div className="space-y-3">
                {categories.map(cat => (
                  <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-100/90 px-3.5 py-2 font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>📁 {cat.name}</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {cat.items?.length || 0} items
                      </span>
                    </div>

                    <div className="divide-y divide-slate-150 bg-white">
                      {cat.items?.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 text-xs italic">
                          No items in this category yet.
                        </div>
                      ) : (
                        cat.items.map(item => {
                          const isEditing = editingItemId === item.id;

                          return (
                            <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                              {isEditing ? (
                                <div className="flex-1 flex items-center gap-2 mr-2">
                                  <input
                                    type="text"
                                    value={editItemName}
                                    onChange={(e) => setEditItemName(e.target.value)}
                                    className="flex-1 px-2.5 py-1 text-xs border border-amber-400 rounded-md focus:outline-none"
                                  />
                                  <div className="relative w-20">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">₹</span>
                                    <input
                                      type="number"
                                      value={editItemPrice}
                                      onChange={(e) => setEditItemPrice(e.target.value)}
                                      className="w-full pl-5 pr-1 py-1 text-xs border border-amber-400 rounded-md font-mono"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveItemEdit(item.id)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Save changes"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                                      {item.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      ₹{item.unit_price}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItemId(item.id);
                                        setEditItemName(item.name);
                                        setEditItemPrice(item.unit_price);
                                      }}
                                      className="p-1 text-slate-400 hover:text-amber-800 rounded transition-colors"
                                      title="Edit Price/Name"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(item.id, item.name)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                      title="Remove from Menu"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[11px] text-slate-400">
            Changes are saved immediately to your database.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

      </div>

      {/* Custom Confirmation Dialog (No native browser alerts) */}
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'category' ? 'Delete Category?' : 'Remove Menu Item?'}
        message={
          pendingDelete?.type === 'category'
            ? `Are you sure you want to delete category "${pendingDelete?.name}"?`
            : `Are you sure you want to remove "${pendingDelete?.name}" from your active menu?`
        }
        confirmText={pendingDelete?.type === 'category' ? 'Delete Category' : 'Remove Item'}
        cancelText="Cancel"
        variant="danger"
        iconType="danger"
        onConfirm={executeConfirmedDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
