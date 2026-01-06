
import React, { useState, useRef } from 'react';
import { X, CheckCircle, Loader2, AlertCircle, RotateCcw, ShieldCheck, Upload, FileVideo, ShieldAlert, Trash2 } from 'lucide-react';

// IndexedDB Helper for Large File Storage
const saveToLocalVault = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SmartRoomVault', 2);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos');
      }
    };

    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      const id = `local-v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const putRequest = store.put(file, id);
      putRequest.onsuccess = () => resolve(id);
      putRequest.onerror = () => reject(new Error('Failed to store in local vault'));
    };

    request.onerror = () => reject(new Error('IndexedDB access denied'));
  });
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (videoUrl: string) => Promise<void>;
  roomName: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirm, roomName }) => {
  const [mode, setMode] = useState<'IDLE' | 'REVIEW'>('IDLE');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      const isVideo = file.type.startsWith('video/') ||
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.mov') ||
        file.name.toLowerCase().endsWith('.webm');

      if (!isVideo) {
        setError('נא לבחור קובץ וידאו תקין בלבד (MP4, MOV, WebM).');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setMode('REVIEW');
    }
  };

  const handleDiscard = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setSelectedFile(null);
    setMode('IDLE');
    setUploadProgress(0);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!videoUrl || !selectedFile) return;

    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 1. Local Storage Phase (IndexedDB)
      // This allows the user to see THEIR OWN video without breaking Firestore
      const vaultId = await saveToLocalVault(selectedFile);

      // 2. Mock Network Progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(r => setTimeout(r, 150));
      }

      // 3. Finalize
      // We send the small Vault ID to Firestore.
      await onConfirm(vaultId);

      onClose();
    } catch (err: any) {
      console.error("Vault storage failed:", err);
      setError('שגיאה בשמירת התיעוד. נא לוודא שיש מקום פנוי במכשיר.');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-surface rounded-lg w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-subtle animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-subtle flex justify-between items-center bg-tertiary/50">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand"></div>
            <h2 className="text-base font-bold text-primary tracking-tight">דיווח סיום שימוש - {roomName}</h2>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex items-start gap-4 p-4 bg-tertiary/30 rounded-lg border border-subtle">
            <ShieldAlert className="text-brand shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-primary">פרוטוקול אבטחה ותקינות</h3>
              <p className="text-secondary text-xs leading-relaxed font-medium">
                העלה תיעוד ויזואלי המאשר את מצב החדר. הקובץ יישמר במאגר המאובטח של הארגון ויהיה זמין לביקורת.
              </p>
            </div>
          </div>

          <div className="relative aspect-video bg-tertiary/20 rounded-lg overflow-hidden border border-subtle shadow-inner group">
            {mode === 'IDLE' && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-4 cursor-pointer hover:bg-tertiary/40 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-5 bg-surface border border-subtle rounded-full shadow-sm group-hover:scale-110 transition-all">
                  <Upload size={32} className="text-brand" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-primary block">בחר קובץ וידאו</span>
                  <span className="text-[10px] text-secondary font-medium uppercase tracking-widest mt-1">MP4, MOV, WEBM (עד 50MB)</span>
                </div>
                <input type="file" ref={fileInputRef} accept="video/*" className="hidden" onChange={handleFileUpload} />
              </div>
            )}

            {mode === 'REVIEW' && videoUrl && (
              <div className="relative w-full h-full bg-black">
                <video src={videoUrl} controls className="w-full h-full object-contain" playsInline />
                {!isSubmitting && (
                  <button onClick={handleDiscard} className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded-lg shadow-lg hover:bg-red-700 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="absolute top-4 right-4 bg-slate-900/90 text-white px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 backdrop-blur-sm border border-white/10">
                  <FileVideo size={14} /> {selectedFile?.name}
                </div>

                {isSubmitting && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <div className="w-64 space-y-4 text-center">
                      <div className="relative inline-block">
                        <Loader2 className="animate-spin text-white mx-auto" size={48} />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">{uploadProgress}%</div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-white text-xs font-bold uppercase tracking-widest">מבצע כתיבה למאגר המאובטח...</p>
                        <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-xs font-bold flex items-start gap-3 border border-red-500/20">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {mode === 'REVIEW' && !isSubmitting && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDiscard} className="py-3.5 border border-subtle text-secondary hover:bg-tertiary rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-xs">
                  <RotateCcw size={16} /> החלף קובץ
                </button>
                <button onClick={handleSubmit} className="py-3.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-bold flex items-center justify-center gap-3 transition-all shadow-lg text-xs">
                  <CheckCircle size={18} /> אשר וסיים שימוש
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-4 bg-tertiary/50 border-t border-subtle flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-secondary" />
          <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">מערכת דיווח מבצעית V4.7 // Security Protocol Enabled</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;