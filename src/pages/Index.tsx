import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { Sidebar } from '@/components/calendar/Sidebar';
import { AddEventModal } from '@/components/calendar/AddEventModal';
import { useCalendar } from '@/hooks/useCalendar';

const Index = () => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const {
    selectedDate,
    setSelectedDate,
    calendarDays,
    currentMonthLabel,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    addEvent,
    deleteEvent,
    selectedDateEvents,
  } = useCalendar();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        events={selectedDateEvents}
        onDeleteEvent={deleteEvent}
      />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col min-w-0"
      >
        <CalendarHeader
          monthLabel={currentMonthLabel}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
          onToday={goToToday}
          onAddEvent={() => setIsAddEventOpen(true)}
        />
        
        <CalendarGrid
          days={calendarDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </motion.main>

      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        onAdd={addEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Index;
