
import React from 'react';
import { LayoutDashboard, CalendarDays, ShieldCheck, LogOut, User as UserIcon, Settings, Calendar, X, Users, Edit2, Images } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  notificationCount: number;
  onEditProfile: () => void;
  theme?: 'light' | 'dark';
}

const Sidebar: React.FC<SidebarProps> = ({
  currentUser, currentView, onChangeView, onLogout, isOpen, onClose, notificationCount, onEditProfile, theme = 'light'
}) => {
  const navItemClass = (view: string) => `
    flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors w-full
    ${currentView === view ? 'bg-brand/10 text-brand font-bold shadow-sm' : 'text-secondary hover:bg-surface hover:text-primary'}
  `;

  const handleNavClick = (view: string) => {
    onChangeView(view);
    onClose();
  };

  const isDark = theme === 'dark';
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed top-0 right-0 z-50 h-screen w-64 bg-surface border-l border-subtle shadow-xl md:shadow-none
        transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* BRANDING HEADER */}
        <div className="relative h-48 shrink-0 border-b border-subtle flex flex-col items-center justify-center bg-surface overflow-hidden">
          <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
            <picture className="w-full h-full flex items-center justify-center">
              <img
                src={isDark ? "/logo_dark.png" : "/logo_light.png"}
                alt="SmartRoom System Logo"
                className="h-32 w-auto object-contain system-logo transition-transform duration-300 border-2 border-black dark:border-white rounded-2xl p-2 bg-surface/30"
                id="site-logo"
                loading="eager"
              />
            </picture>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:hidden text-secondary hover:text-primary p-1.5 rounded-full transition-colors bg-surface/50 border border-subtle"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar h-[calc(100vh-12rem)] md:h-auto">
          <div className="px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-1">תפריט</div>

          {isAdmin ? (
            <>
              <button onClick={() => handleNavClick('calendar')} className={navItemClass('calendar')}>
                <Calendar size={20} />
                <span>בחר תאריך</span>
              </button>
              <button onClick={() => handleNavClick('rooms')} className={navItemClass('rooms')}>
                <LayoutDashboard size={20} />
                <span>סייר בחדרים</span>
              </button>
            </>
          ) : (
            <button onClick={() => handleNavClick('calendar')} className={navItemClass('calendar')}>
              <Calendar size={20} />
              <span>הזמנת חדר</span>
            </button>
          )}

          <button onClick={() => handleNavClick('my-bookings')} className={navItemClass('my-bookings')}>
            <CalendarDays size={20} />
            <span>{isAdmin ? 'הזמנות חדרים' : 'ההזמנות שלי'}</span>
          </button>

          {isAdmin && (
            <>
              <div className="px-4 py-2 mt-6 text-xs font-semibold text-secondary uppercase tracking-wider mb-1">ניהול</div>
              <button onClick={() => handleNavClick('admin')} className={navItemClass('admin')}>
                <ShieldCheck size={20} />
                <span>אישורים</span>
                {notificationCount > 0 && (
                  <span className="mr-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <button onClick={() => handleNavClick('gallery')} className={navItemClass('gallery')}>
                <Images size={20} />
                <span>גלריית סיום</span>
              </button>
              <button onClick={() => handleNavClick('manage-rooms')} className={navItemClass('manage-rooms')}>
                <Settings size={20} />
                <span>ניהול חדרים</span>
              </button>
              <button onClick={() => handleNavClick('manage-accounts')} className={navItemClass('manage-accounts')}>
                <Users size={20} />
                <span>ניהול חשבונות</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 shrink-0 border-t border-subtle bg-main">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand overflow-hidden shrink-0 border border-brand/20">
              {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary truncate">{currentUser.name}</p>
                <button onClick={onEditProfile} className="text-secondary hover:text-brand p-0.5 rounded transition-colors" title="ערוך פרופיל"><Edit2 size={12} /></button>
              </div>
              <p className="text-xs text-secondary truncate">{isAdmin ? 'מנהל מערכת' : 'משתמש'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-surface border border-transparent hover:border-subtle rounded-md transition-all">
            <LogOut size={16} /><span>התנתק</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
