import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CalendarEvent, EventColor } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface DraggableEventProps {
  event: CalendarEvent;
  showTime?: boolean;
}

const colorClasses: Record<EventColor, string> = {
  coral: 'bg-event-coral',
  teal: 'bg-event-teal',
  amber: 'bg-event-amber',
  violet: 'bg-event-violet',
  emerald: 'bg-event-emerald',
  rose: 'bg-event-rose',
};

export function DraggableEvent({ event, showTime = false }: DraggableEventProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'truncate rounded-md px-2 py-0.5 text-xs font-medium text-white cursor-grab active:cursor-grabbing transition-shadow',
        colorClasses[event.color],
        isDragging && 'shadow-lg opacity-90 ring-2 ring-primary ring-offset-1'
      )}
    >
      {showTime && event.start_time && (
        <span className="opacity-75 mr-1">{event.start_time}</span>
      )}
      {event.title}
    </motion.div>
  );
}
