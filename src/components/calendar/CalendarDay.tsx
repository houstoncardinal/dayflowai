import { motion } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { DayInfo, EventColor } from '@/types/calendar';

interface CalendarDayProps {
  day: DayInfo;
  isSelected: boolean;
  onClick: () => void;
}

const colorClasses: Record<EventColor, string> = {
  coral: 'bg-event-coral',
  teal: 'bg-event-teal',
  amber: 'bg-event-amber',
  violet: 'bg-event-violet',
  emerald: 'bg-event-emerald',
  rose: 'bg-event-rose',
};

export function CalendarDay({ day, isSelected, onClick }: CalendarDayProps) {
  const dayNumber = format(day.date, 'd');
  const maxVisibleEvents = 3;
  const visibleEvents = day.events.slice(0, maxVisibleEvents);
  const remainingCount = day.events.length - maxVisibleEvents;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative h-28 p-2 text-left transition-all duration-200 rounded-xl border border-transparent',
        'hover:border-border hover:bg-secondary/50',
        day.isCurrentMonth ? 'bg-card' : 'bg-muted/30',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <span
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
          day.isToday && 'bg-primary text-primary-foreground',
          !day.isToday && day.isCurrentMonth && 'text-foreground',
          !day.isToday && !day.isCurrentMonth && 'text-muted-foreground',
        )}
      >
        {dayNumber}
      </span>
      <div className="mt-1 space-y-1">
        {visibleEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'truncate rounded-md px-2 py-0.5 text-xs font-medium text-white',
              colorClasses[event.color]
            )}
          >
            {event.title}
          </motion.div>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground px-2">
            +{remainingCount} more
          </span>
        )}
      </div>
    </motion.button>
  );
}
