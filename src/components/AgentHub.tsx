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
  RefreshCw,
  Link2,
  BarChart3,
  GitBranch,
  ChevronDown,
  Maximize2,
  Minimize2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CalendarEvent } from '@/types/calendar';
import { AutomationTask, Agent, AGENT_DEFINITIONS } from '@/types/agent';
import { useAgents } from '@/hooks/useAgents';
import { useAgentOrchestrator } from '@/hooks/useAgentOrchestrator';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { AgentPerformanceAnalytics } from './AgentPerformanceAnalytics';
import { OrchestrationView } from './OrchestrationView';
import { AgentThinkingVisualizer } from './AgentThinkingVisualizer';

interface AgentHubProps {
  events: CalendarEvent[];
}

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview', icon: null },
  { id: 'tasks', label: 'Tasks', icon: null },
  { id: 'agents', label: 'Agents', icon: null },
  { id: 'orchestrate', label: 'Orchestrate', icon: GitBranch },
  { id: 'performance', label: 'Analytics', icon: BarChart3 },
] as const;

type TabId = typeof TAB_CONFIG[number]['id'];

export function AgentHub({ events }: AgentHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedTask, setSelectedTask] = useState<AutomationTask | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const {
    agents,
    analysis,
    isAnalyzing,
    activeTaskId,
    taskVisualization,
    analyzeSchedule,
    runTask,
    runAllTasks,
  } = useAgents(events);

  const {
    agents: orchestratorAgents,
    workQueue,
    currentPlan,
    isOrchestrating,
    activeVisualization,
    planOrchestration,
    executeOrchestration,
    cancelOrchestration,
  } = useAgentOrchestrator(events);

  // Determine which visualization to show (task-level or orchestrator-level)
  const currentViz = taskVisualization || activeVisualization;

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

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-event-coral/10 text-event-coral border-event-coral/20';
      case 'medium': return 'bg-event-amber/10 text-event-amber border-event-amber/20';
      default: return 'bg-muted text-muted-foreground border-border';
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

  const pendingTasksCount = analysis?.automatableTasks.filter(t => t.status === 'pending').length || 0;

  return (
    <>
      {/* Floating Trigger Button - Minimal & Professional */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 h-12 w-12 md:h-14 md:w-14 rounded-full bg-foreground shadow-lg flex items-center justify-center group transition-shadow hover:shadow-xl"
          >
            <Brain className="h-5 w-5 md:h-6 md:w-6 text-background" />
            {pendingTasksCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 bg-event-coral rounded-full flex items-center justify-center text-[10px] font-semibold text-white shadow-sm"
              >
                {pendingTasksCount}
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Agent Hub Panel - Clean Enterprise Design */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed z-50 bg-background border border-border shadow-2xl overflow-hidden flex flex-col",
                "inset-3 rounded-2xl",
                "md:inset-auto md:bottom-6 md:left-6 md:rounded-xl",
                isExpanded 
                  ? "md:w-[600px] md:h-[700px]" 
                  : "md:w-[420px] md:h-[580px]"
              )}
            >
              {/* Header - Refined */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-foreground flex items-center justify-center">
                    <Brain className="h-4.5 w-4.5 text-background" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm tracking-tight">AI Agent Hub</h3>
                    <p className="text-[11px] text-muted-foreground">Intelligent automation</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => analyzeSchedule()}
                    disabled={isAnalyzing}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex"
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs - Clean Minimal Style */}
              <div className="px-4 pt-3 pb-0">
                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                  {TAB_CONFIG.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all",
                          activeTab === tab.id
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 px-4 py-4">
                {/* Active Thinking Visualizer — always on top when running */}
                <AnimatePresence>
                  {currentViz && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4"
                    >
                      <AgentThinkingVisualizer
                        steps={currentViz.steps}
                        currentPhase={currentViz.currentPhase}
                        agentType={currentViz.agentType}
                        agentIcon={currentViz.agentIcon}
                        taskTitle={currentViz.taskTitle}
                        elapsedMs={currentViz.elapsedMs}
                        totalTokens={currentViz.totalTokens}
                        liveTokens={currentViz.liveTokens}
                        isStreaming={currentViz.isStreaming}
                        compact={!isExpanded}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {isAnalyzing && !currentViz ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Brain className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Analyzing schedule</p>
                      <p className="text-xs text-muted-foreground mt-1">Identifying automation opportunities...</p>
                    </div>
                  </div>
                ) : !analysis && !currentViz ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Brain className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Ready to analyze</p>
                      <p className="text-xs text-muted-foreground mt-1">Click refresh to scan your schedule</p>
                    </div>
                  </div>
                ) : !analysis ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Brain className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Ready to analyze</p>
                      <p className="text-xs text-muted-foreground mt-1">Click refresh to scan your schedule</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-5"
                      >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl border border-border bg-card">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-8 w-8 rounded-lg bg-event-amber/10 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-event-amber" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">Automation</span>
                            </div>
                            <p className="text-3xl font-semibold tracking-tight">{analysis.automationPotential}%</p>
                            <p className="text-[11px] text-muted-foreground mt-1">of tasks automatable</p>
                          </div>
                          
                          <div className="p-4 rounded-xl border border-border bg-card">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-8 w-8 rounded-lg bg-event-emerald/10 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-event-emerald" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">Workload</span>
                            </div>
                            <p className="text-3xl font-semibold tracking-tight">{analysis.workloadScore}</p>
                            <Progress value={analysis.workloadScore} className="mt-2 h-1.5" />
                          </div>
                        </div>

                        {/* Quick Action */}
                        {pendingTasksCount > 0 && (
                          <Button
                            onClick={runAllTasks}
                            disabled={activeTaskId !== null}
                            className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-medium"
                          >
                            {activeTaskId ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Run {pendingTasksCount} automation task{pendingTasksCount > 1 ? 's' : ''}
                              </>
                            )}
                          </Button>
                        )}

                        {/* Insights */}
                        {analysis.insights.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Insights</h4>
                            <div className="space-y-2">
                              {analysis.insights.map((insight, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className={cn(
                                    "p-3 rounded-lg border",
                                    insight.type === 'warning' && "bg-destructive/5 border-destructive/20",
                                    insight.type === 'opportunity' && "bg-event-emerald/5 border-event-emerald/20",
                                    insight.type === 'pattern' && "bg-event-violet/5 border-event-violet/20",
                                    insight.type === 'optimization' && "bg-event-teal/5 border-event-teal/20"
                                  )}
                                >
                                  <p className="text-sm font-medium">{insight.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Human Required */}
                        {analysis.humanRequiredTasks.length > 0 && (
                          <div className="p-4 rounded-xl border border-event-amber/20 bg-event-amber/5">
                            <div className="flex items-center gap-2 mb-3">
                              <User className="h-4 w-4 text-event-amber" />
                              <span className="text-sm font-medium">Requires attention</span>
                              <Badge variant="outline" className="ml-auto text-[10px] border-event-amber/30 text-event-amber">
                                {analysis.humanRequiredTasks.length}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {analysis.humanRequiredTasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="h-1.5 w-1.5 rounded-full bg-event-amber" />
                                  <span className="truncate">{task.title}</span>
                                </div>
                              ))}
                              {analysis.humanRequiredTasks.length > 3 && (
                                <button
                                  onClick={() => setActiveTab('tasks')}
                                  className="text-xs text-primary hover:underline font-medium"
                                >
                                  View all {analysis.humanRequiredTasks.length} tasks →
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Tasks Tab */}
                    {activeTab === 'tasks' && (
                      <motion.div
                        key="tasks"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-5"
                      >
                        {/* Automatable Tasks */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-event-emerald" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Automatable</h4>
                            <Badge variant="secondary" className="ml-auto text-[10px]">
                              {analysis.automatableTasks.length}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {analysis.automatableTasks.map((task) => (
                              <motion.div
                                key={task.id}
                                layout
                                className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    {getStatusIcon(task.status)}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{task.title}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={cn("text-[10px] shrink-0", getPriorityStyles(task.priority))}>
                                    {task.priority}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {task.estimatedTime}
                                  </span>
                                  {task.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={() => runTask(task)}
                                      disabled={activeTaskId !== null}
                                      className="h-7 text-xs px-3"
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
                                      className="h-7 text-xs px-3"
                                    >
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Output
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Human Required Tasks */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-event-amber" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manual</h4>
                            <Badge variant="secondary" className="ml-auto text-[10px]">
                              {analysis.humanRequiredTasks.length}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {analysis.humanRequiredTasks.map((task) => (
                              <div
                                key={task.id}
                                className="p-3 rounded-lg border border-event-amber/20 bg-event-amber/5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{task.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{task.humanReason}</p>
                                  </div>
                                  <Badge variant="outline" className={cn("text-[10px] shrink-0", getPriorityStyles(task.priority))}>
                                    {task.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{task.estimatedTime}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Agents Tab */}
                    {activeTab === 'agents' && (
                      <motion.div
                        key="agents"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        {/* Collaboration Info */}
                        <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-muted/30 to-muted/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Link2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Agent Collaboration</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Agents work as a team: Research gathers context → Prep creates agendas → 
                            Docs captures notes → Follow-up extracts actions
                          </p>
                        </div>

                        {/* Agent Grid */}
                        <div className="grid gap-3">
                          {agents.map((agent, i) => (
                            <motion.div
                              key={agent.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className={cn(
                                "p-4 rounded-xl border transition-all duration-200",
                                agent.status === 'working' && "border-primary/40 bg-primary/5 shadow-sm",
                                agent.status === 'completed' && "border-event-emerald/40 bg-event-emerald/5",
                                agent.status === 'idle' && "border-border bg-card hover:border-primary/30"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "text-2xl",
                                  agent.status === 'working' && "animate-pulse"
                                )}>
                                  {agent.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{agent.name}</span>
                                    {agent.status === 'working' && (
                                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                                        <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                                        Working
                                      </Badge>
                                    )}
                                    {agent.status === 'completed' && (
                                      <CheckCircle2 className="h-4 w-4 text-event-emerald" />
                                    )}
                                    {agent.completedTasks > 0 && (
                                      <Badge variant="secondary" className="text-[10px] ml-auto">
                                        {agent.completedTasks} done
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
                                  
                                  {agent.currentTask && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-3 p-2.5 bg-primary/10 rounded-lg border border-primary/20"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3 text-primary" />
                                        <p className="text-[11px] font-medium text-primary">Executing</p>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {agent.currentTask.title}
                                      </p>
                                    </motion.div>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {agent.capabilities.slice(0, 3).map((cap, j) => (
                                      <span
                                        key={j}
                                        className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                                      >
                                        {cap}
                                      </span>
                                    ))}
                                    {agent.capabilities.length > 3 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        +{agent.capabilities.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        
                        <div className="text-center pt-2">
                          <p className="text-[11px] text-muted-foreground">
                            Powered by <span className="font-medium">OpenAI</span>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Orchestrate Tab */}
                    {activeTab === 'orchestrate' && (
                      <motion.div
                        key="orchestrate"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        <OrchestrationView
                          plan={currentPlan}
                          workQueue={workQueue}
                          agents={orchestratorAgents}
                          isOrchestrating={isOrchestrating}
                          onExecute={executeOrchestration}
                          onCancel={cancelOrchestration}
                          onPlanNew={planOrchestration}
                        />
                      </motion.div>
                    )}

                    {/* Performance Tab */}
                    {activeTab === 'performance' && (
                      <motion.div
                        key="performance"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        <AgentPerformanceAnalytics
                          agents={agents}
                          tasks={[...analysis.automatableTasks, ...analysis.humanRequiredTasks]}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </ScrollArea>

              {/* Task Output Modal - Clean Overlay */}
              <AnimatePresence>
                {selectedTask && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background flex flex-col"
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{selectedTask.title}</h4>
                        <p className="text-[11px] text-muted-foreground">Task Output</p>
                      </div>
                      <div className="flex items-center gap-1">
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
                    <ScrollArea className="flex-1 px-5 py-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:text-muted-foreground">
                        <ReactMarkdown>{selectedTask.output || ''}</ReactMarkdown>
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
