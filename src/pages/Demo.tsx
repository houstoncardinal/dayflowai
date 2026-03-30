import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
  ArrowRight,
  CalendarDays,
  Bot,
  User,
  Send,
  PackageOpen,
  Sparkles,
  MessageSquare,
  FileText,
  Clock,
  Calendar,
  Play,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

// ── Demo Script ──────────────────────────────────────────────────────
const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');

interface DemoEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
  description: string;
}

interface DemoMessage {
  role: 'user' | 'assistant';
  content: string;
  delay: number; // ms before showing
  typeSpeed?: number; // ms per char for typing effect
}

interface DemoDeliverable {
  title: string;
  type: string;
  icon: string;
  delay: number;
}

const DEMO_EVENT: DemoEvent = {
  id: 'demo-main',
  title: 'Client Pitch — Acme Corp',
  date: tomorrowStr,
  time: '10:00 – 11:30',
  color: 'bg-event-violet',
  description: 'Present Q1 results and propose expansion into EMEA markets. Key stakeholders: VP Sales, Head of Partnerships, CFO.',
};

const DEMO_CONVERSATION: DemoMessage[] = [
  {
    role: 'user',
    content: 'Prepare everything I need for this client pitch. I want an agenda, talking points, and a follow-up email template ready to go.',
    delay: 800,
    typeSpeed: 15,
  },
  {
    role: 'assistant',
    content: `I'll prepare a complete pitch kit for **Acme Corp**. Let me ask a couple of questions first:

1. **What were the Q1 highlights?** (revenue growth %, key wins, new partnerships)
2. **EMEA expansion** — do you have specific countries in mind, or should I propose a phased rollout?
3. **Budget ask** — are you requesting additional investment from the CFO?

These details will make the materials much more compelling.`,
    delay: 1200,
    typeSpeed: 8,
  },
  {
    role: 'user',
    content: 'Q1 revenue up 34%, landed 3 enterprise deals. EMEA focus on UK and Germany first. Yes, requesting $2M for EMEA team buildout.',
    delay: 600,
    typeSpeed: 15,
  },
  {
    role: 'assistant',
    content: `Perfect. Here's your complete pitch kit:

## 📋 Meeting Agenda (90 min)

| Time | Topic | Owner |
|------|-------|-------|
| 10:00 | Opening & Q1 Wins (34% growth, 3 enterprise deals) | You |
| 10:15 | EMEA Opportunity Analysis — UK & Germany | You |
| 10:35 | Phased Rollout Plan & $2M Investment Case | You |
| 10:55 | Q&A with CFO & VP Sales | All |
| 11:15 | Next Steps & Timeline | You |

## 🎯 Key Talking Points

- **Q1 momentum**: 34% YoY revenue growth demonstrates product-market fit
- **Enterprise traction**: 3 new enterprise deals prove scalability
- **EMEA timing**: UK and Germany markets show 2.4x higher intent signals
- **Investment ROI**: $2M buildout projects 18-month payback with 3x ARR potential
- **Risk mitigation**: Phased approach — UK first (Q2), Germany (Q3)

## ✉️ Follow-Up Email Template

**Subject: Acme Corp × EMEA Expansion — Next Steps**

Hi team, thank you for a productive session today. Key decisions:
- ✅ Approved Phase 1: UK market entry (Q2)
- 📋 CFO to review $2M allocation by [date]
- 📅 Follow-up: Detailed hiring plan review in 2 weeks

I've saved all three deliverables to your event's asset pocket. Good luck tomorrow! 🚀`,
    delay: 1500,
    typeSpeed: 4,
  },
];

const DEMO_DELIVERABLES: DemoDeliverable[] = [
  { title: 'Meeting Agenda', type: 'agenda', icon: '📋', delay: 500 },
  { title: 'Talking Points', type: 'document', icon: '🎯', delay: 800 },
  { title: 'Follow-Up Email', type: 'email', icon: '✉️', delay: 1100 },
];

// ── Flow Steps ───────────────────────────────────────────────────────
type FlowStep = 'calendar' | 'open-event' | 'chatting' | 'deliverables' | 'complete';

const STEP_INFO: Record<FlowStep, { label: string; description: string }> = {
  'calendar': { label: 'Schedule', description: 'Add events with details about what you need' },
  'open-event': { label: 'Open Workspace', description: 'Click any event to open its AI workspace' },
  'chatting': { label: 'Chat with AI', description: 'Describe what you need — AI asks smart questions' },
  'deliverables': { label: 'Get Assets', description: 'Deliverables saved to the event\'s virtual pocket' },
  'complete': { label: 'Done', description: 'Everything organized, right where you need it' },
};

const FLOW_ORDER: FlowStep[] = ['calendar', 'open-event', 'chatting', 'deliverables', 'complete'];

// ── Component ────────────────────────────────────────────────────────
export default function Demo() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('calendar');
  const [visibleMessages, setVisibleMessages] = useState<{ role: string; content: string }[]>([]);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visibleDeliverables, setVisibleDeliverables] = useState<DemoDeliverable[]>([]);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimeouts = () => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
  };

  const scrollChat = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  // Type out a message character by character
  const typeMessage = useCallback((msg: DemoMessage, onDone: () => void) => {
    setIsTyping(true);
    setTypingText('');
    let i = 0;
    const speed = msg.typeSpeed || 10;

    const tick = () => {
      if (i < msg.content.length) {
        setTypingText(msg.content.slice(0, i + 1));
        i++;
        scrollChat();
        const t = setTimeout(tick, speed);
        timeoutRef.current.push(t);
      } else {
        setIsTyping(false);
        setTypingText('');
        setVisibleMessages(prev => [...prev, { role: msg.role, content: msg.content }]);
        scrollChat();
        onDone();
      }
    };
    tick();
  }, []);

  // Play the chat conversation
  const playConversation = useCallback((startIdx: number = 0) => {
    if (startIdx >= DEMO_CONVERSATION.length) {
      // Conversation done → show deliverables
      const t = setTimeout(() => setCurrentStep('deliverables'), 1000);
      timeoutRef.current.push(t);
      return;
    }

    const msg = DEMO_CONVERSATION[startIdx];
    const t = setTimeout(() => {
      typeMessage(msg, () => {
        setMessageIndex(startIdx + 1);
        playConversation(startIdx + 1);
      });
    }, msg.delay);
    timeoutRef.current.push(t);
  }, [typeMessage]);

  // Show deliverables one by one
  useEffect(() => {
    if (currentStep !== 'deliverables') return;
    setVisibleDeliverables([]);

    DEMO_DELIVERABLES.forEach((d, i) => {
      const t = setTimeout(() => {
        setVisibleDeliverables(prev => [...prev, d]);
        if (i === DEMO_DELIVERABLES.length - 1) {
          const t2 = setTimeout(() => setCurrentStep('complete'), 1500);
          timeoutRef.current.push(t2);
        }
      }, d.delay);
      timeoutRef.current.push(t);
    });
  }, [currentStep]);

  // Auto-play flow
  const startAutoPlay = () => {
    clearTimeouts();
    setAutoPlaying(true);
    setVisibleMessages([]);
    setVisibleDeliverables([]);
    setTypingText('');
    setIsTyping(false);
    setMessageIndex(0);
    setCurrentStep('calendar');

    const t1 = setTimeout(() => setCurrentStep('open-event'), 2000);
    const t2 = setTimeout(() => {
      setCurrentStep('chatting');
      playConversation(0);
    }, 3500);
    timeoutRef.current.push(t1, t2);
  };

  const resetDemo = () => {
    clearTimeouts();
    setAutoPlaying(false);
    setCurrentStep('calendar');
    setVisibleMessages([]);
    setVisibleDeliverables([]);
    setTypingText('');
    setIsTyping(false);
    setMessageIndex(0);
  };

  // Auto-start on mount
  useEffect(() => {
    const t = setTimeout(startAutoPlay, 800);
    timeoutRef.current.push(t);
    return clearTimeouts;
  }, []);

  const stepIndex = FLOW_ORDER.indexOf(currentStep);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Dayflow</span>
            <Badge variant="secondary" className="text-[10px]">DEMO</Badge>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button size="sm" className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Flow Progress */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {FLOW_ORDER.map((step, i) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                  i <= stepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {i < stepIndex ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center text-[9px] font-bold">
                      {i + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{STEP_INFO[step].label}</span>
                </div>
                {i < FLOW_ORDER.length - 1 && (
                  <ChevronRight className={cn(
                    'h-3.5 w-3.5 flex-shrink-0 hidden md:block',
                    i < stepIndex ? 'text-primary' : 'text-muted-foreground/40'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 md:py-8">
        {/* Step Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center mb-6"
          >
            <h2 className="text-xl md:text-2xl font-bold mb-1">{STEP_INFO[currentStep].description}</h2>
            <p className="text-sm text-muted-foreground">
              {currentStep === 'complete' ? 'Ready to try it yourself?' : 'Watch the AI workflow in action'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Demo Display */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Left: Calendar Event Card */}
          <div className="lg:col-span-2">
            <motion.div
              className={cn(
                'rounded-2xl border-2 transition-all duration-500 overflow-hidden',
                currentStep === 'calendar' ? 'border-primary shadow-lg' :
                currentStep === 'open-event' ? 'border-primary shadow-lg scale-[1.02]' :
                'border-border'
              )}
            >
              {/* Mini Calendar Header */}
              <div className="bg-card p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{format(addDays(today, 1), 'EEEE, MMMM d')}</span>
                </div>

                {/* Event Card */}
                <motion.div
                  className={cn(
                    'rounded-xl p-3.5 cursor-pointer transition-all',
                    DEMO_EVENT.color,
                    'text-white'
                  )}
                  animate={currentStep === 'open-event' ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 0.6, repeat: currentStep === 'open-event' ? Infinity : 0, repeatDelay: 0.5 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{DEMO_EVENT.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-white/80 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{DEMO_EVENT.time}</span>
                      </div>
                    </div>
                    {currentStep !== 'calendar' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center"
                      >
                        <Sparkles className="h-3 w-3" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-xs text-white/70 mt-2 line-clamp-2">{DEMO_EVENT.description}</p>
                </motion.div>
              </div>

              {/* Deliverables Pocket */}
              <div className="bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PackageOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Virtual Pocket</span>
                  {visibleDeliverables.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 ml-auto">
                      {visibleDeliverables.length} assets
                    </Badge>
                  )}
                </div>
                <AnimatePresence>
                  {visibleDeliverables.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 italic">
                      AI-generated assets will appear here...
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {visibleDeliverables.map((d, i) => (
                        <motion.div
                          key={d.title}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted text-xs"
                        >
                          <span>{d.icon}</span>
                          <span className="font-medium">{d.title}</span>
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Other Events */}
            <div className="mt-3 space-y-2">
              {[
                { title: 'Team Standup', time: '09:00', color: 'bg-event-teal' },
                { title: 'Yoga Class', time: '07:00', color: 'bg-event-rose' },
              ].map((e) => (
                <div key={e.title} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/50 text-xs">
                  <div className={cn('h-2 w-2 rounded-full', e.color)} />
                  <span className="font-medium">{e.title}</span>
                  <span className="text-muted-foreground ml-auto">{e.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: AI Chat Panel */}
          <div className="lg:col-span-3">
            <motion.div
              className={cn(
                'rounded-2xl border-2 overflow-hidden flex flex-col transition-all duration-500',
                currentStep === 'chatting' || currentStep === 'deliverables' || currentStep === 'complete'
                  ? 'border-primary/50 shadow-lg'
                  : 'border-border opacity-60'
              )}
              style={{ height: '520px' }}
            >
              {/* Chat Header */}
              <div className="p-3 border-b border-border bg-card flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">AI Workspace</h4>
                  <p className="text-[10px] text-muted-foreground">
                    {DEMO_EVENT.title}
                  </p>
                </div>
                {(isTyping || (currentStep === 'chatting' && messageIndex < DEMO_CONVERSATION.length)) && (
                  <Badge variant="secondary" className="ml-auto text-[10px] gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    AI thinking
                  </Badge>
                )}
              </div>

              {/* Messages */}
              <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                {currentStep === 'calendar' || currentStep === 'open-event' ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium mb-1">Click an event to start</p>
                    <p className="text-xs text-muted-foreground">
                      Each event has its own AI workspace and virtual pocket for deliverables
                    </p>
                  </div>
                ) : (
                  <>
                    {visibleMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                      >
                        <div className={cn(
                          'flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                        )}>
                          {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        </div>
                        <div className={cn(
                          'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm'
                        )}>
                          {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="prose prose-xs dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:text-[10px] [&_th]:px-2 [&_td]:px-2">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Currently typing message */}
                    {isTyping && typingText && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex gap-2',
                          DEMO_CONVERSATION[messageIndex]?.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        <div className={cn(
                          'flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center',
                          DEMO_CONVERSATION[messageIndex]?.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                        )}>
                          {DEMO_CONVERSATION[messageIndex]?.role === 'user'
                            ? <User className="h-3 w-3" />
                            : <Bot className="h-3 w-3" />}
                        </div>
                        <div className={cn(
                          'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                          DEMO_CONVERSATION[messageIndex]?.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm'
                        )}>
                          {DEMO_CONVERSATION[messageIndex]?.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{typingText}</p>
                          ) : (
                            <div className="prose prose-xs dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:text-[10px] [&_th]:px-2 [&_td]:px-2">
                              <ReactMarkdown>{typingText}</ReactMarkdown>
                            </div>
                          )}
                          <span className="inline-block w-0.5 h-3 bg-current animate-pulse ml-0.5" />
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Fake Input */}
              <div className="p-3 border-t border-border bg-card">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-9 rounded-xl border border-border bg-background px-3 flex items-center text-xs text-muted-foreground">
                    Tell the AI what you need for this event...
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <Send className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={resetDemo} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          {!autoPlaying && (
            <Button size="sm" onClick={startAutoPlay} className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
              <Play className="h-3.5 w-3.5" /> Play Demo
            </Button>
          )}
        </div>

        {/* CTA */}
        <AnimatePresence>
          {currentStep === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-8 mb-4"
            >
              <h3 className="text-lg font-bold mb-2">Every event becomes an AI-powered workspace</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Schedule it, describe what you need, and let AI agents deliver — agendas, emails, research, and more — right inside the event.
              </p>
              <Link to="/auth">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg">
                  Start Using Dayflow <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
