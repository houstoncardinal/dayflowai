import { useState, useEffect, useCallback } from 'react';
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
import { AgentHub } from '@/components/AgentHub';
import { VoiceAgent } from '@/components/VoiceAgent';
import { DailyBriefing } from '@/components/DailyBriefing';
import { ProactiveAlertBanner } from '@/components/ProactiveAlertBanner';
import { useCalendar } from '@/hooks/useCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useProactiveAlerts, ProactiveAlert } from '@/hooks/useProactiveAlerts';
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
  
  // Daily briefing state - show once per day
  const [showDailyBriefing, setShowDailyBriefing] = useState(() => {
    const lastBriefing = localStorage.getItem('dayflow-last-briefing');
    const today = format(new Date(), 'yyyy-MM-dd');
    return lastBriefing !== today && !localStorage.getItem('dayflow-app-onboarding-complete') === false;
  });
  
  // Current proactive alert
  const [currentAlert, setCurrentAlert] = useState<ProactiveAlert | null>(null);
  
  const { events, loading: eventsLoading, addEvent, deleteEvent, moveEvent } = useEvents();
  
  // Proactive alerts hook
  const handleProactiveAlert = useCallback((alert: ProactiveAlert) => {
    setCurrentAlert(alert);
  }, []);
  
  const { alerts, dismissAlert, dismissAllAlerts } = useProactiveAlerts(events, {
    enabled: !authLoading && !!user && !showDailyBriefing,
    onAlert: handleProactiveAlert,
  });
  
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

  // Show daily briefing after events load (only if user completed onboarding)
  useEffect(() => {
    if (!eventsLoading && user && !showOnboarding) {
      const lastBriefing = localStorage.getItem('dayflow-last-briefing');
      const today = format(new Date(), 'yyyy-MM-dd');
      if (lastBriefing !== today) {
        setShowDailyBriefing(true);
      }
    }
  }, [eventsLoading, user, showOnboarding]);

  const handleDismissBriefing = () => {
    setShowDailyBriefing(false);
    localStorage.setItem('dayflow-last-briefing', format(new Date(), 'yyyy-MM-dd'));
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId);
    setCurrentAlert(null);
  };

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

  // Handler for voice-created events
  const handleVoiceCreateEvent = async (event: any) => {
    await addEvent(event);
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
      {/* Daily Briefing Modal */}
      {showDailyBriefing && events.length >= 0 && !showOnboarding && (
        <DailyBriefing events={events} onDismiss={handleDismissBriefing} />
      )}

      {/* Proactive Alert Banner */}
      <ProactiveAlertBanner 
        alert={currentAlert} 
        onDismiss={handleDismissAlert}
        autoSpeak={true}
      />

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

      {/* AI Agent Hub */}
      <AgentHub events={events} />

      {/* Voice Agent - ElevenLabs */}
      <VoiceAgent events={events} onCreateEvent={handleVoiceCreateEvent} />
    </div>
  );
};

export default Index;
