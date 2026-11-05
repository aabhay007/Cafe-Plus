import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />
  };

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center space-x-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700/80 animate-in slide-in-from-bottom duration-200">
      {icons[toast.type || 'success']}
      <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
    </div>
  );
}
