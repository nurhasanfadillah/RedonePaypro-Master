import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  singleButton?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  type = 'danger', 
  confirmText = 'Ya, Lanjutkan', 
  cancelText = 'Batal', 
  singleButton = false 
}) => {
  if (!isOpen) return null;

  const getColor = () => {
    switch (type) {
      case 'danger': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'success': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-red-600/30';
      case 'success': return 'bg-green-600 hover:bg-green-700 shadow-green-600/30';
      default: return 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/30';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 dark:border-dark-border transform transition-all scale-100">
        <div className="p-6 text-center">
          <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${getColor()}`}>
            {type === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
          
          <div className="flex gap-3 justify-center">
            {!singleButton && (
              <button 
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors border border-slate-200 dark:border-slate-700"
              >
                {cancelText}
              </button>
            )}
            <button 
              type="button"
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-all shadow-lg ${getButtonColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;