
import React, { useState } from 'react';
import {
  Edit, Trash2, Plus, Ban, CheckCircle, Users, Search,
  Settings, LayoutGrid, Monitor, Box, Info, Filter, Video
} from 'lucide-react';
import { Room } from '../types';

interface RoomManagementProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onAdd: () => void;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ rooms, onEdit, onDelete, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableCount = rooms.filter(r => r.isAvailable).length;
  const maintenanceCount = rooms.length - availableCount;

  // Dynamic calculation for the "מצולם" percentage
  const recordedCount = rooms.filter(r => r.isRecorded).length;
  const recordedPercentage = rooms.length > 0 ? Math.round((recordedCount / rooms.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">ניהול משאבים</h2>
          <p className="text-secondary mt-2 font-medium flex items-center gap-2">
            <Settings size={18} className="text-brand" />
            הוסף, ערוך ונהל את חדרי החקירות במערכת ({rooms.length})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-96 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-brand transition-colors" size={20} />
            <input
              type="text"
              placeholder="חפש חדר לפי שם או תיאור..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3.5 bg-surface border border-subtle rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all shadow-sm"
            />
          </div>

          <button
            onClick={onAdd}
            className="bg-brand hover:bg-brand-hover text-white px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand/20 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} />
            הוסף חדר חדש
          </button>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface p-4 rounded-2xl border border-subtle flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">סה"כ חדרים</span>
          <span className="text-2xl font-black text-primary">{rooms.length}</span>
        </div>
        <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">פעילים</span>
          <span className="text-2xl font-black text-emerald-600">{availableCount}</span>
        </div>
        <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">בתחזוקה</span>
          <span className="text-2xl font-black text-red-500">{maintenanceCount}</span>
        </div>
        <div className="bg-brand/5 p-4 rounded-2xl border border-brand/10 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">מצולם</span>
          <span className="text-2xl font-black text-brand">{recordedPercentage}%</span>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className={`group relative bg-surface rounded-[2rem] border transition-all duration-300 flex flex-col overflow-hidden hover:shadow-2xl hover:-translate-y-1 ${!room.isAvailable ? 'border-red-500/20' : 'border-subtle shadow-sm'
              }`}
          >
            {/* Image Section */}
            <div className="h-56 overflow-hidden relative">
              <img
                src={room.imageUrl}
                alt={room.name}
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!room.isAvailable ? 'grayscale opacity-60' : ''}`}
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Floating Status Badge */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {room.isAvailable ? (
                  <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <CheckCircle size={14} /> פעיל
                  </div>
                ) : (
                  <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <CheckCircle size={14} /> תחזוקה
                  </div>
                )}
                {room.isRecorded && (
                  <div className="bg-brand text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <Video size={14} /> מצולם
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 right-4 text-white">
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <Users size={14} />
                  <span className="text-xs font-black">{room.capacity} מקומות</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-primary group-hover:text-brand transition-colors">{room.name}</h3>
              </div>

              <p className="text-secondary text-sm font-medium mb-6 line-clamp-2 leading-relaxed">
                {room.locationType === 'PRISON' ? 'מתחם כלא' : 'מתחם ימל"ם'}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {room.equipment.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 text-[10px] font-black text-secondary bg-tertiary border border-subtle px-2.5 py-1.5 rounded-lg">
                    <Box size={10} className="text-brand" /> {item}
                  </span>
                ))}
                {room.equipment.length > 3 && (
                  <span className="text-[10px] font-black text-secondary/60 self-center">+{room.equipment.length - 3} נוספים</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-auto border-t border-subtle flex items-center justify-between">
                <button
                  onClick={() => onEdit(room)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-primary bg-tertiary hover:bg-brand hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <Edit size={16} />
                  ערוך פרטים
                </button>
                <button
                  onClick={() => onDelete(room)}
                  className="p-2.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="מחק חדר"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="text-center py-24 bg-surface rounded-[3rem] border border-dashed border-subtle">
          <div className="w-24 h-24 bg-tertiary rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-secondary border border-subtle">
            <Search size={48} />
          </div>
          <h3 className="text-2xl font-black text-primary">לא נמצאו חדרים</h3>
          <p className="text-secondary mt-2 font-medium">נסה לשנות את מילות החיפוש או להוסיף חדר חדש.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-6 px-8 py-3 bg-brand text-white font-black rounded-2xl hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 active:scale-95"
          >
            נקה חיפוש
          </button>
        </div>
      )}

      {/* Help Tip */}
      <div className="mt-12 p-6 bg-tertiary/40 rounded-3xl border border-subtle flex items-start gap-4">
        <Info className="text-brand shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-xs font-black text-primary mb-1 uppercase tracking-widest">טיפ למנהל</p>
          <p className="text-sm text-secondary font-medium leading-relaxed">
            שינוי סטטוס חדר ל"תחזוקה" ימנע ממשתמשים לבצע הזמנות חדשות לחדר זה, אך לא יבטל הזמנות קיימות באופן אוטומטי. מומלץ לבצע בדיקה מול בעלי ההזמנות הקיימות לפני השבתת חדר.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomManagement;
