import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, CheckCircle2, Loader2, Coffee, Moon, Target,
  Zap, ArrowRight, ChevronDown, ChevronRight, RotateCcw,
  Sparkles, Clock, Brain, Mail, FileText, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/calendar';
import { isToday, isTomorrow, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

interface AutomationWorkflowsProps {
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
}

interface WorkflowStep {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
  result?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  steps: WorkflowStep[];
  available: boolean;
  reason?: string;
}

export function AutomationWorkflows({ events, isOpen, onClose }: AutomationWorkflowsProps) {
  const { user } = useAuth();
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>(() => buildWorkflows(events));

  const todayEvents = events.filter(e => isToday(parseISO(e.event_date)));
  const tomorrowEvents = events.filter(e => isTomorrow(parseISO(e.event_date)));
  const meetingKeywords = ['meeting', 'call', 'sync', 'standup', '1:1', 'review', 'interview', 'demo'];

  function buildWorkflows(evts: CalendarEvent[]): Workflow[] {
    const today = evts.filter(e => isToday(parseISO(e.event_date)));
    const tomorrow = evts.filter(e => isTomorrow(parseISO(e.event_date)));
    const meetings = today.filter(e => meetingKeywords.some(k => e.title.toLowerCase().includes(k)));

    return [
      {
        id: 'morning-routine',
        name: '☀️ Morning Routine',
        description: `Prep all ${today.length} events, check conflicts, plan your day`,
        emoji: '☀️',
        color: 'from-event-amber to-amber-600',
        available: today.length > 0,
        reason: today.length === 0 ? 'No events today' : undefined,
        steps: [
          { id: 'mr-1', icon: Calendar, label: 'Scan today\'s schedule', description: 'Analyze all events for conflicts and gaps', status: 'pending' },
          { id: 'mr-2', icon: Brain, label: 'AI schedule analysis', description: 'Get optimization suggestions', status: 'pending' },
          ...(meetings.length > 0
            ? [{ id: 'mr-3', icon: FileText, label: `Prep ${meetings.length} meetings`, description: 'Generate agendas and talking points', status: 'pending' as const }]
            : []),
          { id: 'mr-4', icon: Target, label: 'Block focus time', description: 'Find and protect deep work gaps', status: 'pending' },
          { id: 'mr-5', icon: Sparkles, label: 'Morning briefing', description: 'AI summary of your day ahead', status: 'pending' },
        ],
      },
      {
        id: 'meeting-blitz',
        name: '⚡ Meeting Blitz',
        description: `Prep all ${meetings.length} meetings with agendas & research`,
        emoji: '⚡',
        color: 'from-event-teal to-emerald-600',
        available: meetings.length > 0,
        reason: meetings.length === 0 ? 'No meetings today' : undefined,
        steps: meetings.flatMap((m, i) => [
          { id: `mb-${i}-agenda`, icon: FileText, label: `Agenda: ${m.title}`, description: 'Generate structured agenda', status: 'pending' as const },
          { id: `mb-${i}-research`, icon: Brain, label: `Research: ${m.title}`, description: 'Compile background context', status: 'pending' as const },
        ]),
      },
      {
        id: 'follow-up-sweep',
        name: '✉️ Follow-Up Sweep',
        description: 'Draft follow-up emails for completed meetings',
        emoji: '✉️',
        color: 'from-event-violet to-purple-700',
        available: meetings.length > 0,
        reason: meetings.length === 0 ? 'No meetings to follow up on' : undefined,
        steps: meetings.map((m, i) => ({
          id: `fu-${i}`,
          icon: Mail,
          label: `Follow-up: ${m.title}`,
          description: 'Draft email with action items',
          status: 'pending' as const,
        })),
      },
      {
        id: 'day-wrap',
        name: '🌙 Day Wrap-Up',
        description: 'Summarize today and plan tomorrow',
        emoji: '🌙',
        color: 'from-event-coral to-rose-600',
        available: true,
        steps: [
          { id: 'dw-1', icon: CheckCircle2, label: 'Review completed events', description: 'Summarize what happened today', status: 'pending' },
          { id: 'dw-2', icon: Mail, label: 'Batch follow-ups', description: 'Draft all pending follow-up emails', status: 'pending' },
          { id: 'dw-3', icon: Calendar, label: 'Tomorrow preview', description: `Preview ${tomorrow.length} events for tomorrow`, status: 'pending' },
          { id: 'dw-4', icon: Brain, label: 'Weekly optimization', description: 'AI checks for schedule improvements', status: 'pending' },
        ],
      },
      {
        id: 'weekly-report',
        name: '📊 Weekly Report',
        description: 'Generate a comprehensive week-in-review',
        emoji: '📊',
        color: 'from-blue-500 to-blue-700',
        available: evts.length > 0,
        reason: evts.length === 0 ? 'No events to report on' : undefined,
        steps: [
          { id: 'wr-1', icon: BarChart3, label: 'Gather metrics', description: 'Count meetings, focus time, breaks', status: 'pending' },
          { id: 'wr-2', icon: Brain, label: 'AI analysis', description: 'Identify patterns and trends', status: 'pending' },
          { id: 'wr-3', icon: FileText, label: 'Generate report', description: 'Create formatted weekly summary', status: 'pending' },
        ],
      },
    ];
  }

  const runWorkflow = useCallback(async (workflowId: string) => {
    if (!user || runningWorkflow) return;
    setRunningWorkflow(workflowId);
    setExpandedWorkflow(workflowId);

    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      // Update step to running
      setWorkflows(prev => prev.map(w =>
        w.id === workflowId
          ? { ...w, steps: w.steps.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s) }
          : w
      ));

      await new Promise(r => setTimeout(r, 400));

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: `${step.label}: ${step.description}` }],
              events: events.slice(0, 50),
              action: step.icon === Brain ? 'analyze' : 'execute_task',
              task: {
                id: step.id,
                type: step.icon === Mail ? 'follow-up' : step.icon === FileText ? 'preparation' : 'scheduling',
                title: step.label,
                context: step.description,
              },
            }),
          }
        );

        if (!response.ok) throw new Error('Step failed');

        const result = await response.json();
        const resultText = result.data
          ? JSON.stringify(result.data).slice(0, 500)
          : result.content || 'Completed successfully.';

        setWorkflows(prev => prev.map(w =>
          w.id === workflowId
            ? { ...w, steps: w.steps.map((s, idx) => idx === i ? { ...s, status: 'done' as const, result: resultText } : s) }
            : w
        ));
      } catch {
        setWorkflows(prev => prev.map(w =>
          w.id === workflowId
            ? { ...w, steps: w.steps.map((s, idx) => idx === i ? { ...s, status: 'failed' as const, result: 'Step failed — click retry' } : s) }
            : w
        ));
      }
    }

    setRunningWorkflow(null);
  }, [user, runningWorkflow, workflows, events]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55]"
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 z-[56] w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-event-violet to-indigo-600 flex items-center justify-center shadow-md">
                  <Zap className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Automation Workflows</h2>
                  <p className="text-xs text-muted-foreground">
                    Multi-step AI automations
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Workflows */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {workflows.map((workflow) => {
                  const isExpanded = expandedWorkflow === workflow.id;
                  const isRunning = runningWorkflow === workflow.id;
                  const completedSteps = workflow.steps.filter(s => s.status === 'done').length;
                  const totalSteps = workflow.steps.length;
                  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

                  return (
                    <motion.div
                      key={workflow.id}
                      layout
                      className={cn(
                        "rounded-xl border overflow-hidden transition-colors",
                        !workflow.available ? "opacity-50" : "",
                        isRunning ? "border-event-violet/40 bg-event-violet/5" : "bg-card hover:bg-muted/30"
                      )}
                    >
                      {/* Workflow header */}
                      <button
                        onClick={() => setExpandedWorkflow(isExpanded ? null : workflow.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        disabled={!workflow.available}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 text-lg",
                          workflow.color
                        )}>
                          <span className="text-white text-sm">{workflow.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{workflow.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {workflow.available ? workflow.description : workflow.reason}
                          </p>
                        </div>
                        {isRunning ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-event-violet">{completedSteps}/{totalSteps}</span>
                            <Loader2 className="h-4 w-4 animate-spin text-event-violet" />
                          </div>
                        ) : completedSteps === totalSteps && totalSteps > 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-event-emerald shrink-0" />
                        ) : (
                          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                        )}
                      </button>

                      {/* Progress bar */}
                      {isRunning && (
                        <div className="px-4 pb-2">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-event-violet to-event-coral rounded-full"
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Expanded steps */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 space-y-1.5 border-t border-border/50 pt-3">
                              {workflow.steps.map((step, idx) => (
                                <div
                                  key={step.id}
                                  className={cn(
                                    "flex items-start gap-2.5 p-2 rounded-lg text-sm",
                                    step.status === 'running' && "bg-event-violet/10",
                                    step.status === 'done' && "bg-event-emerald/5",
                                    step.status === 'failed' && "bg-destructive/5"
                                  )}
                                >
                                  {/* Step indicator */}
                                  <div className="mt-0.5 shrink-0">
                                    {step.status === 'running' ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-event-violet" />
                                    ) : step.status === 'done' ? (
                                      <CheckCircle2 className="h-4 w-4 text-event-emerald" />
                                    ) : step.status === 'failed' ? (
                                      <RotateCcw className="h-4 w-4 text-destructive" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                                        <span className="text-[8px] text-muted-foreground">{idx + 1}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      "text-xs font-medium",
                                      step.status === 'done' && "line-through opacity-60"
                                    )}>
                                      {step.label}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{step.description}</p>
                                  </div>
                                </div>
                              ))}

                              {/* Run button */}
                              {!isRunning && completedSteps < totalSteps && workflow.available && (
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); runWorkflow(workflow.id); }}
                                  className="w-full mt-2 h-8 text-xs bg-gradient-to-r from-event-violet to-indigo-600 text-white hover:opacity-90 gap-1.5"
                                >
                                  <Play className="h-3 w-3" />
                                  Run {workflow.name.replace(/^[^\w]*/, '')}
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <p className="text-[11px] text-muted-foreground text-center">
                Workflows adapt based on your calendar & time of day
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Need BarChart3 import
import { BarChart3 } from 'lucide-react';

export default AutomationWorkflows;
