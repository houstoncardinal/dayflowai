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
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { CalendarSync } from '@/components/CalendarSync';
import { QuickActions } from '@/components/QuickActions';
import { useCalendar } from '@/hooks/useCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useProactiveAlerts, ProactiveAlert } from '@/hooks/useProactiveAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fireEventConfetti } from '@/lib/confetti';
import { CalendarEvent } from '@/types/calendar';
import { CalendarDays, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
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
  
  // Analytics and Sync modals
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  
  // Voice and AI states
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsAddEventOpen(true);
      } else if (e.key === 'v' && !e.ctrlKey && !e.metaKey) {
        setIsVoiceActive(prev => !prev);
      } else if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        goToToday();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToToday]);

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

  // Handler for imported events from calendar sync
  const handleImportEvents = async (importedEvents: any[]) => {
    for (const event of importedEvents) {
      await addEvent({
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        color: event.color || 'teal',
        all_day: event.all_day || false,
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold animate-pulse-soft">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <span className="text-muted-foreground font-medium">Loading your calendar...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const handleMoveEvent = (eventId: string, newDate: string, newTime?: string) => {
    moveEvent(eventId, newDate, newTime);
  };

  return (
    <TooltipProvider delayDuration={300}>
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

        {/* Premium Header Bar */}
        <div className="fixed top-0 left-0 right-0 z-40 h-14 glass-premium border-b border-border/50">
          <div className="flex items-center justify-between h-full px-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold hidden sm:block">Dayflow</span>
            </div>

            {/* Center - Current date */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <span className="text-sm font-medium text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d')}
              </span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => signOut()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Main content with top padding for header */}
        <div className="flex flex-1 pt-14">
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
        </div>

        {/* Quick Actions FAB */}
        <QuickActions
          onAddEvent={() => setIsAddEventOpen(true)}
          onOpenVoice={() => setIsVoiceActive(true)}
          onOpenAnalytics={() => setShowAnalytics(true)}
          onOpenCalendarSync={() => setShowCalendarSync(true)}
          onOpenAI={() => {}} // AI Assistant has its own trigger
          isVoiceActive={isVoiceActive}
        />

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

        {/* Analytics Dashboard */}
        <AnalyticsDashboard 
          events={events} 
          isOpen={showAnalytics} 
          onClose={() => setShowAnalytics(false)} 
        />

        {/* Calendar Sync Modal */}
        <CalendarSync 
          events={events} 
          isOpen={showCalendarSync} 
          onClose={() => setShowCalendarSync(false)}
          onImportEvents={handleImportEvents}
        />
      </div>
    </TooltipProvider>
  );
};

export default Index;
