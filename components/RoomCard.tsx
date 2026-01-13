
import React from 'react';
import { Monitor, Wifi, Coffee, CalendarPlus, Pencil, Trash2, Ban, Users, User as UserIcon, LogOut, Clock, Video } from 'lucide-react';
import { Room, Booking, User } from '../types';

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
  isAdmin?: boolean;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
  bookings?: Booking[];
  selectedDate?: string | null;
  onAction?: (id: string, type: 'CANCEL' | 'CHECKOUT' | 'DELETE') => void;
  currentUser?: User | null;
}

const RoomOp = ({ name, endTime }: { name: string, endTime: string }) => {
  const time = new Date(endTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <div className="mb-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></div>
        <span className="text-xs font-bold text-amber-600 truncate max-w-[120px]">שמור עבור {name}</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">
        <Clock size={10} />
        עד {time}
      </div>
    </div>
  );
};

const RoomCard: React.FC<RoomCardProps> = ({ room, onBook, isAdmin, onEdit, onDelete, bookings = [], selectedDate, onAction, currentUser }) => {
  const isAvailable = room.isAvailable !== false;
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const isViewingToday = !selectedDate || selectedDate === todayStr;

  const currentBooking = bookings.find(b =>
    b.roomId === room.id &&
    b.status === 'APPROVED' &&
    new Date(b.startTime) <= now &&
    new Date(b.endTime) > now
  );

  // Find if there is ANY booking for the selected date to show status, 
  // preferring current one if today, otherwise the next one.
  const relevantBooking = bookings.find(b => {
    if (b.roomId !== room.id || b.status !== 'APPROVED') return false;
    const bookingDateStr = new Date(b.startTime).toLocaleDateString('en-CA');
    return bookingDateStr === (selectedDate || todayStr);
  });

  const canFinishNow = isViewingToday && currentBooking && currentUser && (
    currentUser.role === 'ADMIN' || currentUser.id === currentBooking.userId
  );

  return (
    <div className={`bg-surface rounded-xl border border-subtle shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full relative group ${!isAvailable ? 'opacity-80' : ''}`}>
      {isAdmin && (
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(room);
              }}
              className="bg-surface hover:bg-tertiary text-primary p-2 rounded-lg shadow-md border border-subtle transition-all"
              title="ערוך פרטי חדר"
              type="button"
            >
              <Pencil size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(room);
              }}
              className="bg-surface hover:bg-tertiary text-red-500 p-2 rounded-lg shadow-md border border-subtle transition-all"
              title="מחק חדר"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      <div className="h-48 overflow-hidden relative">
        <img
          src={room.imageUrl}
          alt={room.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isAvailable ? 'grayscale' : ''}`}
        />

        {/* Indicators Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {!isAvailable && (
            <div className="bg-red-500 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] shadow-lg flex items-center gap-1.5 backdrop-blur-md">
              <Ban size={14} />
              תחזוקה
            </div>
          )}
          {room.isRecorded && (
            <div className="bg-brand text-white px-3 py-1.5 rounded-xl font-bold text-[10px] shadow-lg flex items-center gap-1.5 backdrop-blur-md">
              <Video size={14} />
              מצולם
            </div>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {relevantBooking && isAvailable && <RoomOp name={relevantBooking.userName} endTime={relevantBooking.endTime} />}

        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-primary">{room.name}</h3>
          <div className="flex items-center gap-1 text-secondary text-xs bg-tertiary px-2 py-1 rounded-full border border-subtle">
            <Users size={12} />
            <span>{room.capacity}</span>
          </div>
        </div>



        <div className="flex flex-wrap gap-2 mb-4">
          {room.equipment.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 text-xs text-secondary bg-tertiary border border-subtle px-2 py-1 rounded">
              {item.includes('Wifi') ? <Wifi size={10} /> :
                item.includes('Coffee') ? <Coffee size={10} /> :
                  <Monitor size={10} />}
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto">
          {canFinishNow && onAction && currentBooking ? (
            <button
              onClick={() => onAction(currentBooking.id, 'CHECKOUT')}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-colors text-sm shadow-md hover:shadow-lg animate-pulse ${currentUser?.role === 'ADMIN' && currentUser.id !== currentBooking.userId
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-brand hover:bg-brand-hover text-white'
                }`}
            >
              <LogOut size={16} />
              {currentUser?.role === 'ADMIN' && currentUser.id !== currentBooking.userId ? 'סיים שימוש בכוח' : 'סיים שימוש'}
            </button>
          ) : (
            <button
              onClick={() => isAvailable && onBook(room)}
              disabled={!isAvailable}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors text-sm
                ${isAvailable
                  ? 'bg-brand hover:bg-brand-hover text-white shadow-lg shadow-brand/20'
                  : 'bg-tertiary text-secondary cursor-not-allowed border border-subtle'}`}
            >
              {!isAvailable ? (
                'לא זמין'
              ) : (
                <>
                  <CalendarPlus size={16} />
                  הזמן חדר
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
