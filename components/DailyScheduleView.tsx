
import React, { useMemo } from 'react';
import { Room, Booking, User } from '../types';
import { Clock, Users, Calendar as CalendarIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DailyScheduleViewProps {
  rooms: Room[];
  bookings: Booking[];
  selectedDate: string;
  onBook: (room: Room, startTime?: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

// Using 24 variable names instead of tailwind classes
const BOOKING_VARS = [
  '--booking-1', '--booking-2', '--booking-3', '--booking-4',
  '--booking-5', '--booking-6', '--booking-7', '--booking-8',
  '--booking-9', '--booking-10', '--booking-11', '--booking-12',
  '--booking-13', '--booking-14', '--booking-15', '--booking-16',
  '--booking-17', '--booking-18', '--booking-19', '--booking-20',
  '--booking-21', '--booking-22', '--booking-23', '--booking-24',
];

const DailyScheduleView: React.FC<DailyScheduleViewProps> = ({ rooms, bookings, selectedDate, onBook }) => {
  const dayBookings = useMemo(() => {
    return bookings.filter(b => 
      new Date(b.startTime).toLocaleDateString('en-CA') === selectedDate &&
      (b.status === 'APPROVED' || b.status === 'PENDING')
    );
  }, [bookings, selectedDate]);

  const getBookingColorVar = (bookingId: string) => {
    let hash = 0;
    for (let i = 0; i < bookingId.length; i++) {
        // Multiplier prime 31 helps disperse short similar strings like "dsada" vs "88888"
        hash = (hash * 31) + bookingId.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return BOOKING_VARS[Math.abs(hash) % BOOKING_VARS.length];
  };

  const getBookingForSlot = (roomId: string, hour: number) => {
    return dayBookings.find(b => {
      if (b.roomId !== roomId) return false;
      const start = new Date(b.startTime).getHours();
      const end = new Date(b.endTime).getHours();
      const endMinutes = new Date(b.endTime).getMinutes();
      return hour >= start && (hour < end || (hour === end && endMinutes > 0));
    });
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-surface rounded-3xl border border-subtle shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-subtle bg-tertiary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-primary tracking-tight">לוח זמנים יומי</h2>
            <p className="text-secondary text-sm font-medium">{formattedDate}</p>
          </div>
        </div>
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: 'var(--booking-1)' }}></div> מאושר</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500/40 border border-amber-500/30 rounded-sm"></div> ממתין לאישור</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-tertiary border border-subtle rounded-sm"></div> פנוי</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className="flex border-b border-subtle bg-tertiary/10">
            <div className="w-48 shrink-0 p-4 font-black text-secondary text-xs uppercase tracking-widest border-l border-subtle bg-surface">חדר / שעה</div>
            {HOURS.map(hour => (
              <div key={hour} className="flex-1 p-4 text-center text-xs font-black text-secondary border-l border-subtle/50">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {rooms.map(room => (
            <div key={room.id} className="flex border-b border-subtle group hover:bg-tertiary/5 transition-colors">
              <div className="w-48 shrink-0 p-4 border-l border-subtle bg-surface flex flex-col justify-center">
                <span className="font-bold text-primary text-sm truncate">{room.name}</span>
                <span className="text-[10px] text-secondary flex items-center gap-1 mt-1">
                  <Users size={10} /> {room.capacity} מקומות
                </span>
              </div>
              
              {HOURS.map(hour => {
                const booking = getBookingForSlot(room.id, hour);
                const isStart = booking && new Date(booking.startTime).getHours() === hour;
                
                if (booking) {
                  const colorVar = getBookingColorVar(booking.id);
                  return (
                    <div 
                      key={hour} 
                      className={`flex-1 p-1 relative ${booking.status === 'APPROVED' ? '' : 'bg-amber-500/5'}`}
                    >
                      <div 
                        className={`h-full w-full rounded-lg flex flex-col items-center justify-center p-1 transition-all shadow-sm border ${
                          booking.status === 'APPROVED' 
                            ? 'text-white border-black/5' 
                            : 'bg-amber-500/30 text-amber-900 border-amber-500/30 border-dashed'
                        }`}
                        style={booking.status === 'APPROVED' ? { backgroundColor: `var(${colorVar})` } : {}}
                      >
                        {isStart && (
                          <span className="text-[9px] font-black truncate w-full text-center">
                            {booking.title}
                          </span>
                        )}
                        {isStart && booking.status === 'PENDING' && (
                          <AlertCircle size={10} className="mt-1 opacity-70" />
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <button 
                    key={hour}
                    onClick={() => onBook(room, `${hour.toString().padStart(2, '0')}:00`)}
                    className="flex-1 hover:bg-brand/5 transition-colors border-l border-subtle/30 group/slot relative"
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                      <div className="bg-brand/10 text-brand p-1.5 rounded-full">
                        <Clock size={14} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 bg-tertiary/20 border-t border-subtle">
        <div className="flex items-start gap-3 text-secondary">
          <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">
            לחיצה על משבצת פנויה תפתח את טופס בקשת ההזמנה עבור השעה והחדר הנבחרים. 
            כל הבקשות מועברות לאישור מנהל המערכת לפני הפיכתן לסופיות.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyScheduleView;
