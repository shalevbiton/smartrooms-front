
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  UserPlus,
  AlertCircle,
  CheckCircle,
  Lock,
  LogIn,
  X,
  Camera,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  CalendarPlus,
  Fingerprint
} from 'lucide-react';
import { authApi } from '../services/api';
import { startAuthentication } from '@simplewebauthn/browser';

interface LoginScreenProps {
  existingUsers: User[];
  onLogin: (user: User, rememberMe: boolean) => void;
  onRegister: (personalId: string, password: string, name: string, base: string, phoneNumber: string, jobTitle: string, avatar?: string) => void;
  onRemoveUser: (userId: string) => void;
  backgroundImage?: string;
  theme?: 'light' | 'dark';
}

const AVAILABLE_BASES = [
  "ימל\"ם", "יאל\"ם", "באר שבע", "יואב", "גליל", "חוף", "ירושלים", "ערבה", "דן", "ימ\"ר דרום", "ימ\"ר צפון"
];

const AVAILABLE_JOB_TITLES = [
  "מב\"ס", "סמב\"ס", "מפק\"צ", "רמפל\"ג", "ממ\"ר", "סממ\"ר"
];

const hashPassword = (password: string) => `hash_${password}`;

const LoginScreen: React.FC<LoginScreenProps> = ({ existingUsers, onLogin, onRegister, onRemoveUser, backgroundImage, theme = 'light' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showLogin, setShowLogin] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [regPersonalId, setRegPersonalId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBase, setNewBase] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [savedUsers, setSavedUsers] = useState<User[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartroom_saved_users');
      if (saved) setSavedUsers(JSON.parse(saved));
    } catch (e) { console.error("Failed to load saved users", e); }
  }, []);

  const handleRemoveSavedUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSaved = savedUsers.filter(u => u.id !== userId);
    setSavedUsers(newSaved);
    localStorage.setItem('smartroom_saved_users', JSON.stringify(newSaved));
    if (onRemoveUser) onRemoveUser(userId);
  };

  const handleQuickLoginSelect = (user: User) => {
    setLoginId(user.personalId);
    setLoginPassword('');
    setRememberMe(true);
    setActiveTab('login');
    setNotification({ type: 'success', message: `ברוך שובך, ${user.name}. אנא הזן את הסיסמה שלך.` });
  };

  const handleLoginPasskey = async () => {
    if (!loginId) {
      setNotification({ type: 'error', message: 'אנא הזן מספר אישי תחילה.' });
      return;
    }

    try {
      setNotification(null);
      const options = await authApi.getLoginOptions(loginId);
      const verificationResp = await startAuthentication({ optionsJSON: options });
      const verificationJSON = await authApi.verifyLogin(loginId, verificationResp);

      if (verificationJSON && verificationJSON.verified) {
        onLogin(verificationJSON.user, rememberMe);
      } else {
        setNotification({ type: 'error', message: 'אימות נכשל.' });
      }
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: e.message || 'שגיאה בכניסה עם Passkey.' });
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const user = existingUsers.find(u => u.personalId === loginId.trim());
    if (!user) {
      setNotification({ type: 'error', message: 'משתמש לא נמצא עם מספר אישי זה.' });
      return;
    }

    const hashedInput = hashPassword(loginPassword);

    const isValid = user.password === hashedInput || user.password === loginPassword;

    if (!isValid) {
      setNotification({ type: 'error', message: 'סיסמה שגויה.' });
      return;
    }

    if (user.status !== 'APPROVED') {
      setNotification({ type: 'error', message: 'חשבונך עדיין ממתין לאישור או שנדחה.' });
      return;
    }

    onLogin(user, rememberMe);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height, MAX_SIZE = 400;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
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
      if (!file.type.startsWith('image/')) {
        setNotification({ type: 'error', message: 'מותרים רק קבצי תמונה (JPG, PNG)' });
        return;
      }
      setIsProcessingImage(true);
      try {
        const compressed = await compressImage(file);
        setNewAvatar(compressed);
        setNotification(null);
      } catch (err) {
        setNotification({ type: 'error', message: 'שגיאה בעיבוד התמונה.' });
      } finally { setIsProcessingImage(false); }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingUsers.some(u => u.personalId === regPersonalId.trim())) {
      setNotification({ type: 'error', message: 'מספר אישי זה כבר רשום.' });
      return;
    }
    if (!/^\d{7}$/.test(regPersonalId)) {
      setNotification({ type: 'error', message: 'מספר אישי חייב להכיל בדיוק 7 ספרות.' });
      return;
    }
    if (regPassword.length < 6) {
      setNotification({ type: 'error', message: 'הסיסמה חייבת להכיל לפחות 6 תווים.' });
      return;
    }
    if (!/^\d{10}$/.test(newPhoneNumber)) {
      setNotification({ type: 'error', message: 'מספר הטלפון חייב להכיל בדיוק 10 ספרות.' });
      return;
    }

    if (newName.trim() && newBase.trim() && newJobTitle.trim()) {
      const hashedPassword = hashPassword(regPassword);
      onRegister(regPersonalId, hashedPassword, newName, newBase, newPhoneNumber, newJobTitle, newAvatar);
      setNotification({ type: 'success', message: 'ההרשמה הצליחה! המתן לאישור מנהל.' });
      setRegPersonalId(''); setRegPassword(''); setNewName(''); setNewBase(''); setNewPhoneNumber(''); setNewJobTitle(''); setNewAvatar('');
    } else { setNotification({ type: 'error', message: 'כל השדות חובה.' }); }
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="fixed inset-0 z-0 flex items-center justify-center">
        <img src={backgroundImage || "https://upload.wikimedia.org/wikipedia/commons/1/18/Yamar_metzach.png"} alt={'רקע'} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-main/70 backdrop-blur-sm"></div>
      </div>

      <div className="bg-surface/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-subtle animate-in fade-in zoom-in-95 duration-500">

        {/* LOGO SECTION - EVEN LARGER LOGO & CLEAN BG */}
        <div className="text-center pt-10 pb-4 px-8 flex flex-col items-center">
          <div className="relative h-72 w-full flex items-center justify-center mb-2">
            <picture className="flex items-center justify-center">
              <img
                src={isDark ? "/logo_dark.png" : "/logo_light.png"}
                alt="SmartRoom Identity"
                className="h-56 w-auto object-contain system-logo transition-transform duration-300 border-2 border-black dark:border-white rounded-3xl p-4 bg-surface/30"
                loading="eager"
              />
            </picture>
          </div>
        </div>

        {!showLogin ? (
          <div className="px-8 pb-12 flex flex-col gap-4 items-center">
            <button
              onClick={() => setShowLogin(true)}
              className="w-48 h-48 bg-brand hover:bg-brand-hover text-white rounded-3xl font-black text-xl flex flex-col items-center justify-center gap-4 transition-all shadow-xl shadow-brand/20 hover:-translate-y-2 hover:shadow-2xl active:scale-95 border-b-8 border-brand-hover active:border-b-0 active:translate-y-0"
            >
              <CalendarPlus size={48} />
              <span>רוצה להזמין חדר?</span>
            </button>
            <p className="text-center text-secondary text-sm font-medium">המערכת מאפשרת ניהול והזמנת חדרי חקירות ודיונים</p>
          </div>
        ) : (
          <>
            {savedUsers.length > 0 && activeTab === 'login' && (
              <div className="px-8 mb-6 mt-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3 text-center opacity-70">כניסות אחרונות</p>
                <div className="flex gap-4 justify-center">
                  {savedUsers.slice(0, 3).map(user => (
                    <div key={user.id} onClick={() => handleQuickLoginSelect(user)} className="relative group cursor-pointer flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-subtle group-hover:border-brand transition-all shadow-sm ring-4 ring-transparent group-hover:ring-brand/10">
                        {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-tertiary flex items-center justify-center text-brand font-bold">{user.name.charAt(0)}</div>}
                      </div>
                      <span className="text-[10px] text-primary mt-1.5 font-bold max-w-[64px] truncate">{user.name.split(' ')[0]}</span>
                      <button onClick={(e) => handleRemoveSavedUser(user.id, e)} className="absolute -top-1 -right-1 bg-surface text-secondary hover:bg-red-500 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-8 mb-6 mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300 delay-75">
              <div className="flex bg-tertiary p-1.5 rounded-2xl border border-subtle">
                <button onClick={() => { setActiveTab('login'); setNotification(null); }} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'login' ? 'bg-surface text-brand shadow-sm ring-1 ring-black/5' : 'text-secondary hover:text-primary'}`}>התחברות</button>
                <button onClick={() => { setActiveTab('register'); setNotification(null); }} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'register' ? 'bg-surface text-brand shadow-sm ring-1 ring-black/5' : 'text-secondary hover:text-primary'}`}>הרשמה</button>
              </div>
            </div>

            <div className="px-8 pb-12 animate-in slide-in-from-bottom-4 fade-in duration-300 delay-100">
              {notification && (
                <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm animate-in slide-in-from-top-2 border ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  {notification.type === 'success' ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                  <span className="font-bold">{notification.message}</span>
                </div>
              )}

              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <div className="relative group">
                      <CreditCard className="absolute left-4 top-3.5 text-secondary group-focus-within:text-brand transition-colors pointer-events-none" size={18} />
                      <input type="text" required value={loginId} onChange={(e) => setLoginId(e.target.value.replace(/\D/g, ''))} className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-subtle bg-tertiary text-primary focus:bg-surface focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all placeholder:text-secondary/60 font-medium" placeholder="מספר אישי" maxLength={7} />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 text-secondary group-focus-within:text-brand transition-colors pointer-events-none" size={18} />
                      <input type={showLoginPassword ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-subtle bg-tertiary text-primary focus:bg-surface focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all placeholder:text-secondary/60 font-medium" placeholder="סיסמה" />
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-3.5 text-secondary hover:text-brand transition-colors">
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="remember-me-checkbox"
                        className="w-4 h-4 rounded border-subtle bg-tertiary text-brand focus:ring-brand transition-all cursor-pointer accent-brand"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label
                        htmlFor="remember-me-checkbox"
                        className="text-xs font-bold text-secondary cursor-pointer hover:text-primary transition-colors select-none"
                      >
                        השאר אותי מחובר
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotification({ type: 'success', message: 'לשחזור סיסמה נא לפנות לנגדת הארגון בימל"ם' })}
                      className="text-xs font-bold text-brand hover:text-brand-hover transition-colors"
                    >
                      שכחתי סיסמה?
                    </button>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button type="submit" className="flex-1 bg-brand hover:bg-brand-hover text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand/20 hover:-translate-y-1 active:scale-95"><LogIn size={20} />התחבר</button>
                    <button type="button" onClick={handleLoginPasskey} className="flex-1 bg-surface border-2 border-brand text-brand hover:bg-brand hover:text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-1 active:scale-95" title="כניסה עם ביומטרי / Passkey">
                      <Fingerprint size={24} />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-brand text-center mt-4">מחלק הסייבר Created by</p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-center mb-6">
                      <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface bg-tertiary flex items-center justify-center group-hover:border-brand transition-all shadow-xl">
                          {newAvatar ? <img src={newAvatar} alt="Profile" className="w-full h-full object-cover" /> : (
                            <div className="text-secondary flex flex-col items-center">
                              {isProcessingImage ? <Loader2 size={24} className="animate-spin text-brand" /> : <Camera size={24} />}
                              <span className="text-[10px] font-black mt-1 uppercase tracking-widest">{isProcessingImage ? 'מעבד...' : 'הוסף תמונה'}</span>
                            </div>
                          )}
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isProcessingImage} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" required value={regPersonalId} onChange={(e) => setRegPersonalId(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 rounded-2xl border border-subtle bg-tertiary text-primary focus:bg-surface focus:border-brand outline-none transition-all placeholder:text-secondary/60 text-sm font-medium" placeholder="מ״א (7 ספרות)" maxLength={7} />
                      <div className="relative group">
                        <input type={showRegPassword ? "text" : "password"} required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-4 py-3 pr-10 rounded-2xl border border-subtle bg-tertiary text-primary focus:bg-surface focus:border-brand outline-none transition-all placeholder:text-secondary/60 text-sm font-medium" placeholder="סיסמה" />
                        <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-3 text-secondary hover:text-brand transition-colors">
                          {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-subtle bg-tertiary text-primary focus:bg-surface focus:border-brand outline-none transition-all placeholder:text-secondary/60 text-sm font-medium" placeholder="שם מלא" />
                    <input type="tel" required value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 rounded-2xl border border-subtle bg-tertiary text-primary focus:bg-surface focus:border-brand outline-none transition-all placeholder:text-secondary/60 text-sm font-medium" placeholder="טלפון נייד" maxLength={10} />
                    <div className="grid grid-cols-2 gap-4">
                      <select required value={newBase} onChange={(e) => setNewBase(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-subtle bg-tertiary text-primary focus:bg-surface focus:border-brand outline-none appearance-none cursor-pointer text-sm font-medium">
                        <option value="" disabled>בחר בסיס</option>
                        {AVAILABLE_BASES.map(base => <option key={base} value={base}>{base}</option>)}
                      </select>
                      <select required value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-subtle bg-tertiary text-primary focus:bg-surface focus:border-brand outline-none appearance-none cursor-pointer text-sm font-medium">
                        <option value="" disabled>בחר תפקיד</option>
                        {AVAILABLE_JOB_TITLES.map(title => (
                          <option key={title} value={title}>{title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand/20 active:scale-95 mt-4" disabled={isProcessingImage}><UserPlus size={20} />בקשת הצטרפות</button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
