
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, Loader2, Video, VideoOff, Clock, User, CreditCard, Shield, Users, Info, AlertCircle, CheckCircle2, Phone, Briefcase, FileText } from 'lucide-react';
import { Room, Booking } from '../types';

interface BookingModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedDate?: string | null;
  allBookings?: Booking[];
  prefilledStartTime?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ room, isOpen, onClose, onSubmit, selectedDate, allBookings = [], prefilledStartTime }) => {
  const [type, setType] = useState<'TESTIMONY' | 'INVESTIGATION'>('INVESTIGATION');
  const [offenses, setOffenses] = useState('');
  const [title, setTitle] = useState('');
  const [interrogatedName, setInterrogatedName] = useState('');
  const [investigatorId, setInvestigatorId] = useState('');
  const [secondInvestigatorId, setSecondInvestigatorId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isRecorded, setIsRecorded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflict, setConflict] = useState<Booking | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setType('INVESTIGATION');
      setOffenses('');
      setTitle('');
      setInterrogatedName('');
      setInvestigatorId('');
      setSecondInvestigatorId('');
      setPhoneNumber('');
      setDate(selectedDate || today);

      if (prefilledStartTime) {
        setStartTime(prefilledStartTime);
        const [h, m] = prefilledStartTime.split(':').map(Number);
        const endH = Math.min(23, h + 1);
        setEndTime(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      } else {
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        nextHour.setMinutes(0);
        const startStr = nextHour.getHours().toString().padStart(2, '0') + ':00';
        const endStr = (nextHour.getHours() + 1).toString().padStart(2, '0') + ':00';
        setStartTime(startStr);
        setEndTime(endStr);
      }

      setIsRecorded(false);
      setConflict(null);
    }
  }, [isOpen, selectedDate, prefilledStartTime]);

  const requestedStartNum = useMemo(() => new Date(`${date}T${startTime}:00`).getTime(), [date, startTime]);
  const requestedEndNum = useMemo(() => new Date(`${date}T${endTime}:00`).getTime(), [date, endTime]);

  const isToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return date === todayStr;
  }, [date]);

  const isPastTime = useMemo(() => {
    if (!isToday) return false;
    const nowNum = new Date().getTime();
    return requestedStartNum < nowNum - (5 * 60 * 1000);
  }, [isToday, requestedStartNum]);

  useEffect(() => {
    if (!room || !date || !startTime || !endTime) return;

    if (requestedEndNum <= requestedStartNum) {
      setConflict(null);
      return;
    }

    const overlappingBooking = allBookings.find(b => {
      if (b.roomId !== room.id || (b.status !== 'APPROVED' && b.status !== 'PENDING')) return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return requestedStartNum < bEnd && requestedEndNum > bStart;
    });

    setConflict(overlappingBooking || null);
  }, [date, startTime, endTime, room, allBookings, requestedStartNum, requestedEndNum]);

  const pastPercentage = useMemo(() => {
    if (!isToday) return 0;
    const now = new Date();
    return ((now.getHours() + now.getMinutes() / 60) / 24) * 100;
  }, [isToday]);

  if (!isOpen || !room) return null;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = 1 - (x / rect.width);
    const totalMinutes = 24 * 60;
    const clickedMinute = Math.round(percentage * totalMinutes / 15) * 15;

    const h = Math.floor(clickedMinute / 60);
    const m = clickedMinute % 60;
    const newStartTimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    if (isToday) {
      const clickedTimeNum = new Date(`${date}T${newStartTimeStr}:00`).getTime();
      if (clickedTimeNum < new Date().getTime()) return;
    }

    setStartTime(newStartTimeStr);
    const endH = Math.min(23, h + 1);
    const newEndTimeStr = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    setEndTime(newEndTimeStr);
  };

  const setQuickDuration = (hours: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + (hours * 60);
    const endH = Math.min(23, Math.floor(totalMins / 60));
    const endM = totalMins % 60;
    setEndTime(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflict || isInvalidTime || isPastTime) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        roomId: room.id,
        type,
        offenses,
        title,
        interrogatedName,
        investigatorId,
        secondInvestigatorId,
        phoneNumber,
        description: '',
        date,
        startTime,
        endTime,
        isRecorded
      });
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  const daySchedule = allBookings
    .filter(b => b.roomId === room.id && (b.status === 'APPROVED' || b.status === 'PENDING') && new Date(b.startTime).toLocaleDateString('en-CA') === date)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const isInvalidTime = requestedEndNum <= requestedStartNum;
  const timelineMarkers = [0, 6, 12, 18, 23];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-surface rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-subtle">

        {/* Professional Header */}
        <div className="px-8 py-6 border-b border-subtle bg-tertiary/20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-brand rounded-full"></div>
            <div>
              <h2 className="text-xl font-semibold text-primary tracking-tight">הזמנת חדר חקירות</h2>
              <div className="flex items-center gap-2 text-xs font-medium text-secondary mt-1">
                <span>{room.name}</span>
                <span className="opacity-30">•</span>
                <span>{new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-secondary hover:text-primary transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10 overflow-y-auto custom-scrollbar">

          {/* Timeline Section - Serious & Technical */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} className="text-brand" />
                זמינות חדר (24 שעות)
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-subtle"></div> תפוס
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary">
                  <div className="w-2.5 h-2.5 rounded-sm bg-brand/10 border border-brand/40"></div> הבחירה שלך
                </div>
              </div>
            </div>

            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              className="relative h-14 bg-tertiary rounded-lg border border-subtle overflow-hidden flex items-center cursor-pointer"
            >
              {/* Technical Grid Line Markers */}
              <div className="absolute inset-0 flex justify-between px-1 opacity-20 pointer-events-none">
                {Array.from({ length: 24 }).map((_, i) => <div key={i} className="h-full w-px bg-slate-400" />)}
              </div>

              {/* Past Time Shading */}
              {isToday && (
                <div
                  className="absolute inset-y-0 right-0 bg-slate-500/10 z-0"
                  style={{ width: `${pastPercentage}%` }}
                />
              )}

              {/* Occupied Slots */}
              {daySchedule.map((b, i) => {
                const bStart = new Date(b.startTime);
                const bEnd = new Date(b.endTime);
                const startPct = ((bStart.getHours() + bStart.getMinutes() / 60) / 24) * 100;
                const endPct = ((bEnd.getHours() + bEnd.getMinutes() / 60) / 24) * 100;
                const width = Math.max(0.5, endPct - startPct);

                return (
                  <div
                    key={i}
                    className="absolute h-full bg-slate-200 border-x border-slate-300"
                    style={{ right: `${startPct}%`, width: `${width}%` }}
                  />
                );
              })}

              {/* Current Selection */}
              {!isInvalidTime && (
                <div
                  className={`absolute h-full border-x-2 transition-all z-10 flex items-center justify-center ${conflict || isPastTime ? 'bg-red-500/10 border-red-500' : 'bg-brand/10 border-brand'}`}
                  style={{
                    right: `${((new Date(`${date}T${startTime}:00`).getHours() + new Date(`${date}T${startTime}:00`).getMinutes() / 60) / 24) * 100}%`,
                    width: `${((requestedEndNum - requestedStartNum) / (24 * 3600000)) * 100}%`
                  }}
                >
                  {(conflict || isPastTime) && <AlertCircle size={14} className="text-red-500" />}
                </div>
              )}
            </div>

            <div className="w-full flex justify-between px-1 text-[10px] font-bold text-secondary opacity-60">
              {timelineMarkers.map(m => <span key={m}>{m.toString().padStart(2, '0')}:00</span>)}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mr-1">משך משוער:</span>
              {[1, 2, 4, 8].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setQuickDuration(h)}
                  className="px-3 py-1 rounded-md bg-tertiary border border-subtle text-[10px] font-bold text-primary hover:border-brand transition-colors"
                >
                  {h} שעות
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            {/* Field Section: Case Definition */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-secondary border-b border-subtle pb-2 uppercase tracking-wider">
                <FileText size={14} />
                סוג התיק וסיבת הפנייה
              </div>

              {/* Type Selection */}
              <div className="flex bg-tertiary p-1 rounded-lg border border-subtle mb-4">
                <button
                  type="button"
                  onClick={() => setType('INVESTIGATION')}
                  className={`flex-1 py-2 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${type === 'INVESTIGATION' ? 'bg-surface text-primary shadow-sm border border-subtle' : 'text-secondary hover:text-primary'}`}
                >
                  חקירה
                </button>
                <button
                  type="button"
                  onClick={() => setType('TESTIMONY')}
                  className={`flex-1 py-2 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${type === 'TESTIMONY' ? 'bg-surface text-primary shadow-sm border border-subtle' : 'text-secondary hover:text-primary'}`}
                >
                  עדות
                </button>
              </div>

              <div className="relative">
                <input
                  required
                  type="text"
                  value={offenses}
                  onChange={(e) => setOffenses(e.target.value)}
                  placeholder="הזן את סוג העבירה הנחקרת..."
                  className="w-full px-4 py-3 rounded-lg border border-subtle bg-surface text-primary focus:border-brand outline-none transition-all placeholder:text-secondary/40 font-medium"
                />
              </div>
            </div>

            {/* Personnel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Investigator Card */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-secondary border-b border-subtle pb-2 uppercase tracking-wider">
                  <User size={14} />
                  חוקר מבצע
                </div>
                <div className="space-y-3">
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="שם חוקר מלא"
                    className="w-full px-4 py-2.5 rounded-lg border border-subtle bg-surface text-primary focus:border-brand outline-none transition-all text-sm font-medium"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      type="text"
                      value={investigatorId}
                      onChange={(e) => setInvestigatorId(e.target.value.replace(/\D/g, ''))}
                      placeholder="מספר אישי"
                      maxLength={7}
                      className="w-full px-4 py-2.5 rounded-lg border border-subtle bg-surface text-primary focus:border-brand outline-none transition-all text-sm font-medium"
                    />
                    <input
                      required
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="טלפון ליצירת קשר"
                      maxLength={10}
                      className="w-full px-4 py-2.5 rounded-lg border border-subtle bg-surface text-primary focus:border-brand outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Card */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-secondary border-b border-subtle pb-2 uppercase tracking-wider">
                  <Users size={14} />
                  פרטי הנחקר
                </div>
                <div className="space-y-3">
                  <input
                    required
                    type="text"
                    value={interrogatedName}
                    onChange={(e) => setInterrogatedName(e.target.value)}
                    placeholder="שם נחקר מלא"
                    className="w-full px-4 py-2.5 rounded-lg border border-subtle bg-surface text-primary focus:border-brand outline-none transition-all text-sm font-medium"
                  />
                  <input
                    required
                    type="text"
                    value={secondInvestigatorId}
                    onChange={(e) => setSecondInvestigatorId(e.target.value.replace(/\D/g, ''))}
                    placeholder="מספר אישי / תעודת זהות"
                    maxLength={9}
                    className="w-full px-4 py-2.5 rounded-lg border border-subtle bg-surface text-primary focus:border-brand outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Time & Logistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end pt-6 border-t border-subtle">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">שעת התחלה</label>
                <div className={`relative w-full px-4 py-2.5 rounded-lg border bg-surface text-primary font-bold text-sm flex items-center justify-center gap-1 transition-all ${conflict || isPastTime ? 'border-red-500 bg-red-50/5' : 'border-subtle focus-within:border-brand'}`}>
                  <select
                    value={startTime.split(':')[1]}
                    onChange={(e) => setStartTime(`${startTime.split(':')[0]}:${e.target.value}`)}
                    className="bg-transparent outline-none appearance-none cursor-pointer text-center w-8 p-0 border-none focus:ring-0"
                  >
                    {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <span className="text-secondary select-none">:</span>
                  <select
                    value={startTime.split(':')[0]}
                    onChange={(e) => setStartTime(`${e.target.value}:${startTime.split(':')[1]}`)}
                    className="bg-transparent outline-none appearance-none cursor-pointer text-center w-8 p-0 border-none focus:ring-0"
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <Clock size={14} className="absolute left-3 text-secondary pointer-events-none opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">שעת סיום</label>
                <div className={`relative w-full px-4 py-2.5 rounded-lg border bg-surface text-primary font-bold text-sm flex items-center justify-center gap-1 transition-all ${conflict || isInvalidTime ? 'border-red-500 bg-red-50/5' : 'border-subtle focus-within:border-brand'}`}>
                  <select
                    value={endTime.split(':')[1]}
                    onChange={(e) => setEndTime(`${endTime.split(':')[0]}:${e.target.value}`)}
                    className="bg-transparent outline-none appearance-none cursor-pointer text-center w-8 p-0 border-none focus:ring-0"
                  >
                    {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <span className="text-secondary select-none">:</span>
                  <select
                    value={endTime.split(':')[0]}
                    onChange={(e) => setEndTime(`${e.target.value}:${endTime.split(':')[1]}`)}
                    className="bg-transparent outline-none appearance-none cursor-pointer text-center w-8 p-0 border-none focus:ring-0"
                  >
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <Clock size={14} className="absolute left-3 text-secondary pointer-events-none opacity-50" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">מערכת תיעוד (AV)</label>
              <div className="flex bg-tertiary p-1 rounded-lg border border-subtle">
                <button
                  type="button"
                  onClick={() => setIsRecorded(false)}
                  className={`flex-1 py-2 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${!isRecorded ? 'bg-surface text-primary shadow-sm border border-subtle' : 'text-secondary hover:text-primary'}`}
                >
                  <VideoOff size={14} /> ללא הקלטה
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecorded(true)}
                  className={`flex-1 py-2 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${isRecorded ? 'bg-brand text-white' : 'text-secondary hover:text-brand'}`}
                >
                  <Video size={14} /> הקלטה פעילה
                </button>
              </div>
            </div>
          </div>

          {/* Conflict Warnings */}
          {(conflict || isPastTime || isInvalidTime) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs font-medium">
                {conflict && <p>קיימת התנגשות עם הזמנה קיימת בשעות אלו.</p>}
                {isPastTime && <p>לא ניתן לבצע הזמנה לשעה שכבר עברה.</p>}
                {isInvalidTime && <p>שעת הסיום חייבת להיות אחרי שעת ההתחלה.</p>}
              </div>
            </div>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting || !!conflict || isInvalidTime || isPastTime}
              className={`w-full py-4 rounded-lg font-bold text-base flex items-center justify-center gap-3 transition-all relative ${conflict || isInvalidTime || isPastTime
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-slate-900 hover:bg-black text-white'
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>מעבד בקשה...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>אשר ושמור בקשת הזמנה</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-2 mt-6 text-[9px] text-secondary font-bold uppercase tracking-widest opacity-40">
              <Shield size={10} />
              מערכת חדר חקירות ממוחשבת - שימוש פנים ארגוני בלבד
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
