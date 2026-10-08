import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  detailText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete Record',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  detailText
}) => {
  if (!isOpen) return null;

  const colorStyles = {
    danger: {
      iconBg: 'bg-rose-100 text-rose-600 border border-rose-200',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm'
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-600 border border-amber-200',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-sm'
    },
    primary: {
      iconBg: 'bg-blue-100 text-blue-600 border border-blue-200',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm'
    }
  }[variant];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colorStyles.iconBg}`}
            >
              {variant === 'danger' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3
                  id="confirm-dialog-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight"
                >
                  {title}
                </h3>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {message}
              </div>

              {detailText && (
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all">
                  {detailText}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 ${colorStyles.btn}`}
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
              )}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
