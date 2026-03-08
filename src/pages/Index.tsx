import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { Sidebar } from '@/components/calendar/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProactiveAlertBanner } from '@/components/ProactiveAlertBanner';
import { useCalendar } from '@/hooks/useCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useProactiveAlerts, ProactiveAlert } from '@/hooks/useProactiveAlerts';
import { useNotifications } from '@/hooks/useNotifications';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { fireEventConfetti } from '@/lib/confetti';
import { CalendarEvent } from '@/types/calendar';
import { CalendarDays, LogOut, Menu, Bell, BellOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

// Lazy load heavy components
const AddEventModal = lazy(() => import('@/components/calendar/AddEventModal').then(m => ({ default: m.AddEventModal })));
const EventModal = lazy(() => import('@/components/calendar/EventModal').then(m => ({ default: m.EventModal })));
const OnboardingTour = lazy(() => import('@/components/OnboardingTour').then(m => ({ default: m.OnboardingTour })));
const AIRobot = lazy(() => import('@/components/AIRobot').then(m => ({ default: m.default })));
const VoiceAgent = lazy(() => import('@/components/VoiceAgent').then(m => ({ default: m.VoiceAgent })));
const DailyBriefing = lazy(() => import('@/components/DailyBriefing').then(m => ({ default: m.DailyBriefing })));
const AnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const CalendarSync = lazy(() => import('@/components/CalendarSync').then(m => ({ default: m.CalendarSync })));
const QuickActions = lazy(() => import('@/components/QuickActions').then(m => ({ default: m.QuickActions })));
const SmartSuggestions = lazy(() => import('@/components/SmartSuggestions').then(m => ({ default: m.default })));

import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';

// Minimal loading fallback
const LoadingFallback = () => null;

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
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
    const onboardingComplete = localStorage.getItem('dayflow-app-onboarding-complete') === 'true';
    return lastBriefing !== today && onboardingComplete;
  });
  
  // Current proactive alert
  const [currentAlert, setCurrentAlert] = useState<ProactiveAlert | null>(null);
  
  // Analytics and Sync modals
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  
  // Voice and AI states
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  const { 
    events, 
    allEvents,
    loading: eventsLoading, 
    addEvent, 
    updateEvent,
    deleteEvent, 
    moveEvent,
    undoDelete,
    lastDeletedEvent,
    searchQuery,
    setSearchQuery,
    colorFilter,
    setColorFilter,
  } = useEvents();

  const { trackEventCreated, trackVoiceCommand } = useAnalyticsTracking();

  // Smart Suggestions
  const {
    suggestions,
    isOpen: isSuggestionsOpen,
    setIsOpen: setIsSuggestionsOpen,
    urgentCount,
    pendingCount,
    executeSuggestion,
    runAll: runAllSuggestions,
    dismissSuggestion,
  } = useSmartSuggestions(allEvents);
  // Notifications
  const { permission: notificationPermission, requestPermission } = useNotifications({
    events: allEvents,
    enabled: !authLoading && !!user,
    minutesBefore: 15,
  });
  
  // Proactive alerts hook
  const handleProactiveAlert = useCallback((alert: ProactiveAlert) => {
    setCurrentAlert(alert);
  }, []);
  
  const { alerts, dismissAlert, dismissAllAlerts } = useProactiveAlerts(allEvents, {
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
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && lastDeletedEvent) {
        e.preventDefault();
        undoDelete();
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Focus search - handled by SearchFilter component
      } else if (e.key === 'Escape') {
        setIsEventModalOpen(false);
        setIsAddEventOpen(false);
      } else if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        goToPrev();
      } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        goToNext();
      } else if (e.key === '1' && !e.ctrlKey && !e.metaKey) {
        setView('month');
      } else if (e.key === '2' && !e.ctrlKey && !e.metaKey) {
        setView('week');
      } else if (e.key === '3' && !e.ctrlKey && !e.metaKey) {
        setView('day');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToToday, goToPrev, goToNext, setView, lastDeletedEvent, undoDelete]);

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
    trackEventCreated(event.title, 'manual');
    
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
    trackEventCreated(event.title, 'voice');
    trackVoiceCommand(`Create event: ${event.title}`);
  };

  // Handler for clicking on an event
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
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
      trackEventCreated(event.title, 'import');
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
        {/* Daily Briefing Modal - Lazy */}
        <Suspense fallback={<LoadingFallback />}>
          {showDailyBriefing && events.length >= 0 && !showOnboarding && (
            <DailyBriefing events={allEvents} onDismiss={handleDismissBriefing} />
          )}
        </Suspense>

        {/* Proactive Alert Banner */}
        <ProactiveAlertBanner 
          alert={currentAlert} 
          onDismiss={handleDismissAlert}
          autoSpeak={true}
        />

        {/* Onboarding Tour - Lazy */}
        <Suspense fallback={<LoadingFallback />}>
          {showOnboarding && (
            <OnboardingTour onComplete={handleOnboardingComplete} />
          )}
        </Suspense>

        {/* Premium Header Bar */}
        <div className="fixed top-0 left-0 right-0 z-40 h-14 glass-premium border-b border-border/50">
          <div className="flex items-center justify-between h-full px-3 md:px-4">
            {/* Left: Menu button (mobile) + Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile sidebar toggle */}
              {isMobile && (
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-80">
                    <Sidebar
                      selectedDate={selectedDate}
                      onSelectDate={(date) => {
                        setSelectedDate(date);
                        setIsSidebarOpen(false);
                      }}
                      events={selectedDateEvents}
                      onDeleteEvent={deleteEvent}
                      onEventClick={handleEventClick}
                      className="w-full border-r-0"
                      showHeader={true}
                    />
                  </SheetContent>
                </Sheet>
              )}
              
              <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-base md:text-lg font-bold hidden sm:block">Dayflow</span>
            </div>

            {/* Center - Current date */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:block">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d')}
              </span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Notification toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={requestPermission}
                    className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-9 md:w-9"
                  >
                    {notificationPermission === 'granted' ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {notificationPermission === 'granted' 
                    ? 'Notifications enabled' 
                    : 'Enable notifications'}
                </TooltipContent>
              </Tooltip>
              {/* Smart Suggestions trigger */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSuggestionsOpen(true)}
                    className="relative text-muted-foreground hover:text-foreground h-8 w-8 md:h-9 md:w-9"
                  >
                    <Sparkles className="h-4 w-4" />
                    {pendingCount > 0 && (
                      <span className={cn(
                        "absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1",
                        urgentCount > 0
                          ? "bg-event-coral animate-pulse"
                          : "bg-event-amber"
                      )}>
                        {pendingCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {pendingCount > 0
                    ? `${pendingCount} smart suggestions available`
                    : 'Smart Suggestions'}
                </TooltipContent>
              </Tooltip>
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => signOut()}
                    className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-9 md:w-9"
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
          {/* Desktop Sidebar - hidden on mobile */}
          {!isMobile && (
            <Sidebar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              events={selectedDateEvents}
              onDeleteEvent={deleteEvent}
              onEventClick={handleEventClick}
            />
          )}
          
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
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              colorFilter={colorFilter}
              onColorFilterChange={setColorFilter}
            />
            
            {view === 'month' && (
              <CalendarGrid
                days={calendarDays}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onMoveEvent={handleMoveEvent}
                onEventClick={handleEventClick}
              />
            )}
            
            {view === 'week' && (
              <WeekView
                days={weekDays}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onMoveEvent={handleMoveEvent}
                onEventClick={handleEventClick}
              />
            )}
            
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                hours={dayHours}
                onMoveEvent={handleMoveEvent}
                onEventClick={handleEventClick}
              />
            )}
          </motion.main>
        </div>

        {/* Quick Actions FAB - Lazy */}
        <Suspense fallback={<LoadingFallback />}>
          <QuickActions
            onAddEvent={() => setIsAddEventOpen(true)}
            onOpenVoice={() => setIsVoiceActive(true)}
            onOpenAnalytics={() => setShowAnalytics(true)}
            onOpenCalendarSync={() => setShowCalendarSync(true)}
            onOpenAI={() => {}}
            isVoiceActive={isVoiceActive}
          />
        </Suspense>

        {/* Modals - Lazy loaded */}
        <Suspense fallback={<LoadingFallback />}>
          <AddEventModal
            isOpen={isAddEventOpen}
            onClose={() => setIsAddEventOpen(false)}
            onAdd={handleAddEvent}
            selectedDate={selectedDate}
          />
        </Suspense>

        <Suspense fallback={<LoadingFallback />}>
          <EventModal
            event={selectedEvent}
            isOpen={isEventModalOpen}
            onClose={() => {
              setIsEventModalOpen(false);
              setSelectedEvent(null);
            }}
            onUpdate={updateEvent}
            onDelete={deleteEvent}
          />
        </Suspense>

        {/* AI Robot - Lazy loaded with error boundary */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AIRobot events={allEvents} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <VoiceAgent 
              events={allEvents} 
              onCreateEvent={handleVoiceCreateEvent}
              onVoiceCommand={trackVoiceCommand}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Analytics Dashboard - Lazy */}
        <Suspense fallback={<LoadingFallback />}>
          <AnalyticsDashboard 
            events={allEvents} 
            isOpen={showAnalytics} 
            onClose={() => setShowAnalytics(false)} 
          />
        </Suspense>

        {/* Calendar Sync Modal - Lazy */}
        <Suspense fallback={<LoadingFallback />}>
          <CalendarSync 
            events={allEvents} 
            isOpen={showCalendarSync} 
            onClose={() => setShowCalendarSync(false)}
            onImportEvents={handleImportEvents}
          />
        </Suspense>
      </div>
    </TooltipProvider>
  );
};

export default Index;
