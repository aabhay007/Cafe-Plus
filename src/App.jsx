import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ClipboardList, Calculator, ShoppingBag, BarChart3, 
  Settings, Download, Lock, CheckCircle2, LayoutGrid, 
  Table as TableIcon, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import Header from './components/Header';
import StockTable from './components/StockTable';
import StockMobileCards from './components/StockMobileCards';
import SettlementPanel from './components/SettlementPanel';
import PurchasesPanel from './components/PurchasesPanel';
import ItemManagerModal from './components/ItemManagerModal';
import ReportsModal from './components/ReportsModal';
import ConfirmDialog from './components/ConfirmDialog';
import LoginScreen from './components/LoginScreen';
import Toast from './components/Toast';
import { api } from './services/api';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cafeplus_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  // Current active date (defaults to today's local date YYYY-MM-DD)
  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [currentDate, setCurrentDate] = useState(getTodayStr());
  const [register, setRegister] = useState(null);
  const [entries, setEntries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Mobile navigation tabs: 'stock' | 'settlement' | 'purchases'
  const [mobileTab, setMobileTab] = useState('stock');
  // Mobile stock view mode: 'cards' | 'table'
  const [mobileViewMode, setMobileViewMode] = useState('cards');

  // Modals
  const [isItemManagerOpen, setIsItemManagerOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isCloseDayConfirmOpen, setIsCloseDayConfirmOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('cafeplus_user', JSON.stringify(user));
    if (token) localStorage.setItem('cafeplus_token', token);
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const executeSignOut = () => {
    setIsSignOutConfirmOpen(false);
    setCurrentUser(null);
    localStorage.removeItem('cafeplus_user');
    localStorage.removeItem('cafeplus_token');
    showToast('Signed out successfully.');
  };

  // Fetch register data for the active date
  const loadRegister = useCallback(async (dateToLoad) => {
    try {
      setLoading(true);
      const data = await api.getRegister(dateToLoad);
      setRegister(data.register);
      setEntries(data.entries);
      setPurchases(data.purchases);
    } catch (err) {
      console.error(err);
      showToast('Error loading date register: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegister(currentDate);
  }, [currentDate, loadRegister]);

  // Debounced auto-save for stock entries
  const saveTimeoutRef = useRef(null);

  const triggerDebouncedSave = (updatedEntries) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.updateStockEntries(currentDate, updatedEntries);
        setIsSaving(false);
      } catch (err) {
        console.error('Auto-save error', err);
        setIsSaving(false);
        showToast('Auto-save failed', 'error');
      }
    }, 600);
  };

  // Handler for stock entry edits
  const handleEntryChange = (itemId, changes) => {
    setEntries(prevEntries => {
      const nextEntries = prevEntries.map(e => {
        if (e.item_id === itemId) {
          return { ...e, ...changes };
        }
        return e;
      });
      triggerDebouncedSave(nextEntries);
      return nextEntries;
    });
  };

  // Handler for EOD settlement save
  const handleSaveSettlement = async (settlementData) => {
    try {
      setIsSaving(true);
      await api.updateSettlement(currentDate, settlementData);
      setRegister(prev => ({ ...prev, ...settlementData }));
      setIsSaving(false);
      showToast('Settlement reconciled and saved!');
    } catch (err) {
      setIsSaving(false);
      showToast('Failed to save settlement: ' + err.message, 'error');
    }
  };

  // Handler for purchases
  const handleAddPurchase = async (purchaseData) => {
    try {
      const newPurchase = await api.addPurchase(currentDate, purchaseData);
      setPurchases(prev => [...prev, newPurchase]);
      showToast('Purchase recorded!');
    } catch (err) {
      showToast('Failed to add purchase: ' + err.message, 'error');
    }
  };

  const handleDeletePurchase = async (purchaseId) => {
    try {
      await api.deletePurchase(purchaseId);
      setPurchases(prev => prev.filter(p => p.id !== purchaseId));
      showToast('Purchase deleted');
    } catch (err) {
      showToast('Failed to delete purchase: ' + err.message, 'error');
    }
  };

  // Handler for Day Close & Auto-Rollover
  const handleCloseAndRollover = () => {
    setIsCloseDayConfirmOpen(true);
  };

  const executeCloseAndRollover = async () => {
    setIsCloseDayConfirmOpen(false);
    try {
      setIsSaving(true);
      const res = await api.closeAndRolloverDay(currentDate);
      showToast(res.message);
      // Switch to next day
      if (res.nextDate) {
        setCurrentDate(res.nextDate);
      } else {
        await loadRegister(currentDate);
      }
    } catch (err) {
      showToast('Error closing day: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate live totals
  const totalUnitsSold = entries.reduce((s, e) => s + (e.sale || 0), 0);
  const totalStockSalesValue = entries.reduce((s, e) => s + ((e.sale || 0) * (e.unit_price || 0)), 0);
  const totalReconciledSale = register ? (register.cash_collected + register.paytm_collected + register.credit_collected) : 0;
  const totalPurchasesAmount = purchases.reduce((s, p) => s + (p.amount || 0), 0);
  const netEstimatedProfit = totalReconciledSale - totalPurchasesAmount;

  // Render Login Screen if not signed in
  if (!currentUser) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 pb-20 md:pb-8">
      {/* Top Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        registerStatus={register?.status || 'open'}
        onCloseAndRollover={handleCloseAndRollover}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenItemManager={() => setIsItemManagerOpen(true)}
        exportUrl={api.getExportUrl(currentDate)}
        isSaving={isSaving}
        hasSampleDate={true}
        onLoadSampleDate={() => setCurrentDate('2026-04-30')}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        
        {/* Quick Summary Dashboard Bar (Visible on both Mobile & Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {/* Day's Total Sales */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-slate-900 mt-1">
              ₹ {totalReconciledSale.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {totalUnitsSold} units sold
            </div>
          </div>

          {/* Paytm / UPI */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Paytm / UPI</span>
              <span className="text-[10px] font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                Online
              </span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-blue-950 mt-1">
              ₹ {(register?.paytm_collected || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              QR / Soundbox
            </div>
          </div>

          {/* Cash */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Cash</span>
              <span className="text-[10px] font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Drawer
              </span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-emerald-950 mt-1">
              ₹ {(register?.cash_collected || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Physical notes & coins
            </div>
          </div>

          {/* Credit / Tab */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Credit (Udhar)</span>
              <span className="text-[10px] font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Tab
              </span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-amber-950 mt-1">
              ₹ {(register?.credit_collected || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Pay later balance
            </div>
          </div>

          {/* Net Profit (Hidden on small mobile, visible on tablet/desktop) */}
          <div className="hidden lg:block p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Profit</span>
              <span className="text-[10px] font-semibold text-slate-400">
                Sales - Expenses
              </span>
            </div>
            <div className={`text-lg sm:text-xl font-mono font-extrabold mt-1 ${
              netEstimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              ₹ {netEstimatedProfit.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              Purchases: ₹{totalPurchasesAmount}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-sm font-medium">Loading Cafe Plus register...</p>
          </div>
        ) : (
          <>
            {/* DESKTOP LAYOUT (Hidden on mobile) */}
            <div className="hidden md:grid md:grid-cols-12 gap-5 items-start">
              
              {/* Left Column (8 cols): Main Stock Register Table */}
              <div className="md:col-span-8 space-y-4">
                <StockTable
                  entries={entries}
                  onEntryChange={handleEntryChange}
                  isRegisterClosed={register?.status === 'closed'}
                />
              </div>

              {/* Right Column (4 cols): Settlement & Purchases Sticky Sidebar */}
              <div className="md:col-span-4 space-y-4 sticky top-20">
                {/* EOD Revenue Reconciliation */}
                <SettlementPanel
                  register={register || {}}
                  stockEntries={entries}
                  onSaveSettlement={handleSaveSettlement}
                  isSaving={isSaving}
                />

                {/* Daily Purchases & Expenses */}
                <PurchasesPanel
                  purchases={purchases}
                  onAddPurchase={handleAddPurchase}
                  onDeletePurchase={handleDeletePurchase}
                  totalDailySales={totalReconciledSale}
                />
              </div>

            </div>

            {/* MOBILE LAYOUT (Hidden on desktop) */}
            <div className="block md:hidden space-y-3">
              
              {/* Mobile View Toggle Bar (Only when on Stock tab) */}
              {mobileTab === 'stock' && (
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 px-1">
                    Items List ({entries.length})
                  </span>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setMobileViewMode('cards')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                        mobileViewMode === 'cards'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </button>
                    <button
                      onClick={() => setMobileViewMode('table')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                        mobileViewMode === 'table'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Table</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Tab Content */}
              {mobileTab === 'stock' && (
                mobileViewMode === 'cards' ? (
                  <StockMobileCards
                    entries={entries}
                    onEntryChange={handleEntryChange}
                    onOpenItemManager={() => setIsItemManagerOpen(true)}
                    exportUrl={api.getExportUrl(currentDate)}
                  />
                ) : (
                  <div className="overflow-x-auto -mx-3 px-3">
                    <StockTable
                      entries={entries}
                      onEntryChange={handleEntryChange}
                      isRegisterClosed={register?.status === 'closed'}
                      onOpenItemManager={() => setIsItemManagerOpen(true)}
                      exportUrl={api.getExportUrl(currentDate)}
                    />
                  </div>
                )
              )}

              {mobileTab === 'settlement' && (
                <SettlementPanel
                  register={register || {}}
                  stockEntries={entries}
                  onSaveSettlement={handleSaveSettlement}
                  isSaving={isSaving}
                />
              )}

              {mobileTab === 'purchases' && (
                <PurchasesPanel
                  purchases={purchases}
                  onAddPurchase={handleAddPurchase}
                  onDeletePurchase={handleDeletePurchase}
                  totalDailySales={totalReconciledSale}
                />
              )}

            </div>
          </>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 md:hidden shadow-lg">
        <div className="grid grid-cols-5 gap-0.5 text-center">
          
          <button
            onClick={() => setMobileTab('stock')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              mobileTab === 'stock'
                ? 'text-amber-800 font-bold bg-amber-50/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Stock</span>
          </button>

          <button
            onClick={() => setMobileTab('settlement')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all relative ${
              mobileTab === 'settlement'
                ? 'text-amber-800 font-bold bg-amber-50/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Settlement</span>
          </button>

          <button
            onClick={() => setMobileTab('purchases')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              mobileTab === 'purchases'
                ? 'text-amber-800 font-bold bg-amber-50/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Expenses</span>
          </button>

          <button
            onClick={() => setIsItemManagerOpen(true)}
            className="flex flex-col items-center py-1 rounded-xl text-slate-500 hover:text-amber-800 active:bg-amber-50 transition-all"
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Items</span>
          </button>

          <button
            onClick={() => setIsReportsOpen(true)}
            className="flex flex-col items-center py-1 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Reports</span>
          </button>

        </div>
      </nav>

      {/* Item & Menu Manager Modal */}
      <ItemManagerModal
        isOpen={isItemManagerOpen}
        onClose={() => setIsItemManagerOpen(false)}
        onRefreshData={() => loadRegister(currentDate)}
      />

      {/* Business Reports Modal */}
      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        onSelectDate={setCurrentDate}
      />

      {/* Day Close & Rollover Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCloseDayConfirmOpen}
        title="Close Register & Carry Forward?"
        message={`This will lock the register for ${currentDate} and automatically carry forward today's closing stock balances as tomorrow's opening balances.`}
        confirmText="Close & Carry Fwd"
        cancelText="Keep Open"
        variant="primary"
        iconType="lock"
        onConfirm={executeCloseAndRollover}
        onCancel={() => setIsCloseDayConfirmOpen(false)}
      />

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSignOutConfirmOpen}
        title="Sign Out of Cafe Plus?"
        message="Are you sure you want to sign out? You will need to enter your password again."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        variant="danger"
        iconType="info"
        onConfirm={executeSignOut}
        onCancel={() => setIsSignOutConfirmOpen(false)}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
