import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, pointerWithin } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { format, isSameDay } from 'date-fns';
import { DayInfo, CalendarEvent, EventColor } from '@/types/calendar';
import { DraggableEvent } from './DraggableEvent';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface WeekViewProps {
  days: DayInfo[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMoveEvent: (eventId: string, newDate: string, newTime?: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

function DroppableHourSlot({ 
  date, 
  hour, 
  events 
}: { 
  date: Date; 
  hour: number; 
  events: CalendarEvent[] 
}) {
  const slotId = `${format(date, 'yyyy-MM-dd')}-${hour.toString().padStart(2, '0')}`;
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    data: { date, hour },
  });

  const slotEvents = events.filter((e) => {
    if (!e.start_time) return hour === 0;
    const eventHour = parseInt(e.start_time.split(':')[0], 10);
    return eventHour === hour;
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-12 border-b border-r border-border relative transition-colors',
        isOver && 'bg-primary/10'
      )}
    >
      {slotEvents.map((event) => (
        <DraggableEvent key={event.id} event={event} showTime />
      ))}
    </div>
  );
}

export function WeekView({ days, selectedDate, onSelectDate, onMoveEvent, onEventClick }: WeekViewProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const eventId = active.id as string;
    const [newDate, hourStr] = (over.id as string).split('-');
    const hour = hourStr ? parseInt(hourStr, 10) : undefined;
    
    const newTime = hour !== undefined 
      ? `${hour.toString().padStart(2, '0')}:00` 
      : undefined;
    
    onMoveEvent(eventId, newDate, newTime);
  };

  return (
    <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with days */}
        <div className="flex border-b border-border">
          <div className="w-16 flex-shrink-0" />
          {days.map((day) => (
            <motion.div
              key={day.date.toISOString()}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectDate(day.date)}
              className={cn(
                'flex-1 py-3 text-center cursor-pointer transition-colors',
                day.isToday && 'bg-primary/5',
                selectedDate && isSameDay(day.date, selectedDate) && 'bg-primary/10'
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day.date, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold mt-1 mx-auto w-8 h-8 rounded-full flex items-center justify-center',
                  day.isToday && 'bg-primary text-primary-foreground'
                )}
              >
                {format(day.date, 'd')}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Hour labels */}
            <div className="w-16 flex-shrink-0">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-12 border-b border-border text-xs text-muted-foreground px-2 py-1"
                >
                  {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => (
              <div key={day.date.toISOString()} className="flex-1">
                {HOURS.map((hour) => (
                  <DroppableHourSlot
                    key={hour}
                    date={day.date}
                    hour={hour}
                    events={day.events}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
