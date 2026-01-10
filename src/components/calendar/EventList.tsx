import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEvent, EventColor } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface EventListProps {
  selectedDate: Date | null;
  events: CalendarEvent[];
  onDeleteEvent: (id: string) => void;
}

const colorBorderClasses: Record<EventColor, string> = {
  coral: 'border-l-event-coral',
  teal: 'border-l-event-teal',
  amber: 'border-l-event-amber',
  violet: 'border-l-event-violet',
  emerald: 'border-l-event-emerald',
  rose: 'border-l-event-rose',
};

const colorBgClasses: Record<EventColor, string> = {
  coral: 'bg-event-coral/10',
  teal: 'bg-event-teal/10',
  amber: 'bg-event-amber/10',
  violet: 'bg-event-violet/10',
  emerald: 'bg-event-emerald/10',
  rose: 'bg-event-rose/10',
};

export function EventList({ selectedDate, events, onDeleteEvent }: EventListProps) {
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.start_time) return 1;
    if (!b.start_time) return -1;
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <div className="flex-1 p-4 overflow-auto">
      <h3 className="text-sm font-semibold mb-1">
        {selectedDate ? format(selectedDate, 'EEEE') : 'Select a day'}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
      </p>

      <AnimatePresence mode="popLayout">
        {sortedEvents.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground text-center py-8"
          >
            No events scheduled
          </motion.p>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'group relative p-3 rounded-lg border-l-4 transition-colors',
                  colorBorderClasses[event.color],
                  colorBgClasses[event.color]
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{event.title}</h4>
                    {event.start_time && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {event.start_time}
                        {event.end_time && ` - ${event.end_time}`}
                      </p>
                    )}
                    {event.all_day && (
                      <p className="text-xs text-muted-foreground mt-1">All day</p>
                    )}
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
