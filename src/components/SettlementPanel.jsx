import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Banknote, Smartphone, CheckCircle, 
  AlertTriangle, Save, RefreshCw, Calculator, ArrowRight 
} from 'lucide-react';

export default function SettlementPanel({
  register,
  stockEntries,
  onSaveSettlement,
  isSaving
}) {
  const [cash, setCash] = useState(register.cash_collected || 0);
  const [paytm, setPaytm] = useState(register.paytm_collected || 0);
  const [credit, setCredit] = useState(register.credit_collected || 0);
  const [notes, setNotes] = useState(register.notes || '');

  // Keep local state in sync when register changes (e.g. date change)
  useEffect(() => {
    setCash(register.cash_collected || 0);
    setPaytm(register.paytm_collected || 0);
    setCredit(register.credit_collected || 0);
    setNotes(register.notes || '');
  }, [register]);

  const totalReconciled = (parseFloat(cash) || 0) + (parseFloat(paytm) || 0) + (parseFloat(credit) || 0);
  
  // Calculated sales value from the items in the register table
  const totalStockSalesValue = stockEntries.reduce((sum, item) => {
    return sum + ((item.sale || 0) * (item.unit_price || 0));
  }, 0);

  const variance = totalReconciled - totalStockSalesValue;
  const isMatch = Math.abs(variance) < 1;

  const handleSave = () => {
    onSaveSettlement({
      cash_collected: parseFloat(cash) || 0,
      paytm_collected: parseFloat(paytm) || 0,
      credit_collected: parseFloat(credit) || 0,
      total_sale_entered: totalReconciled,
      notes
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight">
              EOD Revenue & Settlement
            </h2>
            <p className="text-[11px] text-slate-300">
              Cash, Paytm/UPI & Credit reconciliation
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* 3 Payment Mode Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Paytm / UPI */}
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Paytm / UPI
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                Digital
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-900">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={paytm === 0 ? '' : paytm}
                onChange={(e) => setPaytm(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 text-base font-mono font-bold text-blue-950 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Cash In Hand */}
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                Drawer
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-900">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={cash === 0 ? '' : cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 text-base font-mono font-bold text-emerald-950 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Credit / Udhar */}
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Credit (Udhar)
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                Tab
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-900">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={credit === 0 ? '' : credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 text-base font-mono font-bold text-amber-950 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

        </div>

        {/* Total Settlement Calculation Card */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Day Sales Reconciled
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-400">
              ₹ {totalReconciled.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Paytm (₹{parseFloat(paytm)||0}) + Cash (₹{parseFloat(cash)||0}) + Credit (₹{parseFloat(credit)||0})
            </div>
          </div>

          {/* Cross-Verification with Item Stock Value */}
          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-700/80 pt-2 sm:pt-0 sm:pl-4">
            <span className="text-xs font-semibold text-slate-400 block">
              Calculated Stock Sales
            </span>
            <div className="text-lg font-mono font-bold text-slate-200">
              ₹ {totalStockSalesValue.toLocaleString('en-IN')}
            </div>
            
            {/* Variance Badge */}
            <div className="mt-1">
              {isMatch ? (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  <CheckCircle className="w-3 h-3 mr-1" /> Exactly Matches Stock
                </span>
              ) : (
                <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  variance > 0 
                    ? 'text-sky-300 bg-sky-950/60 border border-sky-500/30'
                    : 'text-amber-300 bg-amber-950/60 border border-amber-500/30'
                }`}>
                  <AlertTriangle className="w-3 h-3 mr-1" /> 
                  Diff: {variance > 0 ? `+₹${variance}` : `-₹${Math.abs(variance)}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* EOD Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Day Notes & Staff Comments
          </label>
          <input
            type="text"
            placeholder="Add any special notes, register differences, staff on duty..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>
    </div>
  );
}
