import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Zap, 
  Users,
  Loader2,
  Network,
  Timer,
  GripVertical,
  AlertCircle
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
  
  const computedWaves = groupIntoWaves(workQueue);
  const waves = customWaves || computedWaves;
  
  const completedCount = workQueue.filter(w => w.status === 'completed').length;
  const totalCount = workQueue.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const activeAgents = agents.filter(a => a.status === 'working');
  const activeAgentTypes = activeAgents.map(a => a.type);

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
      setCustomWaves(null);
    }
  };

  const handleReorderWaves = useCallback((newWaves: AgentWorkItem[][]) => {
    setCustomWaves(newWaves);
  }, []);

  return (
    <div className="space-y-4">
      {/* Task Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePlanNew()}
          placeholder="Describe a complex task..."
          className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
        />
        <Button 
          onClick={handlePlanNew} 
          disabled={!newTaskInput.trim() || isOrchestrating}
          className="shrink-0"
        >
          <Zap className="h-4 w-4 mr-1.5" />
          Plan
        </Button>
      </div>

      {/* Active Agents Indicator */}
      {activeAgents.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-medium">Active:</span>
          <div className="flex gap-1 flex-wrap">
            {activeAgents.map((agent) => (
              <motion.div
                key={agent.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-border text-[11px]"
              >
                <span>{agent.icon}</span>
                <span className="hidden sm:inline">{agent.name}</span>
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium tabular-nums">{completedCount}/{totalCount}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Plan Summary */}
      {plan && (
        <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Expected Outcome</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {plan.expectedOutcome || 'Multi-agent task execution'}
          </p>
          
          {plan.humanCheckpoints.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex items-start gap-1.5 text-[11px] text-event-amber">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Checkpoints: {plan.humanCheckpoints.join(', ')}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Execute/Cancel Actions */}
      {workQueue.length > 0 && completedCount < totalCount && (
        <div className="flex gap-2">
          {isOrchestrating ? (
            <Button variant="destructive" size="sm" onClick={onCancel} className="flex-1">
              <Pause className="h-4 w-4 mr-1.5" />
              Stop Execution
            </Button>
          ) : (
            <Button size="sm" onClick={onExecute} className="flex-1">
              <Play className="h-4 w-4 mr-1.5" />
              Execute Plan
            </Button>
          )}
        </div>
      )}

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="waves" className="text-[11px] gap-1.5 data-[state=active]:shadow-sm">
            <GripVertical className="h-3 w-3" />
            <span>Waves</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-[11px] gap-1.5 data-[state=active]:shadow-sm">
            <Timer className="h-3 w-3" />
            <span>Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="text-[11px] gap-1.5 data-[state=active]:shadow-sm">
            <Network className="h-3 w-3" />
            <span>Graph</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-3">
          <TabsContent value="waves" className="mt-0 max-h-[280px] overflow-y-auto">
            <DraggableWaveList
              waves={waves}
              onReorder={handleReorderWaves}
              isOrchestrating={isOrchestrating}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0 max-h-[280px] overflow-y-auto">
            <TimelineView 
              waves={waves}
              currentWaveIndex={currentWaveIndex >= 0 ? currentWaveIndex : undefined}
            />
          </TabsContent>

          <TabsContent value="dependencies" className="mt-0 max-h-[280px] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-center py-2">
                <AgentDependencyGraph
                  activeAgents={activeAgentTypes}
                  highlightPath={highlightPath}
                  compact
                />
              </div>
              
              {plan?.coordinationNotes && (
                <div className="p-3 rounded-lg bg-event-teal/5 border border-event-teal/20">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-event-teal mb-1">
                    <Users className="h-3 w-3" />
                    Coordination
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{plan.coordinationNotes}</p>
                </div>
              )}

              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <h4 className="text-[11px] font-medium mb-2">Handoffs</h4>
                <div className="grid grid-cols-1 gap-1 text-[10px] text-muted-foreground">
                  <p>🔍 Research → 📋 Prep</p>
                  <p>📋 Prep → 💬 Comms</p>
                  <p>📝 Docs → ✉️ Follow-up</p>
                  <p>📅 Schedule → 💬 Comms</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Custom Order Indicator */}
      {customWaves && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border text-[11px]">
          <span className="text-muted-foreground">Custom order active</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[11px] px-2"
            onClick={() => setCustomWaves(null)}
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
