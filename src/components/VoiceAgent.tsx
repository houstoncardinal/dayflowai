import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff,
  Loader2,
  CheckCircle2,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/calendar';
import { AutomationTask } from '@/types/agent';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Web Speech API types
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventType {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventType {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionType {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventType) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventType) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface VoiceAgentProps {
  events: CalendarEvent[];
  onTaskComplete?: (task: AutomationTask) => void;
  onCreateEvent?: (event: any) => Promise<void>;
  onVoiceCommand?: (command: string) => void;
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// Voice command patterns for event creation
const EVENT_CREATION_PATTERNS = [
  /schedule/i,
  /create/i,
  /add.*event/i,
  /add.*meeting/i,
  /set up/i,
  /book/i,
  /remind me/i,
  /appointment/i,
];

export function VoiceAgent({ events, onTaskComplete, onCreateEvent, onVoiceCommand, externalOpen, onExternalClose }: VoiceAgentProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Sync with external open state from CommandHub
  useEffect(() => {
    if (externalOpen && !isOpen) {
      setIsOpen(true);
    }
  }, [externalOpen]);

  const handleClose = () => {
    setIsOpen(false);
    onExternalClose?.();
  };
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor() as SpeechRecognitionType;
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEventType) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentTranscript(transcript);
        
        // If this is a final result, process it
        if (event.results[event.results.length - 1].isFinal) {
          handleUserSpeech(transcript);
          onVoiceCommand?.(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEventType) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in your browser settings.');
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const isEventCreationCommand = (text: string): boolean => {
    return EVENT_CREATION_PATTERNS.some(pattern => pattern.test(text));
  };

  const handleEventCreation = async (transcript: string): Promise<string> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-command-parser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          command: transcript,
          currentDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse voice command');
      }

      const parsed = await response.json();

      if (parsed.error) {
        return `I couldn't understand that command. ${parsed.suggestion || 'Try saying something like "Schedule a meeting with John tomorrow at 2pm"'}`;
      }

      // Create the event
      if (onCreateEvent && parsed.title && parsed.event_date) {
        await onCreateEvent({
          title: parsed.title,
          event_date: parsed.event_date,
          start_time: parsed.start_time || null,
          end_time: parsed.end_time || null,
          description: parsed.description || null,
          all_day: parsed.all_day || !parsed.start_time,
          color: parsed.color || 'teal',
        });

        const timeInfo = parsed.start_time ? ` at ${parsed.start_time}` : '';
        return `Done! I've added "${parsed.title}" to your calendar for ${parsed.event_date}${timeInfo}. Is there anything else you'd like me to help with?`;
      }

      return "I understood the command but couldn't create the event. Please try again.";
    } catch (error) {
      console.error('Event creation error:', error);
      return "Sorry, I had trouble creating that event. Please try again or use the manual event form.";
    }
  };

  const handleUserSpeech = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setIsListening(false);
    setIsSpeaking(true);
    
    try {
      let result = '';

      // Check if this is an event creation command
      if (isEventCreationCommand(transcript)) {
        result = await handleEventCreation(transcript);
      } else {
        // Process with AI assistant for other commands
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: transcript }],
            events: events.slice(0, 30),
            action: 'voice',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to process voice command');
        }

        // Parse streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const json = JSON.parse(line.slice(6));
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) result += content;
                } catch {}
              }
            }
          }
        }
      }

      setAgentResponse(result);
      
      // Speak the response using ElevenLabs TTS
      if (audioEnabled && result) {
        await speakText(result);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Failed to process voice command');
      setAgentResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsSpeaking(false);
      // Resume listening after response
      if (status === 'connected' && !isMuted) {
        startListening();
      }
    }
  };

  const speakText = async (text: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: text.slice(0, 1000) }), // Limit text length
      });

      if (!response.ok) {
        console.error('TTS request failed');
        return;
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isMuted) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setCurrentTranscript('');
      } catch (error) {
        console.error('Failed to start listening:', error);
      }
    }
  }, [isMuted]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const startConversation = useCallback(async () => {
    setStatus('connecting');
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setStatus('connected');
      toast.success('Voice agent connected! Start speaking...');
      
      // Start listening
      startListening();
      
      // Greet user with schedule overview
      const greeting = generateGreeting();
      setAgentResponse(greeting);
      if (audioEnabled) {
        await speakText(greeting);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setStatus('disconnected');
      toast.error('Failed to connect. Please check microphone permissions.');
    }
  }, [events, audioEnabled, startListening]);

  const generateGreeting = () => {
    const today = new Date();
    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate.toDateString() === today.toDateString();
    });
    
    if (todayEvents.length === 0) {
      return "Hello! Your schedule is clear for today. Would you like me to help you plan something or check your upcoming events?";
    } else if (todayEvents.length === 1) {
      return `Hello! You have one event today: "${todayEvents[0].title}". Would you like me to help you prepare for it?`;
    } else {
      return `Hello! You have ${todayEvents.length} events scheduled for today. Would you like me to walk you through them or help with preparation?`;
    }
  };

  const endConversation = useCallback(() => {
    stopListening();
    setStatus('disconnected');
    setCurrentTranscript('');
    setAgentResponse('');
    toast.info('Voice agent disconnected');
  }, [stopListening]);

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (status === 'connected') {
        startListening();
      }
    } else {
      setIsMuted(true);
      stopListening();
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (audioRef.current) {
      audioRef.current.muted = !audioEnabled;
    }
  };

  return (
    <>
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      
      {/* Floating Voice Button removed — voice is accessed via CommandHub */}

      {/* Voice Agent Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-event-coral via-event-rose to-event-violet p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                    status === 'connected' ? "bg-white/30" : "bg-white/20"
                  )}>
                    {status === 'connecting' ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Voice Agent</h3>
                    <p className="text-xs text-white/70">
                      {status === 'connected' ? (
                        isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Ready'
                      ) : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Status Visualization */}
              <div className="flex justify-center">
                <div className={cn(
                  "relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300",
                  status === 'connected' 
                    ? isSpeaking 
                      ? "bg-event-violet/20" 
                      : isListening 
                        ? "bg-event-coral/20" 
                        : "bg-event-emerald/20"
                    : "bg-muted"
                )}>
                  {status === 'connected' && (
                    <>
                      {/* Pulse rings */}
                      {(isListening || isSpeaking) && (
                        <>
                          <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={cn(
                              "absolute inset-0 rounded-full",
                              isSpeaking ? "bg-event-violet/30" : "bg-event-coral/30"
                            )}
                          />
                          <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                            className={cn(
                              "absolute inset-0 rounded-full",
                              isSpeaking ? "bg-event-violet/20" : "bg-event-coral/20"
                            )}
                          />
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Center icon */}
                  {status === 'connected' ? (
                    isSpeaking ? (
                      <Volume2 className="h-10 w-10 text-event-violet" />
                    ) : isListening ? (
                      <Mic className="h-10 w-10 text-event-coral" />
                    ) : (
                      <CheckCircle2 className="h-10 w-10 text-event-emerald" />
                    )
                  ) : status === 'connecting' ? (
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  ) : (
                    <MicOff className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Transcript Display */}
              {currentTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-secondary/50 rounded-xl p-3"
                >
                  <p className="text-xs text-muted-foreground mb-1">You said:</p>
                  <p className="text-sm">{currentTranscript}</p>
                </motion.div>
              )}

              {/* Agent Response */}
              {agentResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-event-violet/10 border border-event-violet/20 rounded-xl p-3"
                >
                  <p className="text-xs text-event-violet mb-1">Agent:</p>
                  <p className="text-sm line-clamp-4">{agentResponse}</p>
                </motion.div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {status === 'connected' ? (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleMute}
                      className={cn(
                        "h-10 w-10 rounded-full",
                        isMuted && "bg-destructive/10 border-destructive text-destructive"
                      )}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      onClick={endConversation}
                      size="icon"
                      className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90"
                    >
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleAudio}
                      className={cn(
                        "h-10 w-10 rounded-full",
                        !audioEnabled && "bg-muted"
                      )}
                    >
                      {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={startConversation}
                    disabled={status === 'connecting'}
                    className="bg-gradient-to-r from-event-coral to-event-violet hover:opacity-90 px-8"
                  >
                    {status === 'connecting' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Start Voice Agent
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Quick Commands */}
              {status === 'connected' && !isSpeaking && !isListening && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Try saying:</p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {[
                      'Schedule a meeting tomorrow at 2pm',
                      'What\'s on my schedule?',
                      'Prepare for my next meeting',
                    ].map((cmd, i) => (
                      <span
                        key={i}
                        className="text-xs bg-secondary/50 px-2 py-1 rounded-full text-muted-foreground"
                      >
                        "{cmd}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
