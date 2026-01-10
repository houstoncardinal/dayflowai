import { useDroppable } from '@dnd-kit/core';
import { format, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DayInfo, EventColor } from '@/types/calendar';
import { DraggableEvent } from './DraggableEvent';

interface DroppableDayProps {
  day: DayInfo;
  isSelected: boolean;
  onClick: () => void;
}

export function DroppableDay({ day, isSelected, onClick }: DroppableDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: format(day.date, 'yyyy-MM-dd'),
    data: { date: day.date },
  });

  const dayNumber = format(day.date, 'd');
  const maxVisibleEvents = 3;
  const visibleEvents = day.events.slice(0, maxVisibleEvents);
  const remainingCount = day.events.length - maxVisibleEvents;

  return (
    <motion.div
      ref={setNodeRef}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={cn(
        'relative h-28 p-2 text-left transition-all duration-200 rounded-xl border border-transparent cursor-pointer',
        'hover:border-border hover:bg-secondary/50',
        day.isCurrentMonth ? 'bg-card' : 'bg-muted/30',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isOver && 'bg-primary/10 border-primary'
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
        {visibleEvents.map((event) => (
          <DraggableEvent key={event.id} event={event} />
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground px-2">
            +{remainingCount} more
          </span>
        )}
      </div>
    </motion.div>
  );
}
