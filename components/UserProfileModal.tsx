
import React, { useState, useEffect } from 'react';
import { X, Save, Camera, User, Phone, MapPin, Briefcase, Loader2, AlertCircle, ChevronDown, Fingerprint, ScanFace } from 'lucide-react';
import { User as UserType } from '../types';
import { authApi } from '../services/api';
import { startRegistration } from '@simplewebauthn/browser';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onSave: (data: Partial<UserType>) => void;
}

const AVAILABLE_JOB_TITLES = [
  'מב"ס',
  'סמב"ס',
  'מפק"צ',
  'רמפל"ג',
  'ממ\"ר',
  'סממ\"ר'
];

// Added consistent base options to avoid hardcoding illegal escaped quotes in JSX
const AVAILABLE_BASES = [
  "ימל\"ם",
  "יאל\"ם",
  "באר שבע",
  "יואב",
  "גליל",
  "חוף",
  "ירושלים",
  "ערבה",
  "דן",
  "ימ\"ר דרום",
  "ימ\"ר צפון"
];

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, currentUser, onSave }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [base, setBase] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name);
      setPhoneNumber(currentUser.phoneNumber || '');
      setBase(currentUser.base);
      setJobTitle(currentUser.jobTitle || '');
      setAvatarPreview(currentUser.avatar || '');
      setError(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Compress image helper
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Resize to 300x300 max
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 300;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          // Compress to 0.7 JPEG
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation: Size < 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError('גודל הקובץ גדול מדי');
        return;
      }
      // Validation: Type
      if (!file.type.startsWith('image/')) {
        setError('מותרים רק קבצי תמונה');
        return;
      }

      try {
        const compressed = await compressImage(file);
        setAvatarPreview(compressed);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('שגיאה בטעינת התמונה');
      }
    }
  };

  const handleRegisterPasskey = async () => {
    try {
      setError(null);
      const options = await authApi.getRegisterOptions();
      const verificationResp = await startRegistration({ optionsJSON: options });
      const verificationJSON = await authApi.verifyRegister(verificationResp);

      if (verificationJSON && verificationJSON.verified) {
        alert('Passkey registered successfully!');
      } else {
        setError('Passkey registration failed');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Passkey registration error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate Network Request
    setTimeout(() => {
      onSave({
        name,
        phoneNumber,
        base,
        jobTitle,
        avatar: avatarPreview
      });
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/10">

        {/* Header - Dark Theme */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-black text-white tracking-tight">ערוך פרופיל</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">

          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm flex items-start gap-3 border border-red-500/20">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar Upload Section - Premium Look */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative group cursor-pointer">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl group-hover:border-brand transition-all duration-300">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                    <User size={48} />
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-brand/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 text-white">
                <Camera size={24} />
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="שנה תמונת פרופיל"
              />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3">לחץ לעדכון תמונה</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">שם מלא</label>
              <div className="relative group">
                <User className="absolute right-4 top-3.5 text-slate-500 group-focus-within:text-brand transition-colors" size={18} />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-800/50 border border-white/5 text-white focus:bg-slate-800 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">תפקיד</label>
                <div className="relative group">
                  <Briefcase className="absolute right-4 top-3.5 text-slate-500 group-focus-within:text-brand transition-colors" size={18} />
                  <select
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-800/50 border border-white/5 text-white focus:bg-slate-800 focus:border-brand outline-none transition-all appearance-none cursor-pointer font-medium"
                  >
                    <option value="" disabled>בחר תפקיד</option>
                    {AVAILABLE_JOB_TITLES.map(title => (
                      <option key={title} value={title} className="bg-slate-900">{title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-3.5 text-slate-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">בסיס</label>
                <div className="relative group">
                  <MapPin className="absolute right-4 top-3.5 text-slate-500 group-focus-within:text-brand transition-colors" size={18} />
                  <select
                    value={base}
                    onChange={(e) => setBase(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-800/50 border border-white/5 text-white focus:bg-slate-800 focus:border-brand outline-none transition-all appearance-none cursor-pointer font-medium"
                  >
                    {AVAILABLE_BASES.map((baseName) => (
                      <option key={baseName} value={baseName} className="bg-slate-900">{baseName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-3.5 text-slate-500 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">מספר טלפון</label>
              <div className="relative group">
                <Phone className="absolute right-4 top-3.5 text-slate-500 group-focus-within:text-brand transition-colors" size={18} />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-800/50 border border-white/5 text-white focus:bg-slate-800 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleRegisterPasskey}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <Fingerprint size={20} className="text-brand" />
              <span className="text-brand">/</span>
              <ScanFace size={20} className="text-brand" />
              רשום ביומטרי (Passkey)
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-2">מאפשר כניסה מהירה ומאובטחת ללא סיסמה</p>
          </div>


          <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-white/5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl font-bold transition-all text-sm"
              disabled={isSubmitting}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-brand hover:opacity-90 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              שמור שינויים
            </button>
          </div>
        </form>
      </div >
    </div >
  );
};

export default UserProfileModal;
