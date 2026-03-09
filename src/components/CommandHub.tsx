import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Mic, BarChart3, RefreshCw, Sparkles, Zap, Sun, Moon, Coffee,
  ChevronUp, Brain, Calendar, Mail, FileText, Clock, Target,
  Workflow, Link2, Bot, Users, Key, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/calendar';
import { format, isToday, parseISO } from 'date-fns';
import { useSubscription, Feature } from '@/hooks/useSubscription';
import { FeatureGateDialog } from '@/components/FeatureGate';

interface CommandHubProps {
  events: CalendarEvent[];
  onAddEvent: () => void;
  onOpenVoice: () => void;
  onOpenAnalytics: () => void;
  onOpenCalendarSync: () => void;
  onOpenSuggestions: () => void;
  onOpenWorkflows: () => void;
  onOpenIntegrations: () => void;
  onOpenSchedulingLinks: () => void;
  onOpenTeamWorkspace: () => void;
  onOpenAPIWebhooks: () => void;
  onQuickAction: (action: string) => void;
  isVoiceActive?: boolean;
  pendingSuggestions?: number;
}

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
  badge?: string;
  pulse?: boolean;
  proOnly?: boolean;
  feature?: Feature;
}

export function CommandHub({
  events,
  onAddEvent,
  onOpenVoice,
  onOpenAnalytics,
  onOpenCalendarSync,
  onOpenSuggestions,
  onOpenWorkflows,
  onOpenIntegrations,
  onOpenSchedulingLinks,
  onOpenTeamWorkspace,
  onOpenAPIWebhooks,
  onQuickAction,
  isVoiceActive = false,
  pendingSuggestions = 0,
}: CommandHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<Feature | null>(null);
  const { canAccess } = useSubscription();

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const TimeIcon = hour < 17 ? Sun : Moon;

  const todayEvents = useMemo(
    () => events.filter(e => isToday(parseISO(e.event_date))),
    [events]
  );

  const nextEvent = useMemo(() => {
    const now = new Date();
    return todayEvents
      .filter(e => e.start_time && new Date(`${e.event_date}T${e.start_time}`) > now)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))[0];
  }, [todayEvents]);

  // Context-aware actions that change based on time & calendar state
  const contextActions: QuickAction[] = useMemo(() => {
    const actions: QuickAction[] = [];

    // Always show: create event
    actions.push({
      id: 'new-event',
      icon: Plus,
      label: 'New Event',
      description: 'Create a new event (Ctrl+N)',
      color: 'from-event-amber to-event-coral',
      onClick: onAddEvent,
    });

    // Time-of-day actions
    if (timeOfDay === 'morning' && todayEvents.length > 0) {
      actions.push({
        id: 'morning-prep',
        icon: Coffee,
        label: 'Morning Prep',
        description: `Prep all ${todayEvents.length} events for today`,
        color: 'from-event-amber to-amber-600',
        onClick: () => onQuickAction('morning-prep'),
        proOnly: true,
        feature: 'ai-agents',
      });
    }

    if (timeOfDay === 'evening') {
      actions.push({
        id: 'day-wrap',
        icon: Moon,
        label: 'Day Wrap-Up',
        description: 'Summarize today & plan tomorrow',
        color: 'from-event-violet to-purple-700',
        onClick: () => onQuickAction('day-wrap'),
        proOnly: true,
        feature: 'ai-agents',
      });
    }

    // Next meeting prep
    if (nextEvent) {
      actions.push({
        id: 'prep-next',
        icon: Target,
        label: `Prep: ${nextEvent.title.slice(0, 20)}`,
        description: `Starts at ${nextEvent.start_time}`,
        color: 'from-event-teal to-emerald-600',
        onClick: () => onQuickAction(`prep-event-${nextEvent.id}`),
        proOnly: true,
        feature: 'ai-agents',
      });
    }

    // Smart suggestions
    if (pendingSuggestions > 0) {
      actions.push({
        id: 'suggestions',
        icon: Sparkles,
        label: 'Smart Suggestions',
        description: `${pendingSuggestions} actions ready`,
        color: 'from-event-coral to-rose-600',
        onClick: onOpenSuggestions,
        badge: `${pendingSuggestions}`,
        pulse: true,
      });
    }

    // Automation workflows
    actions.push({
      id: 'workflows',
      icon: Workflow,
      label: 'Workflows',
      description: 'Run automated workflows',
      color: 'from-event-violet to-indigo-600',
      onClick: onOpenWorkflows,
      proOnly: true,
      feature: 'automation-workflows',
    });

    // Voice
    actions.push({
      id: 'voice',
      icon: Mic,
      label: 'Voice Command',
      description: 'Speak to control your calendar',
      color: isVoiceActive ? 'from-event-emerald to-green-600' : 'from-gray-500 to-gray-600',
      onClick: onOpenVoice,
      pulse: isVoiceActive,
    });

    // Scheduling Links
    actions.push({
      id: 'scheduling-links',
      icon: Calendar,
      label: 'Scheduling Links',
      description: 'Share booking pages',
      color: 'from-event-emerald to-green-600',
      onClick: onOpenSchedulingLinks,
    });

    // Team Workspace
    actions.push({
      id: 'team',
      icon: Users,
      label: 'Team Workspace',
      description: 'Shared calendars & members',
      color: 'from-event-violet to-purple-600',
      onClick: onOpenTeamWorkspace,
    });

    // Integrations
    actions.push({
      id: 'integrations',
      icon: Link2,
      label: 'Integrations',
      description: 'Connect Slack, Google, Notion',
      color: 'from-blue-500 to-blue-700',
      onClick: onOpenIntegrations,
    });

    // Analytics
    actions.push({
      id: 'analytics',
      icon: BarChart3,
      label: 'Analytics',
      description: 'View productivity insights',
      color: 'from-event-teal to-cyan-600',
      onClick: onOpenAnalytics,
    });

    // API & Webhooks
    actions.push({
      id: 'api',
      icon: Key,
      label: 'API & Webhooks',
      description: 'Developer tools',
      color: 'from-gray-600 to-gray-800',
      onClick: onOpenAPIWebhooks,
    });

    // Sync
    actions.push({
      id: 'sync',
      icon: RefreshCw,
      label: 'Calendar Sync',
      description: 'Import/export events',
      color: 'from-gray-500 to-gray-700',
      onClick: onOpenCalendarSync,
    });

    return actions;
  }, [timeOfDay, todayEvents, nextEvent, pendingSuggestions, isVoiceActive, onAddEvent, onOpenVoice, onOpenAnalytics, onOpenCalendarSync, onOpenSuggestions, onOpenWorkflows, onOpenIntegrations, onOpenSchedulingLinks, onOpenTeamWorkspace, onOpenAPIWebhooks, onQuickAction]);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            />

            {/* Actions grid */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="absolute bottom-16 right-0 z-50 w-[320px] md:w-[360px]"
            >
              <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <TimeIcon className="h-4 w-4 text-event-amber" />
                    <span className="text-sm font-semibold">
                      Good {timeOfDay}
                    </span>
                    {todayEvents.length > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {todayEvents.length} events today
                      </span>
                    )}
                  </div>
                  {nextEvent && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Next: <strong className="text-foreground">{nextEvent.title}</strong> at {nextEvent.start_time}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-3 grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                  {contextActions.map((action, i) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        action.onClick();
                        setIsOpen(false);
                      }}
                      className={cn(
                        "relative flex flex-col items-start gap-1.5 p-3 rounded-xl text-left transition-all",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        "bg-muted/50 hover:bg-muted border border-transparent hover:border-border",
                        action.id === 'new-event' && "col-span-2 bg-gradient-to-r from-event-amber/10 to-event-coral/10 border-event-amber/20"
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn(
                          "h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                          action.color
                        )}>
                          <action.icon className="h-4 w-4 text-white" />
                        </div>
                        {action.badge && (
                          <span className={cn(
                            "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-event-coral text-white",
                            action.pulse && "animate-pulse"
                          )}>
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight">{action.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{action.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 border-t border-border bg-muted/20 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">V</kbd> for voice · <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">Ctrl+N</kbd> new event
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all",
            isOpen
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "bg-gradient-to-br from-event-amber to-event-coral text-white hover:opacity-90"
          )}
        >
          <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
            {isOpen ? <Plus className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
          </motion.div>
        </Button>
      </motion.div>

      {/* Pending badge on FAB */}
      {!isOpen && pendingSuggestions > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-event-coral text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-md animate-pulse"
        >
          {pendingSuggestions}
        </motion.div>
      )}
    </div>
  );
}

export default CommandHub;
