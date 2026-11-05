import React from 'react';
import { AlertTriangle, Lock, Trash2, X, HelpCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'danger' | 'warning'
  onConfirm,
  onCancel,
  iconType = 'warning'
}) {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    lock: <Lock className="w-5 h-5 text-amber-700" />,
    danger: <Trash2 className="w-5 h-5 text-rose-600" />,
    info: <HelpCircle className="w-5 h-5 text-blue-600" />
  };

  const buttonVariants = {
    primary: 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-900/10',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/10',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/10'
  };

  const iconBgVariants = {
    primary: 'bg-amber-100 border-amber-200',
    danger: 'bg-rose-100 border-rose-200',
    warning: 'bg-amber-100 border-amber-200',
    info: 'bg-blue-100 border-blue-200'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${iconBgVariants[iconType] || iconBgVariants.primary}`}>
            {icons[iconType] || icons.warning}
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-150">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 ${buttonVariants[variant] || buttonVariants.primary}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
