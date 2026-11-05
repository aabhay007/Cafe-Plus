import React, { useState } from 'react';
import { Search, Plus, Minus, Tag, AlertCircle, ArrowRight } from 'lucide-react';

export default function StockMobileCards({
  entries,
  onEntryChange,
  onOpenItemManager,
  exportUrl
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = Array.from(new Set(entries.map(e => e.category_name)));

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || e.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-3">
      {/* Mobile Top Action Bar: Add Item/Category & Export */}
      <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={onOpenItemManager}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-amber-900 bg-amber-50 active:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
        >
          <Plus className="w-4 h-4 text-amber-700" />
          <span>+ Add Item / Category</span>
        </button>

        {exportUrl && (
          <a
            href={exportUrl}
            download
            className="inline-flex items-center gap-1 py-1.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            title="Download CSV"
          >
            <span>📥 Export CSV</span>
          </a>
        )}
      </div>

      {/* Search and Category filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search item name or price..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All ({entries.length})
          </button>
          {categories.map(cat => {
            const count = entries.filter(e => e.category_name === cat).length;
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-amber-700 text-white shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-2.5">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No items found matching "{searchTerm}"
          </div>
        ) : (
          filteredEntries.map(item => {
            const itemRev = (item.sale || 0) * (item.unit_price || 0);
            const isLow = (item.balance || 0) <= 2;

            return (
              <div 
                key={item.entry_id || item.item_id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-3"
              >
                {/* Header: Item name + Rate + Revenue */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block mb-1">
                      {item.category_name}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {item.item_name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      ₹{item.unit_price} / unit
                    </span>
                    {itemRev > 0 && (
                      <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                        ₹{itemRev.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4 Metrics Matrix: O.B. | Rec. | Total | Balance */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-center">
                  {/* O.B. */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5" title="Opening Balance">
                      O.B.
                    </span>
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
                      className="w-full py-1 text-center font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Rec. */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5" title="Received Stock">
                      Rec.
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
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
                      className="w-full py-1 text-center font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Total */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-800 block mb-0.5" title="Total Available">
                      Total
                    </span>
                    <div className="py-1 font-mono font-extrabold text-sm text-amber-950 bg-amber-100/60 rounded-lg border border-amber-200/60">
                      {item.total || 0}
                    </div>
                  </div>

                  {/* Balance */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-0.5" title="Closing Balance">
                      Closing
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={item.balance === 0 ? '0' : item.balance || ''}
                      onChange={(e) => {
                        const bal = parseInt(e.target.value, 10) || 0;
                        const s = (item.total || 0) - bal;
                        onEntryChange(item.item_id, {
                          balance: bal,
                          sale: s >= 0 ? s : 0
                        });
                      }}
                      className={`w-full py-1 text-center font-mono font-bold text-sm rounded-lg border focus:outline-none ${
                        isLow
                          ? 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-1 focus:ring-rose-400'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-200 focus:ring-1 focus:ring-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Sales Stepper: Touch friendly */}
                <div className="flex items-center justify-between gap-3 bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-900">
                    Units Sold Today:
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = item.sale || 0;
                        if (cur > 0) {
                          const s = cur - 1;
                          onEntryChange(item.item_id, {
                            sale: s,
                            balance: (item.total || 0) - s
                          });
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-white border border-blue-200 text-blue-800 flex items-center justify-center font-bold active:scale-95 transition-transform"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      max={item.total || 9999}
                      value={item.sale === 0 ? '0' : item.sale || ''}
                      onChange={(e) => {
                        const s = parseInt(e.target.value, 10) || 0;
                        onEntryChange(item.item_id, {
                          sale: s,
                          balance: (item.total || 0) - s
                        });
                      }}
                      className="w-14 py-1 text-center font-mono font-extrabold text-blue-950 text-base bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const cur = item.sale || 0;
                        const s = cur + 1;
                        onEntryChange(item.item_id, {
                          sale: s,
                          balance: (item.total || 0) - s
                        });
                      }}
                      className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold active:scale-95 transition-transform shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Remarks & Quick Tags */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Remarks (e.g. 02 credit)"
                    value={item.remarks || ''}
                    onChange={(e) => onEntryChange(item.item_id, { remarks: e.target.value })}
                    className="flex-1 py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {/* Quick credit shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      const cur = item.remarks || '';
                      const next = cur ? `${cur}, credit` : '01 credit';
                      onEntryChange(item.item_id, { remarks: next });
                    }}
                    className="px-2 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 rounded-lg border border-amber-200 whitespace-nowrap active:scale-95"
                  >
                    + Credit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
