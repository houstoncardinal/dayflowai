import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { Sidebar } from '@/components/calendar/Sidebar';
import { AddEventModal } from '@/components/calendar/AddEventModal';
import { Button } from '@/components/ui/button';
import { useCalendar } from '@/hooks/useCalendar';
import { CalendarEvent, CalendarView } from '@/types/calendar';
import { format, addDays, subDays } from 'date-fns';
import { ArrowRight, Info } from 'lucide-react';

// Demo events for showcasing the app
const createDemoEvents = (): CalendarEvent[] => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
  const nextWeekStr = format(addDays(today, 3), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  return [
    {
      id: 'demo-1',
      user_id: 'demo',
      title: 'Team Standup',
      event_date: todayStr,
      start_time: '09:00',
      end_time: '09:30',
      color: 'teal',
      description: 'Daily sync with the team',
    },
    {
      id: 'demo-2',
      user_id: 'demo',
      title: 'Product Launch',
      event_date: todayStr,
      start_time: '14:00',
      end_time: '16:00',
      color: 'coral',
      description: 'Big launch day!',
    },
    {
      id: 'demo-3',
      user_id: 'demo',
      title: 'Yoga Class',
      event_date: todayStr,
      start_time: '07:00',
      end_time: '08:00',
      color: 'rose',
    },
    {
      id: 'demo-4',
      user_id: 'demo',
      title: 'Client Meeting',
      event_date: tomorrowStr,
      start_time: '10:00',
      end_time: '11:30',
      color: 'violet',
      description: 'Q1 Review with Acme Corp',
    },
    {
      id: 'demo-5',
      user_id: 'demo',
      title: 'Design Workshop',
      event_date: tomorrowStr,
      start_time: '14:00',
      end_time: '17:00',
      color: 'amber',
    },
    {
      id: 'demo-6',
      user_id: 'demo',
      title: 'Sprint Planning',
      event_date: nextWeekStr,
      start_time: '09:00',
      end_time: '11:00',
      color: 'emerald',
    },
    {
      id: 'demo-7',
      user_id: 'demo',
      title: 'Lunch with Sarah',
      event_date: yesterdayStr,
      start_time: '12:30',
      end_time: '13:30',
      color: 'teal',
    },
  ];
};

export default function Demo() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [demoEvents, setDemoEvents] = useState<CalendarEvent[]>(createDemoEvents);
  
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendarDays,
    weekDays,
    dayHours,
    currentMonthLabel,
    goToNext,
    goToPrev,
    goToToday,
    selectedDateEvents,
  } = useCalendar(demoEvents);

  const handleAddEvent = (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `demo-${Date.now()}`,
      user_id: 'demo',
    };
    setDemoEvents((prev) => [...prev, newEvent]);
  };

  const handleDeleteEvent = (id: string) => {
    setDemoEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleMoveEvent = (eventId: string, newDate: string, newTime?: string) => {
    setDemoEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, event_date: newDate, ...(newTime && { start_time: newTime }) }
          : e
      )
    );
  };

  // Override selectedDateEvents for demo
  const demoSelectedDateEvents = selectedDate
    ? demoEvents.filter((event) => event.event_date === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Demo Banner */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground py-2 px-4 flex items-center justify-center gap-4 text-sm"
      >
        <Info className="h-4 w-4" />
        <span>You're viewing the demo. Events won't be saved.</span>
        <Link to="/auth">
          <Button size="sm" variant="secondary" className="gap-1 h-7">
            Sign up to save
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </motion.div>

      <div className="flex w-full pt-10">
        <Sidebar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          events={demoSelectedDateEvents}
          onDeleteEvent={handleDeleteEvent}
        />
        
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col min-w-0"
        >
          <CalendarHeader
            monthLabel={currentMonthLabel}
            view={view}
            onViewChange={setView}
            onPrev={goToPrev}
            onNext={goToNext}
            onToday={goToToday}
            onAddEvent={() => setIsAddEventOpen(true)}
          />
          
          {view === 'month' && (
            <CalendarGrid
              days={calendarDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onMoveEvent={handleMoveEvent}
            />
          )}
          
          {view === 'week' && (
            <WeekView
              days={weekDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onMoveEvent={handleMoveEvent}
            />
          )}
          
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              hours={dayHours}
              onMoveEvent={handleMoveEvent}
            />
          )}
        </motion.main>
      </div>

      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        onAdd={handleAddEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
}
