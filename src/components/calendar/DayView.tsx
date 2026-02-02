import { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, pointerWithin } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { HourSlot, CalendarEvent } from '@/types/calendar';
import { DraggableEvent } from './DraggableEvent';
import { cn } from '@/lib/utils';

interface DayViewProps {
  currentDate: Date;
  hours: HourSlot[];
  onMoveEvent: (eventId: string, newDate: string, newTime?: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const DroppableHour = memo(function DroppableHour({ 
  date, 
  hour, 
  label,
  events 
}: { 
  date: Date;
  hour: number;
  label: string;
  events: CalendarEvent[];
}) {
  const slotId = useMemo(
    () => `${format(date, 'yyyy-MM-dd')}-${hour.toString().padStart(2, '0')}`,
    [date, hour]
  );
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    data: { date, hour },
  });

  return (
    <div className="flex border-b border-border">
      <div className="w-20 flex-shrink-0 py-2 px-3 text-sm text-muted-foreground">
        {label}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[60px] p-1 space-y-1 transition-colors',
          isOver && 'bg-primary/10'
        )}
      >
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            className="py-1"
          >
            <DraggableEvent event={event} showTime />
          </motion.div>
        ))}
      </div>
    </div>
  );
});

export const DayView = memo(function DayView({ 
  currentDate, 
  hours, 
  onMoveEvent, 
  onEventClick 
}: DayViewProps) {
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const eventId = active.id as string;
    const [newDate, hourStr] = (over.id as string).split('-');
    const hour = hourStr ? parseInt(hourStr, 10) : undefined;
    
    const newTime = hour !== undefined 
      ? `${hour.toString().padStart(2, '0')}:00` 
      : undefined;
    
    onMoveEvent(eventId, newDate, newTime);
  }, [onMoveEvent]);

  return (
    <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-auto p-4">
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {hours.map((slot) => (
            <DroppableHour
              key={slot.hour}
              date={currentDate}
              hour={slot.hour}
              label={slot.label}
              events={slot.events}
            />
          ))}
        </motion.div>
      </div>
    </DndContext>
  );
});
