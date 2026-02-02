import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CalendarEvent, EventColor } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface DraggableEventProps {
  event: CalendarEvent;
  showTime?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const colorClasses: Record<EventColor, string> = {
  coral: 'bg-event-coral',
  teal: 'bg-event-teal',
  amber: 'bg-event-amber',
  violet: 'bg-event-violet',
  emerald: 'bg-event-emerald',
  rose: 'bg-event-rose',
};

export const DraggableEvent = memo(function DraggableEvent({ 
  event, 
  showTime = false, 
  compact = false, 
  onClick 
}: DraggableEventProps) {
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
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'truncate rounded-md font-medium text-white cursor-grab active:cursor-grabbing transition-shadow',
        compact ? 'px-1 py-0 text-[10px]' : 'px-2 py-0.5 text-xs',
        colorClasses[event.color],
        isDragging && 'shadow-lg opacity-90 ring-2 ring-primary ring-offset-1'
      )}
    >
      {showTime && event.start_time && !compact && (
        <span className="opacity-75 mr-1">{event.start_time}</span>
      )}
      {event.title}
    </motion.div>
  );
});
