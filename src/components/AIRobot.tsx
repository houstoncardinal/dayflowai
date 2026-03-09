import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { CalendarEvent } from '@/types/calendar';
import { useAgents } from '@/hooks/useAgents';
import { useAgentOrchestrator } from '@/hooks/useAgentOrchestrator';
import { supabase } from '@/integrations/supabase/client';
import { useRateLimit } from '@/hooks/useRateLimit';
import { cn } from '@/lib/utils';
import { Search, X, Loader2, CheckCircle2, Sparkles, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIRobotProps {
  events: CalendarEvent[];
}

// Specialized agent teams
const AGENT_TEAMS = [
  {
    id: 'meeting-prep',
    name: 'Meeting Prep Squad',
    emoji: '📋',
    color: 'hsl(var(--event-violet))',
    agents: ['Researcher', 'Agenda Builder', 'Briefing Writer'],
    description: 'Prepares agendas, research briefs & talking points',
    commands: ['prep for', 'prepare', 'agenda', 'brief me', 'research'],
  },
  {
    id: 'follow-up',
    name: 'Follow-Up Crew',
    emoji: '✉️',
    color: 'hsl(var(--event-teal))',
    agents: ['Email Drafter', 'Action Tracker', 'Reminder Bot'],
    description: 'Drafts follow-ups, extracts action items & sends reminders',
    commands: ['follow up', 'action items', 'summarize', 'email', 'remind'],
  },
  {
    id: 'schedule-opt',
    name: 'Schedule Optimizers',
    emoji: '⚡',
    color: 'hsl(var(--event-amber))',
    agents: ['Time Analyst', 'Focus Blocker', 'Conflict Resolver'],
    description: 'Finds focus blocks, prevents burnout & resolves conflicts',
    commands: ['optimize', 'schedule', 'focus', 'reschedule', 'balance'],
  },
  {
    id: 'content',
    name: 'Content Factory',
    emoji: '📝',
    color: 'hsl(var(--event-emerald))',
    agents: ['Report Writer', 'Note Synthesizer', 'Doc Architect'],
    description: 'Generates reports, summaries & documentation',
    commands: ['report', 'document', 'notes', 'summary', 'create'],
  },
];

interface AgentTask {
  id: string;
  team: typeof AGENT_TEAMS[number];
  command: string;
  status: 'dispatching' | 'working' | 'completed' | 'failed';
  activeAgent: string;
  progress: number;
  result?: string;
  startedAt: number;
}

export function AIRobot({ events }: AIRobotProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [robotMood, setRobotMood] = useState<'idle' | 'thinking' | 'working' | 'happy'>('idle');
  const [robotPosition, setRobotPosition] = useState({ x: 0, y: 0 });
  const robotControls = useAnimation();
  const inputRef = useRef<HTMLInputElement>(null);
  const floatInterval = useRef<ReturnType<typeof setInterval>>();
  const { checkLimit, isLimited, remainingCalls } = useRateLimit('ai-agent');

  const {
    analyzeSchedule,
    runTask,
  } = useAgents(events);

  const {
    planOrchestration,
    executeOrchestration,
  } = useAgentOrchestrator(events);

  // Floating animation - subtle hovering (uses framer-motion controls, auto-cleans up)
  useEffect(() => {
    let cancelled = false;
    const float = async () => {
      while (!cancelled) {
        await robotControls.start({
          y: [0, -8, 0, -4, 0],
          rotate: [0, -2, 0, 2, 0],
          transition: { duration: 4, ease: 'easeInOut' },
        });
      }
    };
    if (robotMood === 'idle') float();
    return () => {
      cancelled = true;
      robotControls.stop();
    };
  }, [robotMood, robotControls]);

  // Focus input when command palette opens
  useEffect(() => {
    if (isCommandOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCommandOpen]);

  // Match command to team
  const matchTeam = useCallback((input: string) => {
    const lower = input.toLowerCase();
    return AGENT_TEAMS.find(team =>
      team.commands.some(cmd => lower.includes(cmd))
    ) || AGENT_TEAMS[0]; // default to meeting prep
  }, []);

  // Execute command — routes to differentiated AI actions per team
  const handleCommand = useCallback(async (input: string) => {
    if (!input.trim()) return;

    // Rate limit check
    if (!checkLimit()) return;

    const team = matchTeam(input);
    const taskId = `task-${Date.now()}`;

    const newTask: AgentTask = {
      id: taskId,
      team,
      command: input,
      status: 'dispatching',
      activeAgent: team.agents[0],
      progress: 0,
      startedAt: Date.now(),
    };

    setActiveTasks(prev => [newTask, ...prev]);
    setRobotMood('working');
    setCommandInput('');
    setIsCommandOpen(false);

    // Brief dispatch animation
    await new Promise(r => setTimeout(r, 400));
    setActiveTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: 'working' as const, progress: 20 } : t)
    );

    // Route to differentiated AI actions based on team
    try {
      const teamActionMap: Record<string, { action: string; taskType: string }> = {
        'meeting-prep': { action: 'execute_task', taskType: 'preparation' },
        'follow-up': { action: 'execute_task', taskType: 'follow-up' },
        'schedule-opt': { action: 'analyze', taskType: 'scheduling' },
        'content': { action: 'execute_task', taskType: 'documentation' },
      };

      const teamAction = teamActionMap[team.id] || teamActionMap['schedule-opt'];
      
      // Update progress as agent works
      setActiveTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, activeAgent: team.agents[1] || team.agents[0], progress: 50 } : t)
      );

      let resultText = '';

      if (teamAction.action === 'analyze') {
        const analysis = await analyzeSchedule();
        resultText = analysis
          ? `**Schedule Analysis Complete**\n\nWorkload: ${analysis.workloadScore || 'N/A'}/100\n\n${analysis.insights?.map((i: any) => `• ${i.description}`).join('\n') || 'Your schedule looks optimized!'}`
          : 'Schedule analyzed successfully — no issues found.';
      } else {
        // Execute a specific task type via the AI edge function
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            messages: [{ role: 'user', content: input }],
            events: events.slice(0, 30),
            action: 'execute_task',
            task: {
              id: taskId,
              type: teamAction.taskType,
              title: input,
              context: `User command: "${input}". Team: ${team.name}. Agents: ${team.agents.join(', ')}.`,
            },
          },
        });

        if (error) throw error;

        // Format the result
        if (data?.data) {
          const toolData = data.data;
          const sections = [];
          if (toolData.title) sections.push(`**${toolData.title}**`);
          if (toolData.executive_summary) sections.push(toolData.executive_summary);
          if (toolData.tldr) sections.push(toolData.tldr);
          if (toolData.objectives?.length) sections.push(`\n**Objectives:**\n${toolData.objectives.map((o: string) => `• ${o}`).join('\n')}`);
          if (toolData.action_items?.length) sections.push(`\n**Action Items:**\n${toolData.action_items.map((a: any) => `• ${a.task}${a.owner ? ` (${a.owner})` : ''}`).join('\n')}`);
          if (toolData.agenda_items?.length) sections.push(`\n**Agenda:**\n${toolData.agenda_items.map((a: any, i: number) => `${i+1}. ${a.topic} (${a.duration_minutes}min)`).join('\n')}`);
          resultText = sections.join('\n\n') || data.content || 'Task completed successfully.';
        } else {
          resultText = data?.content || 'Task completed successfully.';
        }
      }

      setActiveTasks(prev =>
        prev.map(t => t.id === taskId ? {
          ...t,
          status: 'completed' as const,
          progress: 100,
          activeAgent: team.agents[team.agents.length - 1],
          result: resultText,
        } : t)
      );
      setRobotMood('happy');
      setTimeout(() => setRobotMood('idle'), 3000);
    } catch {
      setActiveTasks(prev =>
        prev.map(t => t.id === taskId ? {
          ...t,
          status: 'failed' as const,
          progress: 100,
          result: 'Something went wrong. Please try again.',
        } : t)
      );
      setRobotMood('idle');
    }
  }, [matchTeam, analyzeSchedule, events]);



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && commandInput.trim()) {
      handleCommand(commandInput);
    } else if (e.key === 'Escape') {
      setIsCommandOpen(false);
    }
  };

  const activeTask = activeTasks.find(t => t.status === 'working' || t.status === 'dispatching');

  return (
    <>
      {/* The Robot */}
      <motion.div
        animate={robotControls}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 cursor-pointer select-none"
        onClick={() => setIsCommandOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: robotMood === 'working'
              ? ['0 0 20px 8px hsla(0,80%,55%,0.4)', '0 0 35px 12px hsla(0,80%,55%,0.6)', '0 0 20px 8px hsla(0,80%,55%,0.4)']
              : robotMood === 'happy'
              ? ['0 0 20px 8px hsla(140,80%,50%,0.4)', '0 0 30px 10px hsla(140,80%,50%,0.5)', '0 0 20px 8px hsla(140,80%,50%,0.4)']
              : ['0 0 15px 5px hsla(0,70%,50%,0.25)', '0 0 25px 8px hsla(0,70%,50%,0.35)', '0 0 15px 5px hsla(0,70%,50%,0.25)'],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Robot body */}
        <div className="relative h-14 w-14 md:h-16 md:w-16">
          {/* Main sphere */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-700 shadow-lg border-2 border-red-300/40" />

          {/* Metallic sheen */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />

          {/* Face */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Eyes */}
            <div className="flex gap-2 -mt-1">
              <motion.div
                className="relative h-3.5 w-3.5 md:h-4 md:w-4 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_hsla(140,70%,50%,0.6)]"
                animate={
                  robotMood === 'thinking'
                    ? { scaleY: [1, 0.2, 1], transition: { duration: 0.8, repeat: Infinity } }
                    : robotMood === 'working'
                    ? { opacity: [1, 0.4, 1], transition: { duration: 0.5, repeat: Infinity } }
                    : robotMood === 'happy'
                    ? { scaleY: [1, 0.6, 1], transition: { duration: 0.3, repeat: 2 } }
                    : {}
                }
              >
                {/* Pupil */}
                <div className="absolute inset-[3px] rounded-full bg-emerald-900/60" />
                {/* Reflection */}
                <div className="absolute top-[2px] right-[2px] h-1.5 w-1 rounded-full bg-white/80" />
              </motion.div>
              <motion.div
                className="relative h-3.5 w-3.5 md:h-4 md:w-4 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_hsla(140,70%,50%,0.6)]"
                animate={
                  robotMood === 'thinking'
                    ? { scaleY: [1, 0.2, 1], transition: { duration: 0.8, repeat: Infinity, delay: 0.1 } }
                    : robotMood === 'working'
                    ? { opacity: [1, 0.4, 1], transition: { duration: 0.5, repeat: Infinity, delay: 0.15 } }
                    : robotMood === 'happy'
                    ? { scaleY: [1, 0.6, 1], transition: { duration: 0.3, repeat: 2, delay: 0.05 } }
                    : {}
                }
              >
                <div className="absolute inset-[3px] rounded-full bg-emerald-900/60" />
                <div className="absolute top-[2px] right-[2px] h-1.5 w-1 rounded-full bg-white/80" />
              </motion.div>
            </div>
          </div>

          {/* Mouth / Expression */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            {robotMood === 'happy' ? (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="h-1 w-5 rounded-full bg-white/60"
                style={{ borderRadius: '0 0 8px 8px' }}
              />
            ) : robotMood === 'working' ? (
              <motion.div
                animate={{ width: ['8px', '12px', '8px'] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="h-1 rounded-full bg-white/40"
              />
            ) : (
              <div className="h-0.5 w-4 rounded-full bg-white/30" />
            )}
          </div>

          {/* Antenna */}
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center"
            animate={robotMood === 'working' ? { rotate: [-5, 5, -5] } : {}}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-amber-400"
              animate={{
                boxShadow: robotMood === 'working'
                  ? ['0 0 4px 2px hsla(38,90%,50%,0.5)', '0 0 10px 4px hsla(38,90%,50%,0.8)', '0 0 4px 2px hsla(38,90%,50%,0.5)']
                  : '0 0 4px 2px hsla(38,90%,50%,0.3)',
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <div className="h-2 w-0.5 bg-red-300/60" />
          </motion.div>
        </div>

        {/* Status indicator */}
        {activeTask && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center shadow-md"
          >
            <Loader2 className="h-3 w-3 text-white animate-spin" />
          </motion.div>
        )}
      </motion.div>

      {/* Command Palette */}
      <AnimatePresence>
        {isCommandOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[60] w-[90vw] max-w-lg"
            >
              <div className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What should I do? e.g. 'prep for my 2pm meeting'"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {commandInput && (
                    <button
                      onClick={() => handleCommand(commandInput)}
                      className="h-7 w-7 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                    >
                      <Send className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsCommandOpen(false)}
                    className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Agent Teams */}
                <div className="p-3 space-y-1 max-h-[50vh] overflow-y-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-2">
                    Specialized Teams
                  </p>
                  {AGENT_TEAMS.map((team) => {
                    const isMatch = commandInput && team.commands.some(c =>
                      commandInput.toLowerCase().includes(c)
                    );
                    return (
                      <motion.button
                        key={team.id}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setCommandInput(team.commands[0] + ' ');
                          inputRef.current?.focus();
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                          isMatch
                            ? "bg-red-500/10 border border-red-500/20"
                            : "hover:bg-muted/60"
                        )}
                      >
                        <span className="text-xl">{team.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{team.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{team.description}</p>
                        </div>
                        <div className="flex -space-x-1">
                          {team.agents.map((agent, i) => (
                            <div
                              key={i}
                              className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-bold"
                              title={agent}
                            >
                              {agent[0]}
                            </div>
                          ))}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Keyboard hint */}
                <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Type a command and press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Enter</kbd></span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Esc</kbd> to close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Active Tasks Panel - slides in from right side above the robot */}
      <AnimatePresence>
        {activeTasks.length > 0 && !isCommandOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-24 md:bottom-24 right-4 md:right-6 z-40 w-72 md:w-80 space-y-2"
          >
            {activeTasks.slice(0, 3).map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className={cn(
                  "rounded-xl border p-3 shadow-lg backdrop-blur-md",
                  task.status === 'completed'
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : task.status === 'failed'
                    ? "bg-destructive/10 border-destructive/20"
                    : "bg-card/95 border-border"
                )}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{task.team.emoji}</span>
                  <span className="text-xs font-semibold flex-1 truncate">{task.team.name}</span>
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : task.status === 'failed' ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  )}
                  <button
                    onClick={() => setActiveTasks(prev => prev.filter(t => t.id !== task.id))}
                    className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Command */}
                <p className="text-xs text-muted-foreground mb-2 truncate italic">"{task.command}"</p>

                {/* Active agent */}
                {(task.status === 'working' || task.status === 'dispatching') && (
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-amber-400"
                    />
                    <span className="text-[11px] font-medium">{task.activeAgent}</span>
                    <span className="text-[10px] text-muted-foreground">working...</span>
                  </div>
                )}

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      task.status === 'completed' ? "bg-emerald-500"
                        : task.status === 'failed' ? "bg-destructive"
                        : "bg-gradient-to-r from-red-400 to-amber-400"
                    )}
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Result */}
                {task.result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 text-xs leading-relaxed text-foreground/80"
                  >
                    <ReactMarkdown>{task.result}</ReactMarkdown>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIRobot;
