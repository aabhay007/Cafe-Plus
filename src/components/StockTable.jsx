import React, { useState } from 'react';
import { Search, Tag, Sparkles } from 'lucide-react';

export default function StockTable({
  entries,
  onEntryChange,
  isRegisterClosed,
  onOpenItemManager,
  exportUrl
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Filter entries
  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || e.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Group by category
  const categories = Array.from(new Set(entries.map(e => e.category_name)));
  const groupedEntries = categories.reduce((acc, cat) => {
    const items = filteredEntries.filter(e => e.category_name === cat);
    if (items.length > 0) {
      acc[cat] = items;
    }
    return acc;
  }, {});

  // Overall totals
  const totalOpening = entries.reduce((s, e) => s + (e.opening_balance || 0), 0);
  const totalReceived = entries.reduce((s, e) => s + (e.received || 0), 0);
  const totalStock = entries.reduce((s, e) => s + (e.total || 0), 0);
  const totalSalesQty = entries.reduce((s, e) => s + (e.sale || 0), 0);
  const totalClosing = entries.reduce((s, e) => s + (e.balance || 0), 0);
  const totalSalesRevenue = entries.reduce((s, e) => s + ((e.sale || 0) * (e.unit_price || 0)), 0);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-700 underline px-1"
            >
              Clear
            </button>
          )}

          {onOpenItemManager && (
            <button
              onClick={onOpenItemManager}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors whitespace-nowrap"
            >
              <span>+ Add Item</span>
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Items ({entries.length})
          </button>
          {categories.map(cat => {
            const count = entries.filter(e => e.category_name === cat).length;
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isSel
                    ? 'bg-amber-700 text-white shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Register Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
              <th className="py-3 px-3 sm:px-4 w-44">Item Name</th>
              <th className="py-3 px-2 sm:px-3 text-right w-20">Rate</th>
              <th className="py-3 px-2 sm:px-3 text-center w-20 bg-slate-200/50" title="Opening Balance">
                O.B.
              </th>
              <th className="py-3 px-2 sm:px-3 text-center w-20" title="Received Stock Today">
                Rec.
              </th>
              <th className="py-3 px-2 sm:px-3 text-center w-20 bg-amber-50/70 font-extrabold text-amber-950" title="Total Available = O.B. + Rec.">
                Total
              </th>
              <th className="py-3 px-2 sm:px-3 text-center w-20 bg-blue-50/70 font-extrabold text-blue-950" title="Quantity Sold Today">
                Sale
              </th>
              <th className="py-3 px-2 sm:px-3 text-center w-20 bg-emerald-50/70 font-extrabold text-emerald-950" title="Closing Balance = Total - Sale">
                Balance
              </th>
              <th className="py-3 px-3 sm:px-4 w-40">Remarks / Notes</th>
              <th className="py-3 px-3 sm:px-4 text-right w-24">Sales Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {Object.keys(groupedEntries).length === 0 ? (
              <tr>
                <td colSpan="9" className="py-10 text-center text-slate-400">
                  No items found matching your filter.
                </td>
              </tr>
            ) : (
              Object.entries(groupedEntries).map(([category, items]) => {
                const catSalesQty = items.reduce((s, i) => s + (i.sale || 0), 0);
                const catSalesVal = items.reduce((s, i) => s + ((i.sale || 0) * (i.unit_price || 0)), 0);

                return (
                  <React.Fragment key={category}>
                    {/* Category Header Row */}
                    <tr className="bg-slate-50/80 font-bold text-slate-700 border-t-2 border-slate-200/80">
                      <td colSpan="5" className="py-2 px-3 sm:px-4 text-xs tracking-wide text-amber-900 uppercase">
                        📁 {category} <span className="font-normal text-slate-500 lowercase">({items.length} items)</span>
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-center text-xs text-blue-900 font-extrabold bg-blue-50/40">
                        {catSalesQty}
                      </td>
                      <td colSpan="2" className="py-2 px-2 sm:px-3"></td>
                      <td className="py-2 px-3 sm:px-4 text-right text-xs text-slate-900 font-mono font-bold">
                        ₹ {catSalesVal.toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {/* Category Item Rows */}
                    {items.map((item) => {
                      const itemRev = (item.sale || 0) * (item.unit_price || 0);
                      const isLowStock = item.balance <= 2 && item.balance >= 0;
                      const hasRemark = item.remarks && item.remarks.trim().length > 0;

                      return (
                        <tr 
                          key={item.entry_id || item.item_id} 
                          className="hover:bg-amber-50/30 transition-colors group"
                        >
                          {/* Item Name */}
                          <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-800">
                            <div className="flex items-center space-x-1.5">
                              <span>{item.item_name}</span>
                              {hasRemark && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                                  {item.remarks}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Unit Rate */}
                          <td className="py-2.5 px-2 sm:px-3 text-right font-mono text-xs text-slate-600">
                            ₹{item.unit_price}
                          </td>

                          {/* Opening Balance (O.B.) */}
                          <td className="py-1.5 px-1 sm:px-2 text-center bg-slate-50/50">
                            <input
                              type="number"
                              min="0"
                              value={item.opening_balance === 0 ? '0' : item.opening_balance || ''}
                              onChange={(e) => {
                                const ob = parseInt(e.target.value, 10) || 0;
                                const tot = ob + (item.received || 0);
                                const bal = tot - (item.sale || 0);
                                onEntryChange(item.item_id, {
                                  opening_balance: ob,
                                  total: tot,
                                  balance: bal
                                });
                              }}
                              className="w-16 py-1 px-1.5 text-center font-mono font-medium text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                            />
                          </td>

                          {/* Received (Rec.) */}
                          <td className="py-1.5 px-1 sm:px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              placeholder="-"
                              value={item.received === 0 ? '' : item.received}
                              onChange={(e) => {
                                const rec = parseInt(e.target.value, 10) || 0;
                                const tot = (item.opening_balance || 0) + rec;
                                const bal = tot - (item.sale || 0);
                                onEntryChange(item.item_id, {
                                  received: rec,
                                  total: tot,
                                  balance: bal
                                });
                              }}
                              className="w-16 py-1 px-1.5 text-center font-mono font-medium text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                            />
                          </td>

                          {/* Total (O.B. + Rec.) */}
                          <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-bold text-amber-950 bg-amber-50/50">
                            {item.total || 0}
                          </td>

                          {/* Sale (Units Sold) */}
                          <td className="py-1.5 px-1 sm:px-2 text-center bg-blue-50/30">
                            <input
                              type="number"
                              min="0"
                              max={item.total || 9999}
                              placeholder="-"
                              value={item.sale === 0 ? '' : item.sale}
                              onChange={(e) => {
                                const sale = parseInt(e.target.value, 10) || 0;
                                const bal = (item.total || 0) - sale;
                                onEntryChange(item.item_id, {
                                  sale: sale,
                                  balance: bal
                                });
                              }}
                              className="w-16 py-1 px-1.5 text-center font-mono font-bold text-blue-900 bg-blue-50/60 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                            />
                          </td>

                          {/* Balance (Closing Count) */}
                          <td className="py-1.5 px-1 sm:px-2 text-center bg-emerald-50/30">
                            <input
                              type="number"
                              min="0"
                              value={item.balance === 0 ? '0' : item.balance || ''}
                              onChange={(e) => {
                                const bal = parseInt(e.target.value, 10) || 0;
                                const sale = (item.total || 0) - bal;
                                onEntryChange(item.item_id, {
                                  balance: bal,
                                  sale: sale >= 0 ? sale : 0
                                });
                              }}
                              className={`w-16 py-1 px-1.5 text-center font-mono font-bold rounded-md border focus:outline-none focus:ring-2 ${
                                isLowStock
                                  ? 'text-rose-700 bg-rose-50/60 border-rose-200 focus:ring-rose-400'
                                  : 'text-emerald-900 bg-emerald-50/60 border-emerald-200 focus:ring-emerald-400'
                              }`}
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-1.5 px-2 sm:px-3">
                            <input
                              type="text"
                              placeholder="e.g. 02 credit"
                              value={item.remarks || ''}
                              onChange={(e) => {
                                onEntryChange(item.item_id, {
                                  remarks: e.target.value
                                });
                              }}
                              className="w-full py-1 px-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                            />
                          </td>

                          {/* Item Sales Revenue */}
                          <td className="py-2.5 px-3 sm:px-4 text-right font-mono font-semibold text-slate-800">
                            {itemRev > 0 ? (
                              <span className="text-emerald-700">₹{itemRev.toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* Table Footer Totals */}
          <tfoot>
            <tr className="bg-slate-200/90 text-slate-900 font-extrabold text-xs sm:text-sm border-t-2 border-slate-300">
              <td className="py-3 px-3 sm:px-4 uppercase tracking-wider">Grand Total</td>
              <td className="py-3 px-2 sm:px-3 text-right text-slate-500 font-normal">--</td>
              <td className="py-3 px-2 sm:px-3 text-center font-mono">{totalOpening}</td>
              <td className="py-3 px-2 sm:px-3 text-center font-mono text-amber-900">+{totalReceived}</td>
              <td className="py-3 px-2 sm:px-3 text-center font-mono text-amber-950 bg-amber-100/60">{totalStock}</td>
              <td className="py-3 px-2 sm:px-3 text-center font-mono text-blue-900 bg-blue-100/60">{totalSalesQty}</td>
              <td className="py-3 px-2 sm:px-3 text-center font-mono text-emerald-900 bg-emerald-100/60">{totalClosing}</td>
              <td className="py-3 px-2 sm:px-3 text-slate-500 font-normal text-xs">Total Units Sold: {totalSalesQty}</td>
              <td className="py-3 px-3 sm:px-4 text-right font-mono text-emerald-800 text-sm">
                ₹ {totalSalesRevenue.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
