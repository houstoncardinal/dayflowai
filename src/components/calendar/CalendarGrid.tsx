import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { format, isSameDay } from 'date-fns';
import { DayInfo, CalendarEvent } from '@/types/calendar';
import { DroppableDay } from './DroppableDay';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarGridProps {
  days: DayInfo[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMoveEvent: (eventId: string, newDate: string) => void;
}

export function CalendarGrid({ days, selectedDate, onSelectDate, onMoveEvent }: CalendarGridProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const handleDragStart = (event: any) => {
    setActiveEvent(event.active.data.current?.event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveEvent(null);
    
    const { active, over } = event;
    if (!over) return;

    const eventId = active.id as string;
    const newDate = over.id as string;
    
    onMoveEvent(eventId, newDate);
  };

  return (
    <DndContext 
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
          {days.map((day) => (
            <DroppableDay
              key={day.date.toISOString()}
              day={day}
              isSelected={selectedDate ? isSameDay(day.date, selectedDate) : false}
              onClick={() => onSelectDate(day.date)}
            />
          ))}
        </motion.div>
      </div>
      
      <DragOverlay>
        {activeEvent && (
          <div className={cn(
            'rounded-md px-2 py-0.5 text-xs font-medium text-white shadow-lg',
            `bg-event-${activeEvent.color}`
          )}>
            {activeEvent.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
