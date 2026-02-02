import { memo, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, pointerWithin, DragStartEvent } from '@dnd-kit/core';
import { isSameDay } from 'date-fns';
import { DayInfo, CalendarEvent } from '@/types/calendar';
import { DroppableDay } from './DroppableDay';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarGridProps {
  days: DayInfo[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMoveEvent: (eventId: string, newDate: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const WeekdayHeader = memo(function WeekdayHeader({ isMobile }: { isMobile: boolean }) {
  const labels = isMobile ? WEEKDAYS_SHORT : WEEKDAYS;
  
  return (
    <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1 md:mb-2">
      {labels.map((day, index) => (
        <div
          key={index}
          className="py-1 md:py-2 text-center text-xs md:text-sm font-medium text-muted-foreground"
        >
          {day}
        </div>
      ))}
    </div>
  );
});

const DragOverlayContent = memo(function DragOverlayContent({ 
  event 
}: { 
  event: CalendarEvent | null 
}) {
  if (!event) return null;
  
  return (
    <div className={cn(
      'rounded-md px-2 py-0.5 text-xs font-medium text-white shadow-lg',
      `bg-event-${event.color}`
    )}>
      {event.title}
    </div>
  );
});

export const CalendarGrid = memo(function CalendarGrid({ 
  days, 
  selectedDate, 
  onSelectDate, 
  onMoveEvent, 
  onEventClick 
}: CalendarGridProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const isMobile = useIsMobile();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveEvent(event.active.data.current?.event || null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveEvent(null);
    
    const { active, over } = event;
    if (!over) return;

    const eventId = active.id as string;
    const newDate = over.id as string;
    
    onMoveEvent(eventId, newDate);
  }, [onMoveEvent]);

  return (
    <DndContext 
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-2 md:p-4 overflow-auto">
        <WeekdayHeader isMobile={isMobile} />
        <motion.div 
          initial={false}
          animate={{ opacity: 1 }}
          className="grid grid-cols-7 gap-0.5 md:gap-1"
        >
          {days.map((day) => (
            <DroppableDay
              key={day.date.toISOString()}
              day={day}
              isSelected={selectedDate ? isSameDay(day.date, selectedDate) : false}
              onClick={() => onSelectDate(day.date)}
              onEventClick={onEventClick}
            />
          ))}
        </motion.div>
      </div>
      
      <DragOverlay>
        <DragOverlayContent event={activeEvent} />
      </DragOverlay>
    </DndContext>
  );
});
