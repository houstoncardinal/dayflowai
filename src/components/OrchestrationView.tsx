import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Users, 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { AgentWorkItem, OrchestrationPlan } from '@/hooks/useAgentOrchestrator';
import { Agent, AgentType, AGENT_DEFINITIONS } from '@/types/agent';
import { cn } from '@/lib/utils';

interface OrchestrationViewProps {
  plan: OrchestrationPlan | null;
  workQueue: AgentWorkItem[];
  agents: Agent[];
  isOrchestrating: boolean;
  onExecute: () => void;
  onCancel: () => void;
  onPlanNew: (task: string) => void;
}

// Group work items into parallel execution waves
function groupIntoWaves(workItems: AgentWorkItem[]): AgentWorkItem[][] {
  if (workItems.length === 0) return [];
  
  // Simple grouping: items with same priority can run in parallel
  const waves: AgentWorkItem[][] = [];
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  
  const sorted = [...workItems].sort((a, b) => {
    const aPriority = priorityOrder[a.task.priority] ?? 2;
    const bPriority = priorityOrder[b.task.priority] ?? 2;
    return aPriority - bPriority;
  });

  let currentWave: AgentWorkItem[] = [];
  let currentPriority = -1;

  sorted.forEach((item) => {
    const itemPriority = priorityOrder[item.task.priority] ?? 2;
    if (itemPriority !== currentPriority) {
      if (currentWave.length > 0) {
        waves.push(currentWave);
      }
      currentWave = [item];
      currentPriority = itemPriority;
    } else {
      currentWave.push(item);
    }
  });

  if (currentWave.length > 0) {
    waves.push(currentWave);
  }

  return waves;
}

function getAgentIcon(type: AgentType): string {
  const def = AGENT_DEFINITIONS.find(d => d.type === type);
  return def?.icon || '🤖';
}

function getAgentName(type: AgentType): string {
  const def = AGENT_DEFINITIONS.find(d => d.type === type);
  return def?.name || type;
}

function getStatusColor(status: AgentWorkItem['status']) {
  switch (status) {
    case 'completed': return 'bg-event-emerald/20 text-event-emerald border-event-emerald/30';
    case 'running': return 'bg-event-amber/20 text-event-amber border-event-amber/30';
    case 'failed': return 'bg-destructive/20 text-destructive border-destructive/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function getStatusIcon(status: AgentWorkItem['status']) {
  switch (status) {
    case 'completed': return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'running': return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case 'failed': return <AlertCircle className="h-3.5 w-3.5" />;
    default: return <Clock className="h-3.5 w-3.5" />;
  }
}

export function OrchestrationView({
  plan,
  workQueue,
  agents,
  isOrchestrating,
  onExecute,
  onCancel,
  onPlanNew,
}: OrchestrationViewProps) {
  const [newTaskInput, setNewTaskInput] = useState('');
  const waves = groupIntoWaves(workQueue);
  
  const completedCount = workQueue.filter(w => w.status === 'completed').length;
  const totalCount = workQueue.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const activeAgents = agents.filter(a => a.status === 'working');

  const handlePlanNew = () => {
    if (newTaskInput.trim()) {
      onPlanNew(newTaskInput.trim());
      setNewTaskInput('');
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Agent Orchestration</CardTitle>
              <CardDescription>Parallel execution waves & coordination</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOrchestrating ? (
              <Button variant="destructive" size="sm" onClick={onCancel}>
                <Pause className="h-4 w-4 mr-1" />
                Stop
              </Button>
            ) : workQueue.length > 0 && completedCount < totalCount ? (
              <Button size="sm" onClick={onExecute}>
                <Play className="h-4 w-4 mr-1" />
                Execute Plan
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* New Task Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlanNew()}
            placeholder="Describe a complex task to orchestrate..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button onClick={handlePlanNew} disabled={!newTaskInput.trim() || isOrchestrating}>
            <Zap className="h-4 w-4 mr-1" />
            Plan
          </Button>
        </div>

        {/* Active Agents */}
        {activeAgents.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Active Agents:</span>
            <div className="flex gap-1">
              {activeAgents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-xs"
                >
                  <span>{agent.icon}</span>
                  <span>{agent.name}</span>
                  <Loader2 className="h-3 w-3 animate-spin" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Execution Progress</span>
              <span className="font-medium">{completedCount}/{totalCount} tasks</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Plan Summary */}
        {plan && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-primary" />
              Expected Outcome
            </div>
            <p className="text-sm text-muted-foreground">{plan.expectedOutcome || 'Multi-agent task execution'}</p>
            
            {plan.humanCheckpoints.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="text-xs text-event-amber">
                  ⚠️ Human checkpoints: {plan.humanCheckpoints.join(', ')}
                </div>
              </>
            )}
          </div>
        )}

        {/* Execution Waves */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {waves.map((wave, waveIndex) => (
                <motion.div
                  key={`wave-${waveIndex}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: waveIndex * 0.1 }}
                  className="relative"
                >
                  {/* Wave Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                      {waveIndex + 1}
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                    <Badge variant="outline" className="text-xs">
                      Wave {waveIndex + 1} • {wave.length} parallel task{wave.length > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Wave Tasks */}
                  <div className="grid gap-2 ml-11">
                    {wave.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: waveIndex * 0.1 + itemIndex * 0.05 }}
                        className={cn(
                          "p-3 rounded-lg border transition-all",
                          item.status === 'running' && "ring-2 ring-primary/50",
                          item.status === 'completed' && "opacity-75",
                          getStatusColor(item.status)
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <span className="text-lg" role="img" aria-label={item.agentType}>
                              {getAgentIcon(item.agentType)}
                            </span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {getAgentName(item.agentType)}
                                </span>
                                  <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px] px-1.5 py-0",
                                    item.task.priority === 'high' && "border-event-amber/50 text-event-amber",
                                    item.task.priority === 'critical' && "border-destructive/50 text-destructive"
                                  )}
                                >
                                  {item.task.priority}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{item.task.title}</p>
                              {item.task.estimatedTime && (
                                <p className="text-xs text-muted-foreground">
                                  Est. {item.task.estimatedTime}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                          </div>
                        </div>

                        {/* Result Preview */}
                        {item.status === 'completed' && item.result && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-2 pt-2 border-t border-border/50"
                          >
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              ✓ {typeof item.result === 'string' 
                                ? item.result 
                                : item.result.summary || 'Task completed successfully'}
                            </p>
                          </motion.div>
                        )}

                        {/* Error Display */}
                        {item.status === 'failed' && item.error && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-2 pt-2 border-t border-destructive/20"
                          >
                            <p className="text-xs text-destructive">
                              ✕ {item.error}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Connection Arrow */}
                  {waveIndex < waves.length - 1 && (
                    <div className="flex justify-center my-3">
                      <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {waves.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <GitBranch className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Orchestration Plan</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Enter a complex task above to create an orchestrated execution plan with parallel agent waves.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Coordination Notes */}
        {plan?.coordinationNotes && (
          <div className="p-3 rounded-lg bg-event-teal/5 border border-event-teal/20">
            <div className="flex items-center gap-2 text-xs font-medium text-event-teal mb-1">
              <Users className="h-3.5 w-3.5" />
              Coordination Notes
            </div>
            <p className="text-xs text-muted-foreground">{plan.coordinationNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
