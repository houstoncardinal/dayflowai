import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Zap,
  Brain,
  Play,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  User,
  Clock,
  TrendingUp,
  X,
  Loader2,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarEvent } from '@/types/calendar';
import { AutomationTask, Agent, ScheduleAnalysis } from '@/types/agent';
import { useAgents } from '@/hooks/useAgents';
import { cn } from '@/lib/utils';

interface AgentHubProps {
  events: CalendarEvent[];
}

export function AgentHub({ events }: AgentHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'agents'>('overview');
  const [selectedTask, setSelectedTask] = useState<AutomationTask | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const {
    agents,
    analysis,
    isAnalyzing,
    activeTaskId,
    analyzeSchedule,
    runTask,
    runAllTasks,
  } = useAgents(events);

  // Auto-analyze on open
  useEffect(() => {
    if (isOpen && !analysis && !isAnalyzing) {
      analyzeSchedule();
    }
  }, [isOpen, analysis, isAnalyzing, analyzeSchedule]);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-event-coral text-white';
      case 'medium': return 'bg-event-amber text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-event-emerald" />;
      case 'in-progress': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'blocked': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-event-emerald via-event-teal to-primary shadow-2xl flex items-center justify-center group"
          >
            <Brain className="h-5 w-5 md:h-6 md:w-6 text-white" />
            {analysis && analysis.automatableTasks.filter(t => t.status === 'pending').length > 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 bg-event-coral rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold text-white"
              >
                {analysis.automatableTasks.filter(t => t.status === 'pending').length}
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Agent Hub Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed inset-4 md:inset-auto md:bottom-6 md:left-6 z-50 md:w-[420px] md:h-[600px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-event-emerald via-event-teal to-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Agent Hub</h3>
                  <p className="text-xs text-white/70">Automate your workflow</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => analyzeSchedule()}
                  disabled={isAnalyzing}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                >
                  <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {(['overview', 'tasks', 'agents'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-3 text-sm font-medium transition-colors",
                    activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="h-12 w-12 text-primary" />
                  </motion.div>
                  <p className="text-muted-foreground">Analyzing your schedule...</p>
                </div>
              ) : !analysis ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                  <Brain className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Click refresh to analyze</p>
                </div>
              ) : (
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-secondary/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-event-amber" />
                              <span className="text-xs text-muted-foreground">Automation</span>
                            </div>
                            <p className="text-2xl font-bold">{analysis.automationPotential}%</p>
                            <p className="text-xs text-muted-foreground">of tasks automatable</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-event-emerald" />
                              <span className="text-xs text-muted-foreground">Workload</span>
                            </div>
                            <p className="text-2xl font-bold">{analysis.workloadScore}</p>
                            <Progress value={analysis.workloadScore} className="mt-2 h-1" />
                          </div>
                        </div>

                        {/* Quick Actions */}
                        {analysis.automatableTasks.filter(t => t.status === 'pending').length > 0 && (
                          <Button
                            onClick={runAllTasks}
                            disabled={activeTaskId !== null}
                            className="w-full bg-gradient-to-r from-event-emerald to-event-teal hover:opacity-90"
                          >
                            {activeTaskId ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Running tasks...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Run all {analysis.automatableTasks.filter(t => t.status === 'pending').length} automation tasks
                              </>
                            )}
                          </Button>
                        )}

                        {/* Insights */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Insights</h4>
                          {analysis.insights.map((insight, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className={cn(
                                "p-3 rounded-xl border",
                                insight.type === 'warning' && "bg-destructive/10 border-destructive/20",
                                insight.type === 'opportunity' && "bg-event-emerald/10 border-event-emerald/20",
                                insight.type === 'pattern' && "bg-event-violet/10 border-event-violet/20",
                                insight.type === 'optimization' && "bg-event-teal/10 border-event-teal/20"
                              )}
                            >
                              <p className="text-sm font-medium">{insight.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Human Required Summary */}
                        {analysis.humanRequiredTasks.length > 0 && (
                          <div className="bg-event-amber/10 border border-event-amber/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-event-amber" />
                              <span className="text-sm font-medium">Requires Your Attention</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {analysis.humanRequiredTasks.length} tasks need human judgment
                            </p>
                            <div className="space-y-2">
                              {analysis.humanRequiredTasks.slice(0, 3).map((task, i) => (
                                <div key={task.id} className="flex items-center gap-2 text-xs">
                                  <AlertCircle className="h-3 w-3 text-event-amber" />
                                  <span className="truncate">{task.title}</span>
                                </div>
                              ))}
                              {analysis.humanRequiredTasks.length > 3 && (
                                <button
                                  onClick={() => setActiveTab('tasks')}
                                  className="text-xs text-primary hover:underline"
                                >
                                  +{analysis.humanRequiredTasks.length - 3} more
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'tasks' && (
                      <motion.div
                        key="tasks"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {/* Automatable Tasks */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-event-emerald" />
                            <h4 className="text-sm font-medium">Automatable</h4>
                            <Badge variant="secondary" className="ml-auto">
                              {analysis.automatableTasks.length}
                            </Badge>
                          </div>
                          {analysis.automatableTasks.map((task) => (
                            <motion.div
                              key={task.id}
                              layout
                              className="bg-secondary/30 rounded-xl p-3 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(task.status)}
                                    <span className="text-sm font-medium truncate">{task.title}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                </div>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Est. {task.estimatedTime}
                                </span>
                                {task.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => runTask(task)}
                                    disabled={activeTaskId !== null}
                                    className="ml-auto h-7 text-xs"
                                  >
                                    {activeTaskId === task.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Play className="h-3 w-3 mr-1" />
                                        Run
                                      </>
                                    )}
                                  </Button>
                                )}
                                {task.status === 'completed' && task.output && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedTask(task)}
                                    className="ml-auto h-7 text-xs"
                                  >
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                    View Output
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Human Required Tasks */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-event-amber" />
                            <h4 className="text-sm font-medium">Requires Human</h4>
                            <Badge variant="secondary" className="ml-auto">
                              {analysis.humanRequiredTasks.length}
                            </Badge>
                          </div>
                          {analysis.humanRequiredTasks.map((task) => (
                            <motion.div
                              key={task.id}
                              className="bg-event-amber/5 border border-event-amber/20 rounded-xl p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium">{task.title}</span>
                                  <p className="text-xs text-muted-foreground mt-1">{task.humanReason}</p>
                                </div>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Est. {task.estimatedTime}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'agents' && (
                      <motion.div
                        key="agents"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        {agents.map((agent, i) => (
                          <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                              "rounded-xl p-4 border transition-colors",
                              agent.status === 'working' && "bg-primary/5 border-primary/30",
                              agent.status === 'completed' && "bg-event-emerald/5 border-event-emerald/30",
                              agent.status === 'idle' && "bg-secondary/30 border-border"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{agent.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{agent.name}</span>
                                  {agent.status === 'working' && (
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                  )}
                                  {agent.completedTasks > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {agent.completedTasks} done
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
                                
                                {agent.currentTask && (
                                  <div className="mt-2 p-2 bg-background rounded-lg">
                                    <p className="text-xs font-medium">Working on:</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {agent.currentTask.title}
                                    </p>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {agent.capabilities.slice(0, 3).map((cap, j) => (
                                    <span
                                      key={j}
                                      className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>

            {/* Task Output Modal */}
            <AnimatePresence>
              {selectedTask && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{selectedTask.title}</h4>
                      <p className="text-xs text-muted-foreground">Task Output</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(selectedTask.output || '', selectedTask.id)}
                        className="h-8 w-8"
                      >
                        {copiedId === selectedTask.id ? (
                          <Check className="h-4 w-4 text-event-emerald" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedTask(null)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {selectedTask.output}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
