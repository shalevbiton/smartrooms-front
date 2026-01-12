
import React, { useState, useEffect, useRef } from 'react';
import {
  Check, X, Clock, Calendar, Users, FileText, Hash, MapPin, Search,
  BarChart3, TrendingUp, AlertCircle, LayoutGrid, Phone, Briefcase,
  Key, Video, CreditCard, Settings, Image as ImageIcon, Upload,
  Info, Loader2, Trash2, ShieldAlert, UserCheck, User as UserIcon, FileSpreadsheet,
  ChevronDown, Download, CalendarDays, ArrowLeftRight
} from 'lucide-react';
import { Booking, Room, User } from '../types';
import { generateBookingsClipboardText } from '../utils/downloadUtils';
import { Copy } from 'lucide-react';

interface AdminDashboardProps {
  bookings: Booking[];
  rooms: Room[];
  users: User[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUserApprove: (id: string) => void;
  onUserReject: (id: string) => void;
  onUpdateBackground?: (url: string) => void;
  currentBackground?: string;
  onUpdateVideo?: (url: string) => void;
  onRemoveVideo?: () => void;
  onDelete: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings, rooms, users, onApprove, onReject, onUserApprove, onUserReject, onUpdateBackground, currentBackground, onUpdateVideo, onRemoveVideo, onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'users' | 'settings'>('bookings');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [customExportDate, setCustomExportDate] = useState('');
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [pendingExportBookings, setPendingExportBookings] = useState<Booking[] | null>(null);
  const [filterApprovedOnly, setFilterApprovedOnly] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingExportBookings) {
      const filtered = filterApprovedOnly
        ? pendingExportBookings.filter(b => b.status === 'APPROVED')
        : pendingExportBookings;

      const text = generateBookingsClipboardText(filtered, rooms, users);
      setPreviewText(text);
    }
  }, [pendingExportBookings, filterApprovedOnly, rooms, users]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const activeBookingsCount = bookings.filter(b => b.status === 'APPROVED').length;
  const totalUsersCount = users.filter(u => u.status === 'APPROVED').length;

  const getStatusPriority = (status: string) => {
    switch (status) {
      case 'APPROVED': return 1;
      case 'PENDING': return 2;
      case 'REJECTED': return 3;
      case 'CANCELLED': return 3;
      default: return 3;
    }
  };

  const filteredBookings = bookings
    .filter(b =>
      b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.offenses.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.interrogatedName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

  const filteredUsers = pendingUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.base.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.personalId.includes(searchTerm)
  );

  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const formatDate = (isoStr: string) => new Date(isoStr).toLocaleDateString('he-IL', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleExportCSV = async (range: 'all' | 'today' | 'yesterday' | 'week' | 'custom') => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let filteredForExport = [...bookings];
    let fileNamePrefix = 'all_data';

    if (range === 'today') {
      filteredForExport = bookings.filter(b => {
        const bDate = new Date(b.startTime);
        bDate.setHours(0, 0, 0, 0);
        return bDate.getTime() === now.getTime();
      });
      fileNamePrefix = 'today';
    } else if (range === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      filteredForExport = bookings.filter(b => {
        const bDate = new Date(b.startTime);
        bDate.setHours(0, 0, 0, 0);
        return bDate.getTime() === yesterday.getTime();
      });
      fileNamePrefix = 'yesterday';
    } else if (range === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      filteredForExport = bookings.filter(b => {
        const bDate = new Date(b.startTime);
        return bDate >= weekAgo;
      });
      fileNamePrefix = 'last_7_days';
    } else if (range === 'custom' && customExportDate) {
      filteredForExport = bookings.filter(b => {
        const bDateStr = new Date(b.startTime).toLocaleDateString('en-CA');
        return bDateStr === customExportDate;
      });
      fileNamePrefix = `date_${customExportDate}`;
    }

    // Sort by date ascending (oldest to newest)
    filteredForExport.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    setFilterApprovedOnly(false);
    setPendingExportBookings(filteredForExport);
    // Initial text generation will be triggered by useEffect
    // But we need to set a non-null previewText to open the modal if we rely on previewText!==null
    // So we can set a dummy text or let useEffect handle it.
    // To conform to previous logic where modal opens if previewText !== null, 
    // we should set initial text here as well or use another state for modal visibility.
    // However, useEffect runs after render. If we set pendingExportBookings, the effect will run.
    // But we need previewText to be not null to render.
    // Let's manually set the initial text here too to avoid flicker/logic issues.

    // Actually, let's just use the effect. But we need to open the modal.
    // Let's set previewText to "loading..." or the actual initial text.
    const text = generateBookingsClipboardText(filteredForExport, rooms, users);
    setPreviewText(text);

    setIsExportMenuOpen(false);
  };

  const handleCopyFromPreview = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      alert('הנתונים הועתקו ללוח בהצלחה!');
      setPreviewText(null);
      setPendingExportBookings(null);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('שגיאה בהעתקת הנתונים.');
    }
  };

  const compressImage = (file: File, maxW = 1920, maxH = 1080): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          if (width > height) { if (width > maxW) { height *= maxW / width; width = maxW; } }
          else { if (height > maxH) { width *= maxH / height; height = maxH; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedBase64 = await compressImage(file, 1920, 1080);
        if (onUpdateBackground) await onUpdateBackground(compressedBase64);
      } catch (error) { console.error(error); } finally { setIsCompressing(false); e.target.value = ''; }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">ניהול מערכת</h2>
          <p className="text-secondary mt-1 font-medium">מרכז שליטה ובקרה לאישור בקשות וניהול משתמשים.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-surface border border-subtle rounded-2xl text-xs font-black text-primary hover:text-brand hover:border-brand transition-all shadow-sm active:scale-95"
            >
              <FileSpreadsheet size={16} /> העתק נתונים ללוח
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-subtle bg-tertiary/30">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">טווחים מהירים</p>
                </div>
                <div className="p-1 space-y-0.5">
                  <button onClick={() => handleExportCSV('today')} className="w-full text-right px-4 py-2.5 text-xs font-bold text-primary hover:bg-brand/5 hover:text-brand rounded-xl flex items-center justify-between transition-colors">
                    היום
                    <Calendar size={14} className="opacity-50" />
                  </button>
                  <button onClick={() => handleExportCSV('yesterday')} className="w-full text-right px-4 py-2.5 text-xs font-bold text-primary hover:bg-brand/5 hover:text-brand rounded-xl flex items-center justify-between transition-colors">
                    אתמול
                    <CalendarDays size={14} className="opacity-50" />
                  </button>
                  <button onClick={() => handleExportCSV('week')} className="w-full text-right px-4 py-2.5 text-xs font-bold text-primary hover:bg-brand/5 hover:text-brand rounded-xl flex items-center justify-between transition-colors">
                    7 ימים אחרונים
                    <Clock size={14} className="opacity-50" />
                  </button>
                </div>

                <div className="p-3 border-y border-subtle bg-tertiary/30">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">בחירת תאריך ספציפי</p>
                </div>
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-secondary mr-1">בחר תאריך מהלוח:</label>
                    <input
                      type="date"
                      value={customExportDate}
                      onChange={(e) => setCustomExportDate(e.target.value)}
                      className="w-full px-3 py-2 bg-tertiary border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:border-brand transition-all"
                    />
                  </div>
                  <button
                    disabled={!customExportDate}
                    onClick={() => handleExportCSV('custom')}
                    className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${customExportDate
                      ? 'bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand-hover'
                      : 'bg-tertiary text-secondary cursor-not-allowed opacity-50'
                      }`}
                  >
                    <Download size={14} /> העתק תאריך נבחר
                  </button>
                </div>

                <div className="p-1 border-t border-subtle">
                  <button onClick={() => handleExportCSV('all')} className="w-full text-right px-4 py-2.5 text-xs font-bold text-primary hover:bg-brand/5 hover:text-brand rounded-xl flex items-center justify-between transition-colors">
                    כל נתוני המערכת
                    <ArrowLeftRight size={14} className="opacity-50" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeTab !== 'settings' && (
            <div className="relative w-full md:w-80 group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-brand transition-colors" size={20} />
              <input
                type="text"
                placeholder="חפש חוקר, נחקר או עבירה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-surface border border-subtle rounded-2xl text-primary focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-8 p-1.5 bg-tertiary/50 rounded-2xl border border-subtle inline-flex">
        <button onClick={() => setActiveTab('bookings')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'bookings' ? 'bg-surface text-brand shadow-md border border-subtle' : 'text-secondary hover:text-primary'}`}>
          בקשות חדרים <span className="bg-brand/10 text-brand text-[10px] font-black px-2 py-0.5 rounded-full border border-brand/20">{pendingBookings.length}</span>
        </button>
        <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-surface text-brand shadow-md border border-subtle' : 'text-secondary hover:text-primary'}`}>
          אישור משתמשים <span className="bg-brand/10 text-brand text-[10px] font-black px-2 py-0.5 rounded-full border border-brand/20">{pendingUsers.length}</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-surface text-brand shadow-md border border-subtle' : 'text-secondary hover:text-primary'}`}>
          <Settings size={18} /> הגדרות
        </button>
      </div>

      <div className="mb-12">
        {activeTab === 'bookings' && (
          <div className="grid grid-cols-1 gap-6">
            {filteredBookings.map(booking => {
              const room = getRoom(booking.roomId);
              return (
                <div key={booking.id} className="bg-surface rounded-3xl border border-subtle shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-xl hover:border-brand/20 transition-all group">
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-72 bg-tertiary/30 p-6 flex flex-col justify-between border-l border-subtle">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center border border-brand/20">
                            <LayoutGrid size={24} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-secondary uppercase tracking-widest">מיקום החקירה</h4>
                            <div>
                              <p className="text-lg font-black text-primary leading-tight">{room?.name || 'חדר לא ידוע'}</p>
                              {room?.locationType && <p className="text-xs font-bold text-secondary mt-0.5">{room.locationType}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                            <Calendar size={16} className="text-brand" />
                            {formatDate(booking.startTime)}
                          </div>
                          <div className="flex items-center gap-2 text-lg font-black text-primary">
                            <Clock size={18} className="text-brand" />
                            {new Date(booking.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-subtle mx-1">-</span>
                            {new Date(booking.endTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-subtle/50">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${booking.isRecorded ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                          {booking.isRecorded ? <Video size={16} className="animate-pulse" /> : <Video size={16} className="opacity-50" />}
                          <span className="text-xs font-black">{booking.isRecorded ? 'הקלטה פעילה' : 'ללא הקלטה'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-widest bg-tertiary w-fit px-3 py-1 rounded-full border border-subtle">
                            <Users size={12} /> צדדים בחקירה
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-secondary">חוקר מבצע</p>
                              <p className="text-sm font-black text-primary truncate">{booking.title}</p>
                              <p className="text-[10px] font-mono text-brand font-bold">מ"א {booking.investigatorId}</p>
                              {booking.phoneNumber && (
                                <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                                  <Phone size={10} /> {booking.phoneNumber}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-secondary">הנחקר</p>
                              <p className="text-sm font-black text-primary truncate">{booking.interrogatedName}</p>
                              <p className="text-[10px] font-mono text-slate-500 font-bold">ת"ז/מ"א {booking.secondInvestigatorId}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-widest bg-brand/5 w-fit px-3 py-1 rounded-full border border-brand/20">
                            <ShieldAlert size={12} /> פרטי התיק
                          </div>
                          <div className="bg-tertiary/30 p-3 rounded-2xl border border-subtle">
                            <p className="text-[10px] font-bold text-secondary mb-1">סוג העבירה:</p>
                            <p className="text-sm font-black text-primary leading-tight">{booking.offenses}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-subtle">
                        <div className="flex items-center gap-3 text-xs text-secondary font-medium">
                          <div className="w-8 h-8 rounded-full bg-surface border border-subtle flex items-center justify-center text-primary font-bold shadow-sm">
                            {booking.userName.charAt(0)}
                          </div>
                          <span>הוגש ע"י <strong>{booking.userName}</strong> ב- {new Date(booking.createdAt).toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setRejectingBookingId(booking.id)}
                                className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-black text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all"
                              >
                                דחה בקשה
                              </button>
                              <button
                                onClick={() => onApprove(booking.id)}
                                className="flex-1 sm:flex-none px-8 py-2.5 text-sm font-black text-white bg-brand hover:bg-brand-hover rounded-xl transition-all shadow-lg shadow-brand/20 active:scale-95 flex items-center justify-center gap-2"
                              >
                                <Check size={18} />
                                אשר הזמנה
                              </button>
                            </>
                          )}
                          {booking.status === 'APPROVED' && (
                            <div className="px-6 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-black border border-emerald-200 flex items-center gap-2">
                              <Check size={18} />
                              <span>הזמנה מאושרת</span>
                            </div>
                          )}
                          {(booking.status === 'REJECTED' || booking.status === 'CANCELLED') && (
                            <div className="px-6 py-2.5 bg-red-100 text-red-700 rounded-xl font-black border border-red-200 flex items-center gap-2">
                              <X size={18} />
                              <span>{booking.status === 'REJECTED' ? 'הזמנה נדחתה' : 'הזמנה בוטלה'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredBookings.length === 0 && (
              <div className="py-20 text-center bg-tertiary/30 rounded-[2rem] border border-dashed border-subtle">
                <div className="w-16 h-16 bg-surface rounded-3xl flex items-center justify-center mx-auto mb-4 text-secondary shadow-sm border border-subtle">
                  <FileText size={32} />
                </div>
                <h3 className="text-xl font-bold text-primary">לא נמצאו הזמנות</h3>
                <p className="text-secondary mt-1 font-medium">נסה לשנות את הסינון או החיפוש.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-surface p-5 rounded-3xl border border-subtle shadow-sm flex flex-col h-full animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold overflow-hidden border border-brand/20">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-primary text-lg">{user.name}</div>
                      <div className="text-xs text-secondary font-bold">מ״א: {user.personalId}</div>
                    </div>
                  </div>
                  <div className="text-[10px] bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full font-black border border-amber-500/20 uppercase tracking-widest">ממתין</div>
                </div>
                <div className="space-y-2 mb-6 text-sm text-secondary flex-1 mt-2">
                  <div className="flex items-center gap-2"><MapPin size={16} className="text-brand" /><span className="font-bold">{user.base}</span></div>
                  <div className="flex items-center gap-2"><Briefcase size={16} className="text-brand" /><span className="text-primary font-bold">{user.jobTitle || 'ללא תפקיד'}</span></div>
                  <div className="flex items-center gap-2"><Phone size={16} className="text-brand" /><span className="font-bold">{user.phoneNumber || 'ללא טלפון'}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-subtle mt-auto">
                  <button onClick={() => onUserReject(user.id)} className="py-2.5 text-sm font-black text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors">דחה</button>
                  <button onClick={() => onUserApprove(user.id)} className="py-2.5 text-sm font-black text-white bg-brand hover:bg-brand-hover rounded-xl transition-all shadow-lg shadow-brand/20 active:scale-95 flex items-center justify-center gap-2">
                    <UserCheck size={18} />
                    אשר
                  </button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full py-20 text-center bg-tertiary/30 rounded-[2rem] border border-dashed border-subtle">
                <div className="w-16 h-16 bg-surface rounded-3xl flex items-center justify-center mx-auto mb-4 text-secondary shadow-sm border border-subtle">
                  <Users size={32} />
                </div>
                <p className="text-secondary font-bold text-lg">אין משתמשים חדשים הממתינים לאישור.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="bg-surface rounded-3xl p-8 border border-subtle shadow-sm">
              <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-3"><ImageIcon size={24} className="text-brand" /> הגדרות מיתוג ועיצוב</h3>
              <div className="space-y-8">
                <div className="p-6 bg-tertiary/30 rounded-2xl border border-subtle">
                  <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-4">רקע אישי (יוצג רק עבורך)</label>
                  <div className="w-full h-40 bg-main rounded-2xl overflow-hidden relative border border-subtle mb-6">
                    {currentBackground ? (
                      <img src={currentBackground} alt="Preview" className="w-full h-full object-cover opacity-60" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary/30 font-black">אין רקע מותאם</div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input type="file" id="bg-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <label htmlFor="bg-upload" className="w-full py-3 px-4 bg-surface text-primary border border-subtle rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:bg-tertiary transition-all shadow-sm active:scale-95">
                        {isCompressing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        החלף רקע אישי
                      </label>
                    </div>
                    <button onClick={() => onUpdateBackground?.('')} className="px-6 py-3 text-xs font-black text-red-400 hover:bg-red-400/5 rounded-2xl transition-all border border-transparent hover:border-red-400/20">אפס רקע</button>
                  </div>
                </div>

                {/* Video Background Settings */}
                <div className="p-6 bg-tertiary/30 rounded-2xl border border-subtle">
                  <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-4">רקע וידאו (Live Background)</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        id="video-upload-admin"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && onUpdateVideo) {
                            const url = URL.createObjectURL(file);
                            onUpdateVideo(url);
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="video-upload-admin" className="w-full py-3 px-4 bg-surface text-primary border border-subtle rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:bg-tertiary transition-all shadow-sm active:scale-95">
                        <Video size={16} />
                        העלה וידאו רקע
                      </label>
                    </div>
                    <button onClick={() => onRemoveVideo?.()} className="px-6 py-3 text-xs font-black text-red-400 hover:bg-red-400/5 rounded-2xl transition-all border border-transparent hover:border-red-400/20">אפס וידאו</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-3">
              <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[10px] font-bold text-blue-600 leading-relaxed">
                שינויי המיתוג מבוצעים באופן "כירורגי" - הרקע האישי שיוגדר כאן יוצג עבורך בלבד ולא ישפיע על משתמשים אחרים. לוגו המערכת הוא קבוע ואינו ניתן לשינוי מרחוק מסיבות אבטחה.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BarChart3 size={24} />} count={activeBookingsCount} label="הזמנות מאושרות" color="text-emerald-500" />
        <StatCard icon={<Users size={24} />} count={totalUsersCount} label="סגל רשום" color="text-brand" />
        <StatCard icon={<FileText size={24} />} count={pendingBookings.length} label="בקשות פתוחות" color="text-amber-500" />
        <StatCard icon={<TrendingUp size={24} />} count={pendingUsers.length} label="ממתינים לסיווג" color="text-indigo-500" />
      </div>

      {
        rejectingBookingId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-subtle animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary">דחיית בקשה</h3>
                  <p className="text-secondary font-medium mt-1">כיצד תרצה לטפל בבקשה זו?</p>
                </div>

                <div className="w-full space-y-3 mt-4">
                  <button
                    onClick={() => {
                      onReject(rejectingBookingId);
                      setRejectingBookingId(null);
                    }}
                    className="w-full py-4 bg-tertiary hover:bg-tertiary/80 text-primary border border-subtle rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <X size={18} />
                    דחה בלבד (שמור בהיסטוריה)
                  </button>

                  <button
                    onClick={() => {
                      onDelete(rejectingBookingId);
                      setRejectingBookingId(null);
                    }}
                    className="w-full py-4 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all"
                  >
                    <Trash2 size={18} />
                    מחק בקשה לצמיתות
                  </button>
                </div>

                <button
                  onClick={() => setRejectingBookingId(null)}
                  className="text-sm font-bold text-secondary hover:text-primary mt-2"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )
      }

      {previewText !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-subtle animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary">תצוגה מקדימה להעתקה</h3>
                  <p className="text-secondary text-sm font-medium">בדוק את הנתונים לפני ההעתקה</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewText(null)}
                className="p-2 text-secondary hover:bg-tertiary rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4 px-4">
              <button
                onClick={() => setFilterApprovedOnly(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border ${!filterApprovedOnly ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface text-secondary border-subtle hover:bg-tertiary'}`}
              >
                הכל
              </button>
              <button
                onClick={() => setFilterApprovedOnly(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border ${filterApprovedOnly ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-surface text-secondary border-subtle hover:bg-tertiary'}`}
              >
                רק מאושרים
              </button>
            </div>

            <div className="flex-1 bg-tertiary/50 rounded-2xl p-4 border border-subtle overflow-y-auto mb-6">
              <pre className="text-xs md:text-sm font-mono text-primary whitespace-pre-wrap dir-rtl text-right">
                {previewText}
              </pre>
            </div>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setPreviewText(null)}
                className="flex-1 py-3 text-secondary hover:bg-tertiary rounded-xl font-bold transition-all border border-transparent hover:border-subtle"
              >
                ביטול
              </button>
              <button
                onClick={handleCopyFromPreview}
                className="flex-[2] py-3 bg-brand text-white hover:bg-brand-hover rounded-xl font-black shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                העתק ללוח וסגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

const StatCard = ({ icon, count, label, color }: { icon: any, count: number, label: string, color: string }) => (
  <div className="bg-surface p-6 rounded-3xl border border-subtle shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand/30 transition-all hover:shadow-md">
    <div className={`p-4 bg-tertiary rounded-2xl mb-4 group-hover:scale-110 transition-transform ${color}`}>{icon}</div>
    <p className="text-4xl font-black text-primary mb-1 tracking-tighter">{count}</p>
    <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{label}</p>
  </div>
);

export default AdminDashboard;
