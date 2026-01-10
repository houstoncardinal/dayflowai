import { motion } from 'framer-motion';
import { DayInfo } from '@/types/calendar';
import { CalendarDay } from './CalendarDay';
import { isSameDay } from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarGridProps {
  days: DayInfo[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function CalendarGrid({ days, selectedDate, onSelectDate }: CalendarGridProps) {
  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-7 gap-1"
      >
        {days.map((day, index) => (
          <CalendarDay
            key={day.date.toISOString()}
            day={day}
            isSelected={selectedDate ? isSameDay(day.date, selectedDate) : false}
            onClick={() => onSelectDate(day.date)}
          />
        ))}
      </motion.div>
    </div>
  );
}
