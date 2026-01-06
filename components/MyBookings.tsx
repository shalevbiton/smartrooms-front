
import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, MapPin, Trash2, LogOut,
  Video, Play, X, ChevronDown, ChevronUp,
  Phone, Users, FileText, Download, LayoutList, Grid3X3,
  ChevronRight, ChevronLeft, ExternalLink, FileSpreadsheet,
  Maximize2, Filter, FilterX, Eye, EyeOff, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { Booking, Room } from '../types';
import { resolveVideoUrl } from './CheckoutGallery';
import { downloadFile, generateBookingSummary, convertToCSV } from '../utils/downloadUtils';

interface MyBookingsProps {
  bookings: Booking[];
  rooms: Room[];
  currentUserId: string;
  isAdmin?: boolean;
  onAction?: (id: string, type: 'CANCEL' | 'CHECKOUT' | 'DELETE') => void;
  onBookRoom?: (room: Room, startTime?: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

// Using 24 variable names for high visual variety
const BOOKING_VARS = [
  '--booking-1', '--booking-2', '--booking-3', '--booking-4',
  '--booking-5', '--booking-6', '--booking-7', '--booking-8',
  '--booking-9', '--booking-10', '--booking-11', '--booking-12',
  '--booking-13', '--booking-14', '--booking-15', '--booking-16',
  '--booking-17', '--booking-18', '--booking-19', '--booking-20',
  '--booking-21', '--booking-22', '--booking-23', '--booking-24',
];

const MyBookings: React.FC<MyBookingsProps> = ({ bookings, rooms, currentUserId, isAdmin = false, onAction, onBookRoom }) => {
  const [viewType, setViewType] = useState<'list' | 'schedule'>('list');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [videoMap, setVideoMap] = useState<Record<string, string | null>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllRoomsInSchedule, setShowAllRoomsInSchedule] = useState(false);
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);

  const getBookingColorVar = (bookingId: string) => {
    let hash = 0;
    for (let i = 0; i < bookingId.length; i++) {
      // Improved distribution using prime 31 multiplier to separate similar IDs
      hash = (hash * 31) + bookingId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return BOOKING_VARS[Math.abs(hash) % BOOKING_VARS.length];
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!isAdmin && b.userId !== currentUserId) return false;
      return true;
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [bookings, isAdmin, currentUserId]);

  const dailyBookings = useMemo(() => {
    return bookings.filter(b =>
      new Date(b.startTime).toLocaleDateString('en-CA') === selectedDate &&
      (b.status === 'APPROVED' || b.status === 'PENDING')
    );
  }, [bookings, selectedDate]);

  const scheduleRooms = useMemo(() => {
    if (showAllRoomsInSchedule) return rooms;
    const occupiedRoomIds = new Set(dailyBookings.map(b => b.roomId));
    const filtered = rooms.filter(room => occupiedRoomIds.has(room.id));
    return filtered.length > 0 ? filtered : rooms;
  }, [rooms, dailyBookings, showAllRoomsInSchedule]);

  useEffect(() => {
    const loadVideos = async () => {
      const map: Record<string, string | null> = {};
      for (const b of filteredBookings) {
        if (b.status === 'COMPLETED' && b.checkoutVideoUrl) {
          map[b.id] = await resolveVideoUrl(b.checkoutVideoUrl);
        }
      }
      setVideoMap(map);
    };
    loadVideos();
  }, [filteredBookings]);

  const getRoom = (id: string) => rooms.find(r => r.id === id);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED': return { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', text: 'מאושר' };
      case 'REJECTED': return { color: 'text-red-500 bg-red-500/10 border-red-500/20', text: 'סורב' };
      case 'CANCELLED': return { color: 'text-slate-400 bg-slate-500/5 border-subtle', text: 'בוטל' };
      case 'COMPLETED': return { color: 'text-brand bg-brand/10 border-brand/20', text: 'הושלם' };
      default: return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', text: 'ממתין' };
    }
  };

  const handleExportBookings = () => {
    const csv = convertToCSV(viewType === 'schedule' ? dailyBookings : filteredBookings, rooms);
    const fileName = viewType === 'schedule' ? `bookings_day_${selectedDate}.csv` : `all_bookings.csv`;
    downloadFile(csv, fileName, 'text/csv;charset=utf-8;');
  };

  const getBookingForSlot = (roomId: string, hour: number) => {
    return dailyBookings.find(b => {
      if (b.roomId !== roomId) return false;
      const start = new Date(b.startTime).getHours();
      const end = new Date(b.endTime).getHours();
      const endMinutes = new Date(b.endTime).getMinutes();
      return hour >= start && (hour < end || (hour === end && endMinutes > 0));
    });
  };

  const changeDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  const handleJumpToDetails = (booking: Booking) => {
    setViewType('list');
    setExpandedId(booking.id);
    setTimeout(() => {
      const element = document.getElementById(`booking-row-${booking.id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-auto">
      <div className="flex flex-col gap-4 mb-4 md:mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl md:text-3xl font-black text-primary tracking-tight">
              {isAdmin ? 'ניהול הזמנות ולו"ז' : 'ההזמנות שלי'}
            </h2>
            <p className="text-secondary text-[10px] md:text-sm font-medium mt-0.5">
              {isAdmin ? 'ניהול סדר יום ומשאבים ארגוניים' : 'מעקב אחר בקשות החדרים שלך'}
            </p>
          </div>
          {isAdmin && (
            <button onClick={handleExportBookings} className="flex md:hidden items-center justify-center p-2.5 bg-brand text-white rounded-xl shadow-lg active:scale-95">
              <FileSpreadsheet size={18} />
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 md:flex md:flex-wrap items-center justify-between gap-4">
            <div className="flex bg-tertiary p-1 rounded-xl border border-subtle">
              <button onClick={() => setViewType('schedule')} className={`flex-1 md:flex-none md:px-6 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] md:text-xs font-black rounded-lg transition-all ${viewType === 'schedule' ? 'bg-surface text-brand shadow-sm' : 'text-secondary'}`}>
                <Grid3X3 size={14} /> לו"ז יומי
              </button>
              <button onClick={() => setViewType('list')} className={`flex-1 md:flex-none md:px-6 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] md:text-xs font-black rounded-lg transition-all ${viewType === 'list' ? 'bg-surface text-brand shadow-sm' : 'text-secondary'}`}>
                <LayoutList size={14} /> רשימת הזמנות
              </button>
            </div>

            {viewType === 'schedule' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllRoomsInSchedule(!showAllRoomsInSchedule)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all border ${showAllRoomsInSchedule ? 'bg-brand/10 border-brand text-brand' : 'bg-surface border-subtle text-secondary'
                    }`}
                >
                  {showAllRoomsInSchedule ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showAllRoomsInSchedule ? 'הצג רק תפוסים' : 'הצג את כל החדרים'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {viewType === 'list' ? (
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-surface rounded-2xl p-12 text-center border border-dashed border-subtle">
              <Calendar size={48} className="mx-auto text-secondary/30 mb-4" />
              <h3 className="text-lg font-bold text-primary">לא נמצאו הזמנות</h3>
              <p className="text-secondary text-sm">נראה שעדיין לא ביצעת הזמנות חדרים.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const room = getRoom(booking.roomId);
              const status = getStatusConfig(booking.status);
              const isExpanded = expandedId === booking.id;
              const colorVar = getBookingColorVar(booking.id);

              return (
                <div
                  key={booking.id}
                  id={`booking-row-${booking.id}`}
                  className="bg-surface rounded-2xl border border-subtle shadow-sm overflow-hidden hover:border-brand/30 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-lg"
                        style={{ backgroundColor: `var(${colorVar})` }}
                      >
                        <Clock size={24} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-primary truncate">{booking.title}</h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-xs text-secondary flex items-center gap-1.5 mt-1 font-medium">
                          <MapPin size={12} className="text-brand" />
                          {room?.name} | {new Date(booking.startTime).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 md:gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-subtle">
                      <div className="text-left md:text-right">
                        <p className="text-xs font-black text-primary">
                          {new Date(booking.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-secondary font-bold">משך: {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 3600000)} שעות</p>
                      </div>

                      <div className="flex gap-2">
                        {(booking.status === 'CANCELLED' || booking.status === 'REJECTED') && onAction && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAction(booking.id, 'DELETE');
                            }}
                            className="p-2.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            title="מחק מההיסטוריה"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                          className="p-2.5 text-secondary hover:bg-tertiary rounded-xl transition-all"
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6 bg-tertiary/30 border-t border-subtle space-y-6 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-secondary uppercase tracking-widest">חוקר / מבצע</p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface border border-subtle flex items-center justify-center text-primary font-bold shadow-sm">
                              {booking.title.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{booking.title}</p>
                              <p className="text-[10px] text-brand font-bold">מ"א {booking.investigatorId}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-secondary uppercase tracking-widest">הנחקר</p>
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-brand" />
                            <div>
                              <p className="text-sm font-bold text-primary">{booking.interrogatedName}</p>
                              <p className="text-[10px] text-secondary font-bold">ת"ז/מ"א {booking.secondInvestigatorId}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-secondary uppercase tracking-widest">סוג העבירה</p>
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-brand" />
                            <p className="text-sm font-bold text-primary truncate" title={booking.offenses}>{booking.offenses}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-secondary uppercase tracking-widest">פעולות</p>
                          <div className="flex gap-2">
                            {booking.status === 'APPROVED' && onAction && (
                              <>
                                {(new Date(booking.startTime) <= new Date() && new Date(booking.endTime) > new Date()) && (
                                  <button
                                    onClick={() => onAction(booking.id, 'CHECKOUT')}
                                    className="flex-1 py-2 text-[10px] font-black text-white bg-brand hover:bg-brand-hover border border-transparent rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                                  >
                                    <LogOut size={14} />
                                    סיים שימוש
                                  </button>
                                )}
                                <button
                                  onClick={() => setActionBookingId(booking.id)}
                                  className="flex-1 py-2 text-[10px] font-black text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                                >
                                  ביטול הזמנה
                                </button>
                              </>
                            )}
                            {booking.status === 'PENDING' && isAdmin && onAction && (
                              <button
                                onClick={() => onAction(booking.id, 'DELETE')}
                                className="flex-1 py-2 text-[10px] font-black text-slate-500 bg-slate-500/10 border border-slate-500/20 rounded-lg hover:bg-slate-500/20 transition-all"
                              >
                                מחק בקשה
                              </button>
                            )}
                            {booking.status === 'REJECTED' && isAdmin && onAction && (
                              <button
                                onClick={() => onAction(booking.id, 'DELETE')}
                                className="flex-1 py-2 text-[10px] font-black text-slate-500 bg-slate-500/10 border border-slate-500/20 rounded-lg hover:bg-slate-500/20 transition-all"
                              >
                                מחק הזמנה
                              </button>
                            )}
                            {booking.status === 'CANCELLED' && onAction && (
                              <button
                                onClick={() => onAction(booking.id, 'DELETE')}
                                className="flex-1 py-2 text-[10px] font-black text-slate-500 bg-slate-500/10 border border-slate-500/20 rounded-lg hover:bg-slate-500/20 transition-all"
                              >
                                מחק מההיסטוריה
                              </button>
                            )}
                            {booking.status === 'COMPLETED' && isAdmin && onAction && (
                              <button
                                onClick={() => onAction(booking.id, 'DELETE')}
                                className="flex-1 py-2 text-[10px] font-black text-slate-500 bg-slate-500/10 border border-slate-500/20 rounded-lg hover:bg-slate-500/20 transition-all"
                              >
                                מחק מההיסטוריה
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-3xl border border-subtle shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col">
          <div className="p-4 md:p-6 border-b border-subtle bg-tertiary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-surface border border-subtle rounded-xl p-1">
                <button onClick={() => changeDay(-1)} className="p-2 hover:bg-tertiary rounded-lg text-secondary transition-all"><ChevronRight size={20} /></button>
                <div className="px-4 text-center min-w-[140px]">
                  <p className="text-sm font-black text-primary leading-tight">{new Date(selectedDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-[10px] text-secondary font-bold uppercase">{new Date(selectedDate).toLocaleDateString('he-IL', { weekday: 'long' })}</p>
                </div>
                <button onClick={() => changeDay(1)} className="p-2 hover:bg-tertiary rounded-lg text-secondary transition-all"><ChevronLeft size={20} /></button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <div className="min-w-[800px]">
              <div className="flex border-b border-subtle bg-tertiary/10">
                <div className="w-40 shrink-0 p-4 font-black text-secondary text-[10px] uppercase tracking-widest border-l border-subtle bg-surface/50">חדר / שעה</div>
                {HOURS.map(hour => (
                  <div key={hour} className="flex-1 p-3 text-center text-[10px] font-black text-secondary border-l border-subtle/30">{hour.toString().padStart(2, '0')}:00</div>
                ))}
              </div>

              {scheduleRooms.map(room => (
                <div key={room.id} className="flex border-b border-subtle group hover:bg-tertiary/5 transition-colors">
                  <div className="w-40 shrink-0 p-4 border-l border-subtle bg-surface/30 flex flex-col justify-center">
                    <span className="font-bold text-primary text-xs truncate">{room.name}</span>
                    <span className="text-[9px] text-secondary flex items-center gap-1 mt-0.5"><Users size={8} /> {room.capacity}</span>
                  </div>

                  {HOURS.map(hour => {
                    const booking = getBookingForSlot(room.id, hour);
                    const isStart = booking && new Date(booking.startTime).getHours() === hour;

                    if (booking) {
                      const colorVar = getBookingColorVar(booking.id);
                      return (
                        <div key={hour} className={`flex-1 p-0.5 relative ${booking.status === 'APPROVED' ? '' : 'opacity-60'}`}>
                          <div
                            className="h-full w-full rounded-md flex flex-col items-center justify-center p-1 transition-all shadow-sm border border-black/5 cursor-pointer hover:scale-105 z-10"
                            style={{ backgroundColor: `var(${colorVar})` }}
                            onClick={() => handleJumpToDetails(booking)}
                          >
                            {isStart && (
                              <div className="w-full text-center space-y-0.5">
                                <p className="text-[8px] font-black text-white/90 truncate uppercase tracking-tighter">{booking.title}</p>
                                {booking.status === 'PENDING' && <AlertTriangle size={8} className="text-white/80 mx-auto" />}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={hour} className="flex-1 border-l border-subtle/20 group/slot relative">
                        <button
                          onClick={() => onBookRoom?.(room, `${hour.toString().padStart(2, '0')}:00`)}
                          className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 bg-brand/5 flex items-center justify-center transition-all"
                        >
                          <Clock size={12} className="text-brand/50" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {actionBookingId && onAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-subtle animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
                <ShieldAlert size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-primary">ביטול הזמנה</h3>
                <p className="text-secondary font-medium mt-1">כיצד תרצה לטפל בהזמנה זו?</p>
              </div>

              <div className="w-full space-y-3 mt-4">
                <button
                  onClick={() => {
                    onAction(actionBookingId, 'CANCEL');
                    setActionBookingId(null);
                  }}
                  className="w-full py-4 bg-tertiary hover:bg-tertiary/80 text-primary border border-subtle rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <X size={18} />
                  בטל בלבד (שמור בהיסטוריה)
                </button>

                <button
                  onClick={() => {
                    onAction(actionBookingId, 'DELETE');
                    setActionBookingId(null);
                  }}
                  className="w-full py-4 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all"
                >
                  <Trash2 size={18} />
                  מחק הזמנה לצמיתות
                </button>
              </div>

              <button
                onClick={() => setActionBookingId(null)}
                className="text-sm font-bold text-secondary hover:text-primary mt-2"
              >
                חזור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
