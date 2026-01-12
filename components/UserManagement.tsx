
import React, { useState } from 'react';
import {
  Trash2, Phone, Briefcase, MapPin, CheckCircle,
  Shield, User as UserIcon, ShieldPlus, ShieldOff,
  Key, CreditCard, Search, UserCheck as UserCheckIcon, UserX as UserXIcon,
  Users as UsersLucide, Info, Eye, EyeOff
} from 'lucide-react';
import { User } from '../types';

interface UserManagementProps {
  users: User[];
  currentUserId: string;
  onDeleteUser: (userId: string) => void;
  onPromoteUser: (userId: string) => void;
  onRevokeAdmin: (userId: string) => void;
  onUserApprove: (id: string) => void;
  onUserReject: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUserId,
  onDeleteUser,
  onPromoteUser,
  onRevokeAdmin,
  onUserApprove,
  onUserReject
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.personalId.includes(searchTerm) ||
    u.base.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Search Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">ניהול חשבונות</h2>
          <p className="text-secondary mt-2 font-medium flex items-center gap-2">
            <UsersLucide size={18} className="text-brand" />
            צפה ונהל את כל המשתמשים הרשומים במערכת ({users.length})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-96 group">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-secondary group-focus-within:text-brand transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="חפש לפי שם, מ״א או בסיס..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3.5 bg-surface border border-subtle rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className={`relative group bg-surface rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 ${user.status === 'PENDING'
                ? 'border-amber-500/50 shadow-amber-500/5'
                : 'border-subtle shadow-sm'
              }`}
          >
            {/* Top Status Bar */}
            <div className={`h-1.5 w-full ${user.role === 'ADMIN' ? 'bg-brand' :
                user.status === 'PENDING' ? 'bg-amber-400' : 'bg-subtle'
              }`} />

            <div className="p-6 flex flex-col h-full">
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 shadow-inner border transition-transform group-hover:scale-105 ${user.role === 'ADMIN' ? 'bg-brand border-brand/20' : 'bg-tertiary border-subtle'
                      }`}>
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        <span className="text-xl text-primary">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    {user.status === 'APPROVED' && (
                      <div className="absolute -bottom-1 -left-1 bg-surface p-1 rounded-full shadow-sm border border-subtle">
                        <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-primary text-lg leading-tight truncate group-hover:text-brand transition-colors">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${user.role === 'ADMIN'
                          ? 'bg-brand/10 text-brand border border-brand/20'
                          : 'bg-tertiary text-secondary border border-subtle'
                        }`}>
                        {user.role === 'ADMIN' ? <Shield size={10} /> : <UserIcon size={10} />}
                        {user.role === 'ADMIN' ? 'מנהל' : 'משתמש'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {user.id !== currentUserId && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => user.role === 'ADMIN' ? onRevokeAdmin(user.id) : onPromoteUser(user.id)}
                        className={`p-2 rounded-xl transition-all ${user.role === 'ADMIN'
                            ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                            : 'text-brand bg-brand/10 hover:bg-brand/20'
                          }`}
                        title={user.role === 'ADMIN' ? "בטל הרשאות ניהול" : "הפוך למנהל"}
                      >
                        {user.role === 'ADMIN' ? <ShieldOff size={18} /> : <ShieldPlus size={18} />}
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="מחק משתמש"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                <InfoItem icon={<CreditCard size={14} />} label="מספר אישי" value={user.personalId} />
                <InfoItem icon={<Briefcase size={14} />} label="תפקיד" value={user.jobTitle || 'N/A'} />
                <InfoItem icon={<Phone size={14} />} label="טלפון" value={user.phoneNumber || '---'} />
                <InfoItem icon={<MapPin size={14} />} label="בסיס" value={user.base} />
              </div>

              {/* Status Section / Footer */}
              <div className="pt-5 border-t border-subtle mt-auto">
                {user.status === 'PENDING' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onUserReject(user.id)}
                      className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-2xl transition-all active:scale-95 border border-red-500/20"
                    >
                      <UserXIcon size={16} />
                      דחה
                    </button>
                    <button
                      onClick={() => onUserApprove(user.id)}
                      className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-2xl transition-all shadow-lg shadow-brand/20 active:scale-95"
                    >
                      <UserCheckIcon size={16} />
                      אשר משתמש
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group/footer">
                    <div className="flex items-center gap-3">
                      <PasswordToggle password={user.password} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-secondary opacity-0 group-hover/footer:opacity-100 transition-opacity">
                        פעיל במערכת
                      </span>
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <CheckCircle size={18} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-24 bg-surface rounded-[3rem] border border-dashed border-subtle">
          <div className="w-24 h-24 bg-tertiary rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-secondary border border-subtle">
            <Search size={48} />
          </div>
          <h3 className="text-2xl font-bold text-primary">לא נמצאו משתמשים</h3>
          <p className="text-secondary mt-2 font-medium">נסה לשנות את מילות החיפוש או לבדוק סינון אחר.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-6 px-6 py-2.5 bg-brand text-white font-bold rounded-2xl hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
          >
            נקה חיפוש
          </button>
        </div>
      )}
    </div>
  );
};

// Internal Helper Components
const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex flex-col gap-1 p-3 bg-tertiary rounded-2xl border border-subtle hover:bg-surface hover:border-brand/30 transition-all">
    <span className="text-[10px] font-black text-secondary uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-2 text-sm font-bold text-primary truncate">
      <div className="text-brand shrink-0">{icon}</div>
      <span className="truncate">{value}</span>
    </div>
  </div>
);

const PasswordToggle = ({ password }: { password: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary border border-subtle rounded-xl max-w-full">
      <Key size={12} className="text-secondary" />
      <span className="text-[10px] font-mono font-bold text-secondary uppercase tracking-tighter truncate min-w-[60px]">
        {show ? password.replace('hash_', '') : '********'}
      </span>
      <button
        onClick={() => setShow(!show)}
        className="text-secondary hover:text-brand transition-colors p-0.5"
        title={show ? "הסתר סיסמה" : "הצג סיסמה"}
      >
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  );
};

export default UserManagement;
