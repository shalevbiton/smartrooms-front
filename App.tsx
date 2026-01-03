import React, { useState, useEffect, useCallback } from 'react';
import { usersApi, roomsApi, bookingsApi } from './services/api';
import Sidebar from './components/Sidebar';
import RoomCard from './components/RoomCard';
import BookingModal from './components/BookingModal';
import AdminDashboard from './components/AdminDashboard';
import MyBookings from './components/MyBookings';
import LoginScreen from './components/LoginScreen';
import DateSelectionCalendar from './components/DateSelectionCalendar';
import UserProfileModal from './components/UserProfileModal';
import RoomManagement from './components/RoomManagement';
import UserManagement from './components/UserManagement';
import EditRoomModal from './components/EditRoomModal';
import CheckoutGallery from './components/CheckoutGallery';
import CheckoutModal from './components/CheckoutModal';
import { HighFrictionModal, UndoToast } from './components/SafetyPortal';
import VideoBackground from './components/VideoBackground';
import { Room, Booking, User } from './types';
import { Menu, CheckCircle, AlertTriangle, Loader2, Sun, Moon, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('smartroom_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('smartroom_theme', theme);

    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark-mode');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem('smartroom_auth_session');
        if (stored) {
          try {
            const { user, expires } = JSON.parse(stored);
            if (new Date().getTime() < expires) {
              setCurrentUser(user);
              setIsLoading(false);
              return;
            } else {
              localStorage.removeItem('smartroom_auth_session');
            }
          } catch (e) {
            localStorage.removeItem('smartroom_auth_session');
          }
        }

        const sessionUser = sessionStorage.getItem('smartroom_user');
        if (sessionUser) {
          try {
            const user = JSON.parse(sessionUser);
            setCurrentUser(user);
            setIsLoading(false);
            return;
          } catch (e) {
            sessionStorage.removeItem('smartroom_user');
          }
        }
      } catch (error) {
        console.debug("Auth initialization finalized.");
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const [systemBackground] = useState<string>(() => {
    return localStorage.getItem('smartroom_bg') || 'https://upload.wikimedia.org/wikipedia/commons/1/18/Yamar_metzach.png';
  });

  const [currentView, setCurrentView] = useState('calendar');
  const [selectedContextDate, setSelectedContextDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [globalNotification, setGlobalNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [safetyModal, setSafetyModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmString: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmString: '',
    confirmLabel: '',
    onConfirm: () => { }
  });

  const [undoAction, setUndoAction] = useState<{
    id: string;
    message: string;
    timer: any;
  } | null>(null);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeCheckoutBooking, setActiveCheckoutBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // Load all data
    const loadData = async () => {
      try {
        const [roomsData, bookingsData, usersData] = await Promise.all([
          roomsApi.getAll(),
          bookingsApi.getAll(),
          usersApi.getAll(),
        ]);

        setRooms(roomsData);
        setBookings(bookingsData);
        setUsers(usersData);

        if (currentUser) {
          const updatedMe = (usersData as User[]).find((u: User) => u.id === currentUser.id);
          if (updatedMe) {
            setCurrentUser(updatedMe);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("API error:", error);
        setGlobalNotification({ type: 'error', message: 'שגיאת תקשורת עם בסיס הנתונים. נסה לרענן.' });
        setIsLoading(false);
      }
    };

    loadData();

    // Poll for updates every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    if (globalNotification) {
      const timer = setTimeout(() => {
        setGlobalNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [globalNotification]);

  const handleRegister = async (personalId: string, password: string, name: string, base: string, phoneNumber: string, jobTitle: string, avatar?: string) => {
    try {
      const newUser = {
        personalId,
        password,
        name,
        base,
        phoneNumber,
        jobTitle,
        avatar,
        role: 'USER',
        status: 'PENDING'
      };
      await usersApi.create(newUser);
      setGlobalNotification({ type: 'success', message: 'בקשת ההרשמה נשלחה וממתינה לאישור מנהל.' });
    } catch (e) {
      console.error(e);
      setGlobalNotification({ type: 'error', message: 'ההרשמה נכשלה. נא לנסות שוב.' });
    }
  };

  const handleLogin = (user: User, rememberMe: boolean) => {
    if (rememberMe) {
      const EXPIRE_30_DAYS = 30 * 24 * 60 * 60 * 1000;
      const expires = new Date().getTime() + EXPIRE_30_DAYS;
      localStorage.setItem('smartroom_auth_session', JSON.stringify({ user, expires }));
      sessionStorage.removeItem('smartroom_user');
    } else {
      sessionStorage.setItem('smartroom_user', JSON.stringify(user));
      localStorage.removeItem('smartroom_auth_session');
    }
    setCurrentUser(user);
    setCurrentView(user.role === 'ADMIN' ? 'admin' : 'calendar');
  };

  const handleUpdateBackground = async (url: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    try {
      await usersApi.update(currentUser.id, { customBackground: url });
      setGlobalNotification({ type: 'success', message: 'הרקע האישי עודכן בהצלחה.' });
    } catch (e) {
      console.error(e);
      setGlobalNotification({ type: 'error', message: 'שגיאה בעדכון הרקע.' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smartroom_auth_session');
    sessionStorage.removeItem('smartroom_user');
    setCurrentUser(null);
    setSelectedContextDate(null);
    setIsMobileMenuOpen(false);
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    try {
      await usersApi.update(currentUser.id, data);
      setGlobalNotification({ type: 'success', message: 'הפרופיל עודכן בהצלחה.' });
    } catch (e) {
      console.error(e);
      setGlobalNotification({ type: 'error', message: 'עדכון הפרופיל נכשל.' });
    }
  };

  const handleDateSelection = (date: string) => {
    setSelectedContextDate(date);
    setCurrentView('rooms'); // Jumps directly to rooms view for selected date
  };

  const handleOpenBooking = (room: Room, startTime?: string) => {
    setSelectedRoom(room);
    setPrefilledTime(startTime);
    setIsModalOpen(true);
  };

  const handleCreateBooking = async (data: any) => {
    if (!currentUser) return;

    const startISO = `${data.date}T${data.startTime || '00:00'}:00`;
    const endISO = `${data.date}T${data.endTime || '23:59'}:00`;
    const requestedStart = new Date(startISO).getTime();
    const requestedEnd = new Date(endISO).getTime();
    const now = new Date().getTime();

    if (requestedStart < now - (5 * 60 * 1000)) {
      setGlobalNotification({ type: 'error', message: 'לא ניתן לבצע הזמנה לשעה שכבר עברה.' });
      return;
    }

    const hasConflict = bookings.some(b => {
      if (b.roomId !== data.roomId || b.status !== 'APPROVED') return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return requestedStart < bEnd && requestedEnd > bStart;
    });

    if (hasConflict) {
      setGlobalNotification({ type: 'error', message: 'שגיאה: החדר כבר מוזמן בשעות אלו.' });
      return;
    }

    const newBooking: Omit<Booking, 'id'> = {
      userId: currentUser.id,
      userName: currentUser.name,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      roomId: data.roomId,
      title: data.title,
      investigatorId: data.investigatorId,
      secondInvestigatorId: data.secondInvestigatorId,
      interrogatedName: data.interrogatedName,
      offenses: data.offenses,
      description: data.description || '',
      startTime: startISO,
      endTime: endISO,
      isRecorded: data.isRecorded,
      phoneNumber: data.phoneNumber
    };

    try {
      await bookingsApi.create(newBooking);
      setCurrentView('my-bookings');
      setGlobalNotification({ type: 'success', message: 'בקשת ההזמנה נשלחה בהצלחה!' });
    } catch (e) {
      setGlobalNotification({ type: 'error', message: 'שגיאה ביצירת ההזמנה.' });
    }
  };

  const handleBookingAction = async (id: string, type: 'CANCEL' | 'CHECKOUT' | 'DELETE') => {
    try {
      if (type === 'DELETE') {
        const booking = bookings.find(b => b.id === id);
        const timer = setTimeout(async () => {
          await bookingsApi.delete(id);
          setUndoAction(null);
        }, 6000);

        setUndoAction({
          id,
          message: `ההזמנה של "${booking?.title}" הוסרה.`,
          timer
        });
      } else if (type === 'CANCEL') {
        await bookingsApi.update(id, { status: 'CANCELLED' });
        setGlobalNotification({ type: 'success', message: 'ההזמנה בוטלה.' });
      } else if (type === 'CHECKOUT') {
        const booking = bookings.find(b => b.id === id);
        if (booking) {
          setActiveCheckoutBooking(booking);
          setIsCheckoutModalOpen(true);
        }
      }
    } catch (e) {
      setGlobalNotification({ type: 'error', message: 'פעולה נכשלה.' });
    }
  };

  const handleCancelDelete = () => {
    if (undoAction) {
      clearTimeout(undoAction.timer);
      setUndoAction(null);
      setGlobalNotification({ type: 'success', message: 'המחיקה בוטלה בהצלחה.' });
    }
  };

  const handleFinishCheckout = async (videoUrl: string) => {
    if (!activeCheckoutBooking) return;
    try {
      await bookingsApi.update(activeCheckoutBooking.id, {
        status: 'COMPLETED',
        checkoutVideoUrl: videoUrl
      });

      setGlobalNotification({ type: 'success', message: 'השימוש בחדר הסתיים בהצלחה.' });
      setActiveCheckoutBooking(null);
      setIsCheckoutModalOpen(false);
    } catch (e) {
      console.error("API update failed:", e);
      setGlobalNotification({ type: 'error', message: 'שגיאה בעדכון בסיס הנתונים. נא לנסות שוב.' });
      throw e;
    }
  };

  const handleRoomSave = async (data: Partial<Room>) => {
    try {
      if (roomToEdit) {
        await roomsApi.update(roomToEdit.id, data);
        setGlobalNotification({ type: 'success', message: 'פרטי החדר עודכנו.' });
      } else {
        const newRoom = {
          name: data.name || '',
          capacity: data.capacity || 0,
          equipment: data.equipment || [],
          imageUrl: data.imageUrl || '',
          description: data.description || '',
          isAvailable: data.isAvailable ?? true,
          isRecorded: data.isRecorded ?? false
        };
        await roomsApi.create(newRoom);
        setGlobalNotification({ type: 'success', message: 'חדר חדש נוסף למערכת.' });
      }
      setIsEditRoomModalOpen(false);
      setRoomToEdit(null);
    } catch (e) {
      setGlobalNotification({ type: 'error', message: 'שגיאה בשמירת החדר.' });
    }
  };

  const handlePromoteUser = async (id: string) => {
    try {
      await usersApi.update(id, { role: 'ADMIN' });
      setGlobalNotification({ type: 'success', message: 'המשתמש קודם לדרגת מנהל.' });
    } catch (e) {
      setGlobalNotification({ type: 'error', message: 'פעולה נכשלה.' });
    }
  };

  const handleRevokeAdmin = async (id: string) => {
    try {
      await usersApi.update(id, { role: 'USER' });
      setGlobalNotification({ type: 'success', message: 'הרשאות הניהול הוסרו מהמשתמש.' });
    } catch (e) {
      setGlobalNotification({ type: 'error', message: 'פעולה נכשלה.' });
    }
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    setSafetyModal({
      isOpen: true,
      title: 'מחיקת משתמש לצמיתות',
      description: `האם אתה בטוח שברצונך למחוק את "${user.name}"? פעולה זו תסיר את כל הנתונים שלו ולא ניתנת לביטול.`,
      confirmString: 'מחק',
      confirmLabel: 'מחק משתמש',
      onConfirm: async () => {
        try {
          await usersApi.delete(id);
          setGlobalNotification({ type: 'success', message: 'המשתמש נמחקה מהמערכת.' });
        } catch (e) {
          setGlobalNotification({ type: 'error', message: 'פעולה נכשלה.' });
        }
        setSafetyModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUserApprove = async (id: string) => {
    try {
      await usersApi.update(id, { status: 'APPROVED' });
      setGlobalNotification({ type: 'success', message: 'המשתמש אושר לכניסה למערכת.' });
    } catch (e) {
      setGlobalNotification({ type: 'error', message: 'פעולה נכשלה.' });
    }
  };

  const handleUserReject = async (id: string) => {
    try {
      await usersApi.update(id, { status: 'REJECTED' });
      setGlobalNotification({ type: 'success', message: 'המשתמש נדחה.' });
    } catch (e) {
      setGlobalNotification({ type: 'error', message: 'פעולה נכשלה.' });
    }
  };

  const activeBackground = (currentUser?.role === 'ADMIN' && currentUser.customBackground)
    ? currentUser.customBackground
    : systemBackground;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-secondary font-medium">טוען נתונים מהענן...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        existingUsers={users}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onRemoveUser={handleDeleteUser}
        backgroundImage={activeBackground}
        theme={theme}
      />
    );
  }

  const isAdmin = currentUser.role === 'ADMIN';
  const visibleBookings = bookings.filter(b => b.id !== undoAction?.id);

  const formattedContextDate = selectedContextDate ? new Date(selectedContextDate).toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }) : null;

  return (
    <div className="flex min-h-screen relative font-sans antialiased overflow-y-auto" dir="rtl">
      {/* Video Background Component */}
      <VideoBackground
        fallbackBackground={activeBackground || 'var(--bg-main)'}
        overlayOpacity={0.4}
      />

      {/* Additional overlay for content readability */}
      <div className="absolute inset-0 bg-main/85 backdrop-blur-[4px] z-0 pointer-events-none transition-colors duration-300"></div>

      <Sidebar
        currentUser={currentUser}
        currentView={currentView}
        onChangeView={setCurrentView}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        notificationCount={bookings.filter(b => b.status === 'PENDING').length + users.filter(u => u.status === 'PENDING').length}
        onEditProfile={() => setIsProfileModalOpen(true)}
        theme={theme}
      />

      <main className="flex-1 md:mr-64 p-6 md:p-10 w-full relative z-10 transition-colors duration-300 overflow-y-auto custom-scrollbar">
        {globalNotification && (
          <div className="fixed top-6 left-6 z-50 animate-in slide-in-from-left-10 fade-in duration-500">
            <div className={`bg-surface/90 backdrop-blur-md border-r-4 shadow-2xl rounded-xl p-5 flex items-center gap-4 ${globalNotification.type === 'success' ? 'border-emerald-500' : 'border-red-500'}`}>
              <div className={`p-2 rounded-full ${globalNotification.type === 'success' ? 'bg-emerald-100/20 text-emerald-600' : 'bg-red-100/20 text-red-600'}`}>
                {globalNotification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold text-primary leading-none">מערכת</p>
                <p className="text-sm text-secondary mt-1">{globalNotification.message}</p>
              </div>
            </div>
          </div>
        )}

        {undoAction && (
          <UndoToast
            message={undoAction.message}
            onUndo={handleCancelDelete}
          />
        )}

        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2.5 text-secondary bg-surface/80 rounded-xl shadow-sm border border-subtle"><Menu size={24} /></button>
            <div>
              <h1 className="text-3xl font-extrabold text-primary tracking-tight">SmartRoom</h1>
              <p className="text-secondary font-medium">ברוך הבא, {currentUser.name.split(' ')[0]}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-3 bg-surface border border-subtle rounded-2xl text-secondary hover:text-brand transition-all shadow-sm active:scale-95"
            title={theme === 'light' ? 'עבור למצב כהה' : 'עבור למצב בהיר'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </header>

        <div className="max-w-7xl mx-auto">
          {currentView === 'calendar' && (
            <DateSelectionCalendar onSelectDate={handleDateSelection} rooms={rooms} bookings={bookings} />
          )}

          {currentView === 'rooms' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/50 p-4 rounded-2xl border border-subtle backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/10 text-brand rounded-xl">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary">בחר חדר להזמנה</h2>
                    <p className="text-xs text-secondary font-medium">{formattedContextDate || 'בחר תאריך מהיומן'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('calendar')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand hover:bg-brand/10 rounded-xl transition-all"
                >
                  <ArrowLeft size={16} /> שינוי תאריך
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {rooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onBook={handleOpenBooking}
                    isAdmin={isAdmin}
                    bookings={visibleBookings}
                    selectedDate={selectedContextDate}
                    currentUser={currentUser}
                    onAction={handleBookingAction}
                    onEdit={(room) => { setRoomToEdit(room); setIsEditRoomModalOpen(true); }}
                    onDelete={(room) => {
                      setSafetyModal({
                        isOpen: true,
                        title: 'מחיקת חדר מהמערכת',
                        description: `אתה עומד למחוק את "${room.name}". כל ההזמנות המשויכות לחדר זה יבוטלו.`,
                        confirmString: room.name,
                        confirmLabel: 'מחק חדר',
                        onConfirm: async () => {
                          try {
                            await roomsApi.delete(room.id);
                            setGlobalNotification({ type: 'success', message: 'החדר נמחקה.' });
                          } catch (e) {
                            setGlobalNotification({ type: 'error', message: 'מחיקת החדר נכשלה.' });
                          }
                          setSafetyModal(prev => ({ ...prev, isOpen: false }));
                        }
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {currentView === 'my-bookings' && (
            <MyBookings
              bookings={visibleBookings}
              rooms={rooms}
              currentUserId={currentUser.id}
              isAdmin={isAdmin}
              onAction={handleBookingAction}
              onBookRoom={handleOpenBooking}
            />
          )}

          {currentView === 'admin' && (
            <AdminDashboard
              bookings={visibleBookings}
              rooms={rooms}
              users={users}
              onApprove={async (id) => {
                await bookingsApi.update(id, { status: 'APPROVED' });
              }}
              onReject={async (id) => {
                await bookingsApi.update(id, { status: 'REJECTED' });
              }}
              onUserApprove={handleUserApprove}
              onUserReject={handleUserReject}
              onUpdateBackground={handleUpdateBackground}
              currentBackground={activeBackground}
            />
          )}

          {currentView === 'manage-rooms' && (
            <RoomManagement
              rooms={rooms}
              onEdit={(room) => { setRoomToEdit(room); setIsEditRoomModalOpen(true); }}
              onDelete={(room) => {
                setSafetyModal({
                  isOpen: true,
                  title: 'מחיקת חדר מהמערכת',
                  description: `אתה עומד למחוק את "${room.name}". כל ההזמנות המשויכות לחדר זה יבוטלו.`,
                  confirmString: room.name,
                  confirmLabel: 'מחק חדר',
                  onConfirm: async () => {
                    try {
                      await roomsApi.delete(room.id);
                      setGlobalNotification({ type: 'success', message: 'החדר נמחקה.' });
                    } catch (e) {
                      setGlobalNotification({ type: 'error', message: 'מחיקת החדר נכשלה.' });
                    }
                    setSafetyModal(prev => ({ ...prev, isOpen: false }));
                  }
                });
              }}
              onAdd={() => { setRoomToEdit(null); setIsEditRoomModalOpen(true); }}
            />
          )}

          {currentView === 'manage-accounts' && (
            <UserManagement
              users={users}
              currentUserId={currentUser.id}
              onDeleteUser={handleDeleteUser}
              onPromoteUser={handlePromoteUser}
              onRevokeAdmin={handleRevokeAdmin}
              onUserApprove={handleUserApprove}
              onUserReject={handleUserReject}
            />
          )}

          {currentView === 'gallery' && (
            <CheckoutGallery bookings={visibleBookings} rooms={rooms} />
          )}
        </div>
      </main>

      <BookingModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBooking}
        selectedDate={selectedContextDate}
        allBookings={bookings}
        prefilledStartTime={prefilledTime}
      />

      {isProfileModalOpen && <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} onSave={handleUpdateProfile} />}

      {isEditRoomModalOpen && (
        <EditRoomModal
          isOpen={isEditRoomModalOpen}
          onClose={() => setIsEditRoomModalOpen(false)}
          room={roomToEdit}
          onSave={handleRoomSave}
          existingRooms={rooms}
        />
      )}

      {isCheckoutModalOpen && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => { setIsCheckoutModalOpen(false); setActiveCheckoutBooking(null); }}
          onConfirm={handleFinishCheckout}
          roomName={rooms.find(r => r.id === activeCheckoutBooking?.roomId)?.name || 'החדר'}
        />
      )}

      <HighFrictionModal
        {...safetyModal}
        onClose={() => setSafetyModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;