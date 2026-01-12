import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  VolumeX, 
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarEvent } from '@/types/calendar';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface DailyBriefingProps {
  events: CalendarEvent[];
  onDismiss: () => void;
}

export function DailyBriefing({ events, onDismiss }: DailyBriefingProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [briefingText, setBriefingText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const GeetingIcon = currentHour < 17 ? Sun : Moon;

  // Get today's and upcoming events
  const todayEvents = events.filter(e => isToday(parseISO(e.event_date)));
  const tomorrowEvents = events.filter(e => isTomorrow(parseISO(e.event_date)));
  const upcomingEvents = events.filter(e => {
    const eventDate = parseISO(e.event_date);
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return eventDate > today && eventDate <= nextWeek;
  });

  // Generate briefing text
  useEffect(() => {
    const generateBriefing = () => {
      const parts: string[] = [];
      
      parts.push(`${greeting}!`);

      if (todayEvents.length === 0) {
        parts.push("Your schedule is clear for today. A perfect opportunity for deep work or planning ahead.");
      } else if (todayEvents.length === 1) {
        const event = todayEvents[0];
        parts.push(`You have one event today: "${event.title}"${event.start_time ? ` at ${event.start_time}` : ''}.`);
      } else {
        parts.push(`You have ${todayEvents.length} events scheduled for today.`);
        
        // List first 3 events
        const eventsToMention = todayEvents.slice(0, 3);
        eventsToMention.forEach((event, i) => {
          if (event.start_time) {
            parts.push(`${i === 0 ? 'First up' : 'Then'}: "${event.title}" at ${event.start_time}.`);
          }
        });
        
        if (todayEvents.length > 3) {
          parts.push(`Plus ${todayEvents.length - 3} more event${todayEvents.length - 3 > 1 ? 's' : ''}.`);
        }
      }

      // Highlight important meetings that need prep
      const importantToday = todayEvents.filter(e => 
        e.title.toLowerCase().includes('meeting') ||
        e.title.toLowerCase().includes('interview') ||
        e.title.toLowerCase().includes('presentation')
      );
      
      if (importantToday.length > 0) {
        parts.push(`I'd recommend preparing for ${importantToday.length === 1 ? `"${importantToday[0].title}"` : `your ${importantToday.length} important meetings`}. Would you like me to help with that?`);
      }

      // Tomorrow preview
      if (tomorrowEvents.length > 0) {
        parts.push(`Looking ahead to tomorrow, you have ${tomorrowEvents.length} event${tomorrowEvents.length > 1 ? 's' : ''} scheduled.`);
      }

      return parts.join(' ');
    };

    const text = generateBriefing();
    setBriefingText(text);
    setIsLoading(false);
  }, [events, greeting, todayEvents, tomorrowEvents]);

  // Auto-play briefing on mount
  useEffect(() => {
    if (!isLoading && briefingText && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      playBriefing();
    }
  }, [isLoading, briefingText]);

  const playBriefing = async () => {
    if (!briefingText) return;
    
    setIsPlaying(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: briefingText }),
      });

      if (!response.ok) {
        console.error('TTS request failed');
        setIsPlaying(false);
        return;
      }

      const data = await response.json();
      
      if (data.audioContent && audioRef.current) {
        audioRef.current.src = `data:audio/mpeg;base64,${data.audioContent}`;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Briefing playback error:', error);
      setIsPlaying(false);
    }
  };

  const stopBriefing = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const getEventColor = (color: string) => {
    const colors: Record<string, string> = {
      coral: 'bg-event-coral',
      teal: 'bg-event-teal',
      amber: 'bg-event-amber',
      violet: 'bg-event-violet',
      emerald: 'bg-event-emerald',
      rose: 'bg-event-rose',
    };
    return colors[color] || 'bg-primary';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg mx-4 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-event-amber via-event-coral to-event-rose opacity-90" />
            <div className="relative p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <GeetingIcon className="h-10 w-10" />
                </motion.div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isPlaying ? stopBriefing : playBriefing}
                    disabled={isLoading}
                    className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/20"
                  >
                    {isPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      stopBriefing();
                      onDismiss();
                    }}
                    className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold mb-1"
              >
                {greeting}! ✨
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/80"
              >
                {format(new Date(), 'EEEE, MMMM do')}
              </motion.p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Speaking Indicator */}
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 bg-event-violet/10 border border-event-violet/20 rounded-xl p-3"
              >
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 h-4 bg-event-violet rounded-full"
                    />
                  ))}
                </div>
                <span className="text-sm text-event-violet font-medium">Speaking your briefing...</span>
              </motion.div>
            )}

            {/* Today's Schedule */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Today's Schedule</h3>
                <span className="ml-auto text-sm text-muted-foreground">
                  {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <ScrollArea className="max-h-48">
                {todayEvents.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-event-emerald" />
                    <p className="text-sm text-muted-foreground">No events scheduled - enjoy your free day!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayEvents.slice(0, 5).map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl"
                      >
                        <div className={cn("w-2 h-8 rounded-full", getEventColor(event.color))} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {event.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.start_time}
                                {event.end_time && ` - ${event.end_time}`}
                              </span>
                            )}
                            {event.all_day && <span>All day</span>}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    ))}
                    {todayEvents.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{todayEvents.length - 5} more events
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Prep Suggestions */}
            {todayEvents.some(e => 
              e.title.toLowerCase().includes('meeting') ||
              e.title.toLowerCase().includes('interview') ||
              e.title.toLowerCase().includes('presentation')
            ) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-event-amber/10 border border-event-amber/20 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-event-amber mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Preparation Recommended</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You have important meetings today. Say "Prepare for my next meeting" to get ready.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tomorrow Preview */}
            {tomorrowEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Tomorrow</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {tomorrowEvents.length} event{tomorrowEvents.length !== 1 ? 's' : ''} scheduled
                </span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-secondary/20">
            <Button
              onClick={() => {
                stopBriefing();
                onDismiss();
              }}
              className="w-full bg-gradient-to-r from-event-coral to-event-rose hover:opacity-90"
            >
              Start My Day
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
