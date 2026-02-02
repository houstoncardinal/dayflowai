import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Zap, 
  Users, 
  GitBranch, 
  Clock,
  Loader2,
  Network,
  Timer,
  GripVertical
} from 'lucide-react';
import { AgentWorkItem, OrchestrationPlan } from '@/hooks/useAgentOrchestrator';
import { Agent, AgentType } from '@/types/agent';
import { cn } from '@/lib/utils';
import { AgentDependencyGraph, TimelineView, DraggableWaveList } from './orchestration';

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
  
  const waves: AgentWorkItem[][] = [];
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  
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
  const [activeView, setActiveView] = useState<'waves' | 'timeline' | 'dependencies'>('waves');
  const [customWaves, setCustomWaves] = useState<AgentWorkItem[][] | null>(null);
  
  // Use custom wave order if set, otherwise use computed waves
  const computedWaves = groupIntoWaves(workQueue);
  const waves = customWaves || computedWaves;
  
  const completedCount = workQueue.filter(w => w.status === 'completed').length;
  const totalCount = workQueue.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const activeAgents = agents.filter(a => a.status === 'working');
  const activeAgentTypes = activeAgents.map(a => a.type);

  // Get highlight path for dependency graph based on current wave
  const currentWaveIndex = waves.findIndex(wave => 
    wave.some(item => item.status === 'running')
  );
  const highlightPath = currentWaveIndex >= 0 
    ? waves[currentWaveIndex].map(item => item.agentType)
    : [];

  const handlePlanNew = () => {
    if (newTaskInput.trim()) {
      onPlanNew(newTaskInput.trim());
      setNewTaskInput('');
      setCustomWaves(null); // Reset custom order when new plan is created
    }
  };

  const handleReorderWaves = useCallback((newWaves: AgentWorkItem[][]) => {
    setCustomWaves(newWaves);
  }, []);

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

        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="waves" className="text-xs gap-1">
              <GripVertical className="h-3 w-3" />
              Waves
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs gap-1">
              <Timer className="h-3 w-3" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="text-xs gap-1">
              <Network className="h-3 w-3" />
              Dependencies
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[350px] mt-4">
            <TabsContent value="waves" className="mt-0">
              <DraggableWaveList
                waves={waves}
                onReorder={handleReorderWaves}
                isOrchestrating={isOrchestrating}
              />
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <TimelineView 
                waves={waves}
                currentWaveIndex={currentWaveIndex >= 0 ? currentWaveIndex : undefined}
              />
            </TabsContent>

            <TabsContent value="dependencies" className="mt-0">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <AgentDependencyGraph
                    activeAgents={activeAgentTypes}
                    highlightPath={highlightPath}
                  />
                </div>
                
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

                {/* Handoff Explanation */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="text-xs font-medium mb-2">Agent Handoffs</h4>
                  <div className="space-y-1 text-[10px] text-muted-foreground">
                    <p>🔍 <strong>Research</strong> → 📋 Prep: Context & data</p>
                    <p>📋 <strong>Prep</strong> → 💬 Comms: Agendas & talking points</p>
                    <p>📝 <strong>Docs</strong> → ✉️ Follow-up: Meeting notes</p>
                    <p>✉️ <strong>Follow-up</strong> → 💬 Comms: Action items</p>
                    <p>📅 <strong>Schedule</strong> → 💬 Comms: Time slots</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Custom order indicator */}
        {customWaves && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-event-violet/5 border border-event-violet/20 text-xs">
            <span className="text-muted-foreground">Custom wave order active</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => setCustomWaves(null)}
            >
              Reset order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
