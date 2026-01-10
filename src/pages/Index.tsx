import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { Sidebar } from '@/components/calendar/Sidebar';
import { AddEventModal } from '@/components/calendar/AddEventModal';
import { OnboardingTour } from '@/components/OnboardingTour';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AIAssistant } from '@/components/AIAssistant';
import { useCalendar } from '@/hooks/useCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fireEventConfetti } from '@/lib/confetti';
import { CalendarEvent } from '@/types/calendar';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('dayflow-app-onboarding-complete');
  });
  const [isFirstEvent, setIsFirstEvent] = useState(() => {
    return !localStorage.getItem('dayflow-app-first-event');
  });
  
  const { events, loading: eventsLoading, addEvent, deleteEvent, moveEvent } = useEvents();
  
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
  } = useCalendar(events);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('dayflow-app-onboarding-complete', 'true');
  };

  const handleAddEvent = async (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await addEvent(event);
    
    // Fire confetti on first event creation
    if (isFirstEvent) {
      fireEventConfetti();
      setIsFirstEvent(false);
      localStorage.setItem('dayflow-app-first-event', 'true');
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const handleMoveEvent = (eventId: string, newDate: string, newTime?: string) => {
    moveEvent(eventId, newDate, newTime);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onComplete={handleOnboardingComplete} />
      )}

      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-40">
        <ThemeToggle />
      </div>

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

      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        onAdd={handleAddEvent}
        selectedDate={selectedDate}
      />

      {/* AI Assistant */}
      <AIAssistant events={events} />
    </div>
  );
};

export default Index;
