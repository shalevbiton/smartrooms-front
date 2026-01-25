
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowRight, DoorOpen } from 'lucide-react';
import { Room, Booking } from '../types';

interface DateSelectionCalendarProps {
  onSelectDate: (date: string) => void;
  rooms: Room[];
  bookings: Booking[];
  isAdmin?: boolean;
}

const DateSelectionCalendar: React.FC<DateSelectionCalendarProps> = ({ onSelectDate, rooms, bookings, isAdmin = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    // Don't allow going back past current month if we are in current month
    if (newDate.getMonth() < today.getMonth() && newDate.getFullYear() === today.getFullYear()) {
      return;
    }
    setCurrentDate(new Date(newDate));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (clickedDate < today) return;

    setSelectedDate(clickedDate);

    // Format YYYY-MM-DD for consistency with inputs
    const formattedDate = clickedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
    onSelectDate(formattedDate);
  };

  const getAvailabilityCount = (targetDate: Date) => {
    const targetDateStr = targetDate.toLocaleDateString('en-CA');
    const totalRooms = rooms.filter(r => r.isAvailable !== false);

    let availableCount = 0;

    totalRooms.forEach(room => {
      // Check if this room has an APPROVED booking on this specific date
      const isBooked = bookings.some(b =>
        b.roomId === room.id &&
        b.status === 'APPROVED' &&
        new Date(b.startTime).toLocaleDateString('en-CA') === targetDateStr
      );

      if (!isBooked) {
        availableCount++;
      }
    });

    return availableCount;
  };

  const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוגוסט", "נובמבר", "דצמבר"
  ];

  const renderDays = () => {
    const days = [];
    const now = new Date();
    const currentHour = now.getHours();

    // Determine the max allowed date for non-admins
    // Default: Users can only book for Today
    // If hour >= 8: Users can also book for Tomorrow
    const maxAllowedDate = new Date(today);
    if (currentHour >= 8) {
      maxAllowedDate.setDate(maxAllowedDate.getDate() + 1);
    }

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 md:h-24"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = dateToCheck.toDateString() === today.toDateString();
      const isPast = dateToCheck < today;

      // Check if the date is locked (beyond allowed window for non-admins)
      const isLocked = !isAdmin && dateToCheck > maxAllowedDate;
      const isDisabled = isPast || isLocked;

      const isSelected = selectedDate?.toDateString() === dateToCheck.toDateString();

      const diffTime = dateToCheck.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isNext7Days = diffDays >= 0 && diffDays < 7;

      let availableCount = null;
      if (isNext7Days && !isDisabled) {
        availableCount = getAvailabilityCount(dateToCheck);
      }

      days.push(
        <button
          key={day}
          disabled={isDisabled}
          onClick={() => handleDateClick(day)}
          className={`h-14 md:h-24 border border-subtle flex flex-col items-start justify-between p-1 md:p-2 transition-all relative
            ${isDisabled ? 'bg-main text-secondary opacity-50 cursor-not-allowed' : 'hover:bg-brand/10 cursor-pointer bg-surface'}
            ${isSelected ? 'ring-2 ring-brand z-10 bg-brand/5' : ''}
            ${isToday && !isSelected ? 'bg-brand/10 border-brand/30' : ''}
            rounded-lg group
          `}
        >
          <span className={`text-xs md:text-sm font-semibold rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center
            ${isToday ? 'bg-brand text-white' : 'text-primary'}
            ${(isDisabled) ? 'text-secondary' : ''}
          `}>
            {day}
          </span>

          {isToday && <span className="text-[9px] md:text-[10px] font-bold text-brand mt-auto hidden md:block">היום</span>}

          {!isDisabled && isNext7Days && availableCount !== null && (
            <div className="mt-auto w-full">
              <div className={`text-[9px] md:text-[10px] px-1 py-0.5 rounded flex items-center gap-1 font-bold w-fit
                    ${availableCount > 0 ? 'bg-status-ok/15 text-status-ok' : 'bg-red-500/10 text-red-500'}
                  `}>
                <DoorOpen size={10} />
                <span className="hidden md:inline">{availableCount} פנויים</span>
                <span className="md:hidden">{availableCount}</span>
              </div>
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  const isPrevDisabled = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">מתי אתה צריך חדר?</h2>
        <p className="text-secondary text-sm md:text-base">בחר תאריך לצפייה בחללים פנויים.</p>
      </div>

      <div className="bg-surface rounded-2xl shadow-xl overflow-hidden border border-subtle">
        <div className="p-4 md:p-6 border-b border-subtle flex items-center justify-between bg-surface">
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-main transition-colors text-secondary"
          >
            <ChevronRight size={24} />
          </button>

          <h3 className="text-lg md:text-xl font-bold text-primary flex items-center gap-2">
            <CalendarIcon size={20} className="text-brand" />
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <button
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className={`p-2 rounded-full hover:bg-main transition-colors ${isPrevDisabled ? 'text-secondary/30 cursor-not-allowed' : 'text-secondary'}`}
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="grid grid-cols-7 bg-main/50 border-b border-subtle">
          {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] md:text-xs font-semibold text-secondary uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-2 bg-main/30">
          {renderDays()}
        </div>
      </div>
    </div>
  );
};

export default DateSelectionCalendar;
