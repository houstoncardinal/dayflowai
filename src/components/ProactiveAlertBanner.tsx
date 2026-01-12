import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  X, 
  Volume2,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProactiveAlert } from '@/hooks/useProactiveAlerts';
import { cn } from '@/lib/utils';

interface ProactiveAlertBannerProps {
  alert: ProactiveAlert | null;
  onDismiss: (alertId: string) => void;
  autoSpeak?: boolean;
}

export function ProactiveAlertBanner({ alert, onDismiss, autoSpeak = true }: ProactiveAlertBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spokenAlertsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (alert && !alert.dismissed) {
      setIsVisible(true);
      
      // Auto-speak if enabled and not already spoken
      if (autoSpeak && !spokenAlertsRef.current.has(alert.id)) {
        spokenAlertsRef.current.add(alert.id);
        speakAlert(alert.message);
      }

      // Auto-dismiss after 30 seconds for non-critical alerts
      if (alert.urgency !== 'critical') {
        const timeout = setTimeout(() => {
          handleDismiss();
        }, 30000);
        return () => clearTimeout(timeout);
      }
    } else {
      setIsVisible(false);
    }
  }, [alert, autoSpeak]);

  const speakAlert = async (text: string) => {
    setIsSpeaking(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioContent && audioRef.current) {
          audioRef.current.src = `data:audio/mpeg;base64,${data.audioContent}`;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Alert TTS error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleDismiss = () => {
    if (alert) {
      setIsVisible(false);
      onDismiss(alert.id);
    }
  };

  const getAlertStyles = () => {
    if (!alert) return { bg: '', border: '', icon: Bell };
    
    switch (alert.urgency) {
      case 'critical':
        return {
          bg: 'bg-destructive/10',
          border: 'border-destructive',
          icon: AlertTriangle,
          iconColor: 'text-destructive',
        };
      case 'high':
        return {
          bg: 'bg-event-coral/10',
          border: 'border-event-coral',
          icon: Clock,
          iconColor: 'text-event-coral',
        };
      case 'medium':
        return {
          bg: 'bg-event-amber/10',
          border: 'border-event-amber',
          icon: Bell,
          iconColor: 'text-event-amber',
        };
      default:
        return {
          bg: 'bg-event-teal/10',
          border: 'border-event-teal',
          icon: CheckCircle2,
          iconColor: 'text-event-teal',
        };
    }
  };

  const styles = getAlertStyles();
  const IconComponent = styles.icon || Bell;

  return (
    <>
      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      
      <AnimatePresence>
        {isVisible && alert && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={cn(
              "fixed top-4 left-1/2 z-[90] max-w-md w-full mx-4 rounded-xl border-2 shadow-2xl",
              styles.bg,
              styles.border
            )}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5", styles.iconColor)}>
                  {isSpeaking ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Volume2 className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <IconComponent className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1">
                    {alert.type === 'deadline' && 'Upcoming Event'}
                    {alert.type === 'prep' && 'Preparation Reminder'}
                    {alert.type === 'reminder' && 'Tomorrow\'s Reminder'}
                  </p>
                  <p className="text-sm text-foreground/80">{alert.message}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 -mt-1 -mr-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {alert.urgency === 'critical' && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 30, ease: 'linear' }}
                  className="mt-3 h-1 bg-destructive/50 rounded-full origin-left"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
