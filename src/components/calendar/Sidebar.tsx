import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { MiniCalendar } from './MiniCalendar';
import { EventList } from './EventList';
import { CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
  onDeleteEvent: (id: string) => void;
  className?: string;
  showHeader?: boolean;
}

export function Sidebar({ 
  selectedDate, 
  onSelectDate, 
  events, 
  onDeleteEvent,
  className,
  showHeader = true,
}: SidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "w-72 border-r border-border flex flex-col bg-card",
        className
      )}
    >
      {showHeader && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Dayflow</span>
          </div>
        </div>
      )}
      
      <div className="border-b border-border">
        <MiniCalendar selectedDate={selectedDate} onSelectDate={onSelectDate} />
      </div>
      
      <EventList 
        selectedDate={selectedDate} 
        events={events} 
        onDeleteEvent={onDeleteEvent}
      />
    </motion.aside>
  );
}
