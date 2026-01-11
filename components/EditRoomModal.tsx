
import React, { useState, useEffect } from 'react';
import { X, Save, Box, Image as ImageIcon, Plus, Power, Users, AlertCircle, Video } from 'lucide-react';
import { Room } from '../types';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onSave: (data: Partial<Room>) => void;
  existingRooms?: Room[];
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({ isOpen, onClose, room, onSave, existingRooms = [] }) => {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [locationType, setLocationType] = useState<'PRISON' | 'YAMAR'>('YAMAR');
  const [equipmentString, setEquipmentString] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isRecorded, setIsRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (room) {
        setName(room.name);
        setCapacity(room.capacity);
        setLocationType(room.locationType || 'YAMAR');
        setEquipmentString(room.equipment.join(', '));
        setImageUrl(room.imageUrl);
        setIsAvailable(room.isAvailable !== undefined ? room.isAvailable : true);
        setIsRecorded(room.isRecorded !== undefined ? room.isRecorded : false);
      } else {
        setName('');
        setCapacity(4);
        setLocationType('YAMAR');
        setEquipmentString('');
        setImageUrl('');
        setIsAvailable(true);
        setIsRecorded(false);
      }
    }
  }, [isOpen, room]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room && existingRooms.length > 0) {
      const isDuplicate = existingRooms.some(
        r => r.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (isDuplicate) {
        setError('חדר עם שם זה כבר קיים.');
        return;
      }
    }
    const equipment = equipmentString.split(',').map(item => item.trim()).filter(Boolean);
    onSave({
      name,
      capacity,
      locationType,
      equipment,
      imageUrl: imageUrl || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
      isAvailable,
      isRecorded
    });
  };

  const isEditMode = !!room;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-subtle">
        <div className="p-6 border-b border-subtle flex justify-between items-center bg-tertiary">
          <h2 className="text-xl font-bold text-primary">
            {isEditMode ? 'ערוך פרטי חדר' : 'הוסף חדר חדש'}
          </h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors bg-surface/10 p-1.5 rounded-full border border-subtle">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm flex items-start gap-2 border border-red-500/20">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-start gap-4 mb-4">
            <img
              src={imageUrl || 'https://via.placeholder.com/150'}
              alt="Preview"
              className="w-20 h-20 rounded-xl object-cover border border-subtle bg-tertiary"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
            />
            <div className="flex-1">
              <label className="block text-sm font-semibold text-secondary mb-2">שם החדר</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-subtle bg-tertiary text-primary focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-secondary/50"
                placeholder="לדוגמה: חדר ישיבות A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">קיבולת</label>
              <div className="relative">
                <Users className="absolute right-3 top-3 text-secondary" size={16} />
                <input
                  required
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value))}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-subtle bg-tertiary text-primary focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-subtle bg-tertiary cursor-pointer hover:bg-surface transition-colors">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isAvailable ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-subtle bg-surface'}`}>
                  {isAvailable && <X className="text-white rotate-45" size={14} />}
                </div>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm font-semibold text-secondary">זמין להזמנה</span>
              </label>

              <label className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-subtle bg-tertiary cursor-pointer hover:bg-surface transition-colors">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isRecorded ? 'bg-brand border-brand shadow-lg shadow-brand/20' : 'border-subtle bg-surface'}`}>
                  {isRecorded && <X className="text-white rotate-45" size={14} />}
                </div>
                <input
                  type="checkbox"
                  checked={isRecorded}
                  onChange={(e) => setIsRecorded(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <Video size={14} className={isRecorded ? 'text-brand' : 'text-secondary'} />
                  מצולם
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">קישור לתמונה</label>
            <div className="relative">
              <ImageIcon className="absolute right-3 top-3 text-secondary" size={16} />
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-subtle bg-tertiary text-primary focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-secondary/50"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">מתחם</label>
            <div className="flex bg-tertiary p-1 rounded-xl border border-subtle mb-3">
              <button
                type="button"
                onClick={() => setLocationType('YAMAR')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${locationType === 'YAMAR' ? 'bg-surface text-primary shadow-sm border border-subtle' : 'text-secondary hover:text-primary'}`}
              >
                ימל"ם
              </button>
              <button
                type="button"
                onClick={() => setLocationType('PRISON')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${locationType === 'PRISON' ? 'bg-surface text-primary shadow-sm border border-subtle' : 'text-secondary hover:text-primary'}`}
              >
                כלא
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">ציוד (מופרד בפסיקים)</label>
            <div className="relative">
              <Box className="absolute right-3 top-3 text-secondary" size={16} />
              <input
                type="text"
                value={equipmentString}
                onChange={(e) => setEquipmentString(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-subtle bg-tertiary text-primary focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-secondary/50"
                placeholder="מקרן, לוח מחיק, ווי-פיי..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-subtle mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-secondary hover:text-primary hover:bg-tertiary rounded-xl font-bold transition-all text-sm"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand/20 active:scale-[0.98]"
            >
              {isEditMode ? <Save size={18} /> : <Plus size={18} />}
              {isEditMode ? 'שמור שינויים' : 'צור חדר'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomModal;
