
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X, RotateCcw, ShieldAlert, Loader2 } from 'lucide-react';

// --- High Friction Modal ---
interface HighFrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmString: string;
  confirmLabel: string;
  isLoading?: boolean;
}

export const HighFrictionModal: React.FC<HighFrictionModalProps> = ({ 
  isOpen, onClose, onConfirm, title, description, confirmString, confirmLabel, isLoading 
}) => {
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUserInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // FIX: Trim both sides and normalize case to ensure strings like "משרד יולי " (with accidental trailing space) 
  // can be deleted by typing "משרד יולי". This prevents the "cannot delete" bug for names with invisible characters.
  const isConfirmed = userInput.trim().toLowerCase() === confirmString.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-3xl w-full max-w-md shadow-2xl border border-red-500/30 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-red-500/10 p-6 flex flex-col items-center text-center border-b border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4 animate-pulse">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-primary">{title}</h2>
          <p className="text-secondary text-sm mt-2 font-medium">{description}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-secondary uppercase tracking-widest mr-1">
              הקלד <span className="text-red-500 select-all">"{confirmString.trim()}"</span> לאישור הפעולה:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-tertiary border border-subtle text-primary focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold text-center"
              placeholder="הזן טקסט אישור..."
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-secondary font-bold hover:text-primary hover:bg-tertiary rounded-2xl transition-all"
            >
              ביטול
            </button>
            <button
              disabled={!isConfirmed || isLoading}
              onClick={onConfirm}
              className={`flex-[2] py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg ${
                isConfirmed 
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20 active:scale-95' 
                  : 'bg-tertiary text-secondary opacity-50 cursor-not-allowed'
              }`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Optimistic Undo Toast ---
interface UndoToastProps {
  message: string;
  onUndo: () => void;
  duration?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo, duration = 6000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div 
      className="fixed bottom-8 left-8 z-[300] bg-surface border border-subtle shadow-2xl rounded-2xl p-4 pr-5 flex items-center gap-6 animate-in slide-in-from-left-10 fade-in duration-500"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center">
          <Trash2 size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-primary">{message}</p>
          <p className="text-[10px] text-secondary font-medium">הפעולה תבוצע לצמיתות בעוד מספר שניות...</p>
        </div>
      </div>

      <button 
        onClick={onUndo}
        className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-black rounded-xl hover:bg-brand-hover transition-all active:scale-95 shadow-lg shadow-brand/20"
      >
        <RotateCcw size={14} />
        בטל
      </button>

      {/* Countdown Progress Line */}
      <div className="absolute bottom-0 left-0 h-1 bg-subtle w-full rounded-b-2xl overflow-hidden">
        <div 
          className="h-full bg-brand transition-all ease-linear" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
};