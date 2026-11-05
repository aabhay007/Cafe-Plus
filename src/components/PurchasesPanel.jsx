import React, { useState } from 'react';
import { ShoppingBag, Plus, Trash2, TrendingDown } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function PurchasesPanel({
  purchases,
  onAddPurchase,
  onDeletePurchase,
  totalDailySales
}) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);

  const totalPurchases = purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const netProfit = (parseFloat(totalDailySales) || 0) - totalPurchases;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!itemName.trim() || !amount) return;

    onAddPurchase({
      item_name: itemName.trim(),
      quantity: quantity.trim(),
      amount: parseFloat(amount) || 0,
      remarks: remarks.trim()
    });

    setItemName('');
    setQuantity('');
    setAmount('');
    setRemarks('');
    setIsAdding(false);
  };

  const confirmDelete = () => {
    if (purchaseToDelete) {
      onDeletePurchase(purchaseToDelete.id);
      setPurchaseToDelete(null);
    }
  };

  const quickSuggestions = ['Bananas', 'Dairy Milk', 'Bread / Buns', 'Disposables', 'Tea / Coffee Powder'];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Daily Purchases & Expenses
            </h2>
            <p className="text-[11px] text-slate-500">
              Kitchen supplies, raw materials & procurement
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg border border-rose-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Close' : 'Add Expense'}</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Add Form */}
        {isAdding && (
          <form onSubmit={handleAdd} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-700">Add New Purchase / Expense</div>
            
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {quickSuggestions.map(sug => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => setItemName(sug)}
                  className="px-2 py-0.5 text-[11px] bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 transition-colors"
                >
                  +{sug}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Item name (e.g. Bananas)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                className="py-1.5 px-3 text-xs sm:col-span-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <input
                type="text"
                placeholder="Qty (e.g. 2 Dozen)"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full pl-6 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <input
                type="text"
                placeholder="Optional notes or vendor..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="flex-1 mr-2 py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                Add Item
              </button>
            </div>
          </form>
        )}

        {/* Purchases List */}
        {purchases.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No purchases logged for this date.
          </div>
        ) : (
          <div className="divide-y divide-slate-150">
            {purchases.map(p => (
              <div key={p.id} className="py-2.5 flex items-center justify-between group">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800 text-sm">{p.item_name}</span>
                    {p.quantity && (
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {p.quantity}
                      </span>
                    )}
                  </div>
                  {p.remarks && (
                    <p className="text-xs text-slate-500 mt-0.5">{p.remarks}</p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => setPurchaseToDelete(p)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Total Purchases</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              ₹ {totalPurchases.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-500 block">Est. Net Profit</span>
            <span className={`font-mono font-bold text-sm ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹ {netProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Purchase Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(purchaseToDelete)}
        title="Delete Expense Entry?"
        message={`Are you sure you want to remove "${purchaseToDelete?.item_name}" (₹${purchaseToDelete?.amount})?`}
        confirmText="Delete Expense"
        cancelText="Cancel"
        variant="danger"
        iconType="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPurchaseToDelete(null)}
      />
    </div>
  );
}
