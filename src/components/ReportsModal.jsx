import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, ArrowUpRight, Award, DollarSign } from 'lucide-react';
import { api } from '../services/api';

export default function ReportsModal({ isOpen, onClose, onSelectDate }) {
  const [reportData, setReportData] = useState(null);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([api.getOverviewReport(), api.getRegisteredDates()])
        .then(([rep, dts]) => {
          setReportData(rep);
          setDates(dts);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totals = reportData?.totals || {};
  const topSelling = reportData?.topSelling || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Cafe Plus — Business Overview & Reports
            </h2>
            <p className="text-xs text-slate-500">
              Cumulative financial metrics & sales performance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading reports...</div>
          ) : (
            <>
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70">
                  <span className="text-[10px] font-bold uppercase text-amber-800">Total Sales</span>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-amber-950 mt-0.5">
                    ₹{(totals.sales || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/70">
                  <span className="text-[10px] font-bold uppercase text-blue-800">Paytm / UPI</span>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-blue-950 mt-0.5">
                    ₹{(totals.paytm || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/70">
                  <span className="text-[10px] font-bold uppercase text-emerald-800">Cash In Hand</span>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-950 mt-0.5">
                    ₹{(totals.cash || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/70">
                  <span className="text-[10px] font-bold uppercase text-purple-800">Credit (Udhar)</span>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-purple-950 mt-0.5">
                    ₹{(totals.credit || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Expenses / Purchases</span>
                  <div className="text-base font-mono font-bold text-rose-400">
                    ₹{(totals.purchases || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Net Cumulative Profit</span>
                  <div className="text-xl font-mono font-extrabold text-emerald-400">
                    ₹{(totals.netRevenue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Top Selling Items */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" /> Top Selling Items
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topSelling.map((item, idx) => (
                    <div key={item.name} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-900 block font-mono">
                          {item.total_sold} sold
                        </span>
                        <span className="text-[11px] text-emerald-700 font-mono">
                          ₹{item.estimated_revenue?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Registered Dates */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" /> Past Registered Days
                </h3>
                <div className="divide-y divide-slate-150 border border-slate-200 rounded-xl overflow-hidden">
                  {dates.map(d => (
                    <div 
                      key={d.date} 
                      onClick={() => { onSelectDate(d.date); onClose(); }}
                      className="p-3 flex items-center justify-between hover:bg-amber-50/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800 font-mono">{d.date}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          d.status === 'closed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          ₹{d.total_sale_entered?.toLocaleString('en-IN')}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => {
              if (dates.length > 0) {
                window.location.href = api.getExportUrl(dates[0].date);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
          >
            <span>📥 Export Latest CSV</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
