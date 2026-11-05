import React, { useState, useRef, useEffect } from 'react';
import { 
  Coffee, Calendar, ChevronLeft, ChevronRight, Lock, 
  Unlock, Download, BarChart3, Settings, CheckCircle2, 
  RotateCw, Sparkles, MoreVertical, PlusCircle, Layers, 
  LogOut, User 
} from 'lucide-react';

export default function Header({
  currentDate,
  onDateChange,
  registerStatus,
  onCloseAndRollover,
  onOpenReports,
  onOpenItemManager,
  exportUrl,
  isSaving,
  hasSampleDate,
  onLoadSampleDate,
  currentUser,
  onSignOut
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigate previous / next day (using Date.UTC to prevent timezone offset shifts)
  const handlePrevDay = () => {
    const [year, month, day] = currentDate.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day - 1));
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const [year, month, day] = currentDate.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day + 1));
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onDateChange(today);
  };

  // Format date nicely (e.g. "Thu, 30 Apr 2026")
  const formatDateDisplay = (dateString) => {
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const d = new Date(Date.UTC(year, month - 1, day));
      return d.toLocaleDateString('en-IN', {
        timeZone: 'UTC',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & Mobile Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-900/10 ring-2 ring-amber-500/20">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                    Cafe Plus
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Daily Register
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>{formatDateDisplay(currentDate)}</span>
                  <span>•</span>
                  {registerStatus === 'closed' ? (
                    <span className="inline-flex items-center text-emerald-700 font-medium">
                      <Lock className="w-3 h-3 mr-0.5" /> Closed
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-amber-700 font-medium">
                      <Unlock className="w-3 h-3 mr-0.5" /> Open
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Action Buttons (Visible on mobile screens) */}
            <div className="flex items-center space-x-1.5 md:hidden" ref={menuRef}>
              {/* Quick Save Indicator */}
              {isSaving ? (
                <span className="inline-flex items-center text-xs text-amber-600 font-medium mr-1 animate-pulse">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                </span>
              ) : (
                <span className="inline-flex items-center text-xs text-emerald-600 font-medium mr-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              )}

              {/* Items & Categories Quick Button (Mobile) */}
              <button
                onClick={onOpenItemManager}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 active:bg-amber-100 border border-amber-200 rounded-lg shadow-2xs"
                title="Manage Menu Items & Categories"
              >
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                <span>Items</span>
              </button>

              {/* Export CSV Quick Button (Mobile) */}
              <a
                href={exportUrl}
                download
                className="inline-flex items-center gap-1 p-1.5 text-slate-700 bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200 shadow-2xs"
                title="Download CSV Register"
              >
                <Download className="w-4 h-4 text-slate-600" />
              </a>

              {/* Mobile 3-Dot More Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200"
                  title="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenItemManager();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Items & Categories</span>
                    </button>

                    <a
                      href={exportUrl}
                      download
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Export Day CSV</span>
                    </a>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenReports();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4 text-slate-500" />
                      <span>Overview & Reports</span>
                    </button>

                    <div className="border-t border-slate-150 my-1"></div>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onCloseAndRollover();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-amber-700" />
                      <span>Close & Carry Fwd</span>
                    </button>

                    {currentUser && (
                      <>
                        <div className="border-t border-slate-150 my-1"></div>
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onSignOut();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out ({currentUser.name})</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Picker Bar */}
          <div className="flex items-center justify-between sm:justify-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => e.target.value && onDateChange(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800"
              />
            </div>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              >
                Today
              </button>
            )}

            {hasSampleDate && (
              <button
                onClick={onLoadSampleDate}
                title="View notebook photo record: 30/04/26"
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-600" /> 30/04/26
              </button>
            )}
          </div>

          {/* Action buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Auto-save status */}
            <div className="mr-2">
              {isSaving ? (
                <span className="inline-flex items-center text-xs text-amber-600 font-medium">
                  <RotateCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving...
                </span>
              ) : (
                <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> All saved
                </span>
              )}
            </div>

            <button
              onClick={onOpenReports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Overview</span>
            </button>

            <button
              onClick={onOpenItemManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Items & Categories</span>
            </button>

            <a
              href={exportUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
              title="Download Day Register CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </a>

            <button
              onClick={onCloseAndRollover}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs shadow-amber-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Close & Carry Fwd</span>
            </button>

            {/* Desktop User Info & Sign Out */}
            {currentUser && (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>{currentUser.name}</span>
                </span>
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
