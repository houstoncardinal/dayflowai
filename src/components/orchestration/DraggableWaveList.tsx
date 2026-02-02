import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GripVertical, CheckCircle2, Clock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AgentWorkItem } from '@/hooks/useAgentOrchestrator';
import { AgentType, AGENT_DEFINITIONS } from '@/types/agent';
import { cn } from '@/lib/utils';

interface DraggableWaveListProps {
  waves: AgentWorkItem[][];
  onReorder: (newWaves: AgentWorkItem[][]) => void;
  isOrchestrating: boolean;
}

function getAgentIcon(type: AgentType): string {
  const def = AGENT_DEFINITIONS.find(d => d.type === type);
  return def?.icon || '🤖';
}

function getAgentName(type: AgentType): string {
  const def = AGENT_DEFINITIONS.find(d => d.type === type);
  return def?.name || type;
}

function getStatusIcon(status: AgentWorkItem['status']) {
  switch (status) {
    case 'completed': return <CheckCircle2 className="h-3.5 w-3.5 text-event-emerald" />;
    case 'running': return <Loader2 className="h-3.5 w-3.5 animate-spin text-event-amber" />;
    case 'failed': return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function getWaveStatus(wave: AgentWorkItem[]): 'pending' | 'running' | 'completed' | 'failed' {
  const hasRunning = wave.some(w => w.status === 'running');
  const allCompleted = wave.every(w => w.status === 'completed');
  const hasFailed = wave.some(w => w.status === 'failed');
  
  if (hasFailed) return 'failed';
  if (allCompleted) return 'completed';
  if (hasRunning) return 'running';
  return 'pending';
}

export function DraggableWaveList({ waves, onReorder, isOrchestrating }: DraggableWaveListProps) {
  const [expandedWave, setExpandedWave] = useState<number | null>(null);

  const handleReorder = useCallback((newOrder: AgentWorkItem[][]) => {
    if (!isOrchestrating) {
      onReorder(newOrder);
    }
  }, [isOrchestrating, onReorder]);

  if (waves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <GripVertical className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No waves to reorder</p>
        <p className="text-xs text-muted-foreground mt-1">Create an orchestration plan first</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instructions */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded-lg">
        <GripVertical className="h-4 w-4" />
        <span>Drag waves to reorder execution priority</span>
      </div>

      {/* Draggable Wave List */}
      <Reorder.Group 
        axis="y" 
        values={waves} 
        onReorder={handleReorder}
        className="space-y-2"
      >
        {waves.map((wave, waveIndex) => {
          const status = getWaveStatus(wave);
          const isExpanded = expandedWave === waveIndex;
          const canDrag = !isOrchestrating && status === 'pending';

          return (
            <Reorder.Item
              key={`wave-${waveIndex}`}
              value={wave}
              dragListener={canDrag}
              className={cn(
                "relative",
                !canDrag && "cursor-default"
              )}
            >
              <motion.div
                layout
                className={cn(
                  "rounded-lg border transition-all",
                  status === 'running' && "border-event-amber bg-event-amber/5 shadow-md",
                  status === 'completed' && "border-event-emerald/50 bg-event-emerald/5",
                  status === 'failed' && "border-destructive/50 bg-destructive/5",
                  status === 'pending' && "border-border bg-card hover:border-primary/50",
                  canDrag && "cursor-grab active:cursor-grabbing"
                )}
              >
                {/* Wave Header */}
                <div 
                  className="flex items-center gap-2 p-3"
                  onClick={() => setExpandedWave(isExpanded ? null : waveIndex)}
                >
                  {/* Drag Handle */}
                  {canDrag && (
                    <div className="text-muted-foreground hover:text-foreground transition-colors">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  )}

                  {/* Wave Number */}
                  <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm",
                    status === 'completed' && "bg-event-emerald/20 text-event-emerald",
                    status === 'running' && "bg-event-amber/20 text-event-amber",
                    status === 'failed' && "bg-destructive/20 text-destructive",
                    status === 'pending' && "bg-primary/20 text-primary"
                  )}>
                    {waveIndex + 1}
                  </div>

                  {/* Agent Icons */}
                  <div className="flex items-center gap-1 flex-1">
                    {wave.slice(0, 4).map((item, i) => (
                      <motion.span 
                        key={i} 
                        className="text-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {getAgentIcon(item.agentType)}
                      </motion.span>
                    ))}
                    {wave.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{wave.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Status & Info */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {wave.length} task{wave.length > 1 ? 's' : ''}
                    </Badge>
                    {status === 'completed' && <CheckCircle2 className="h-4 w-4 text-event-emerald" />}
                    {status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-event-amber" />}
                    {status === 'failed' && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>

                {/* Expanded Task List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
                        {wave.map((item, itemIndex) => (
                          <div 
                            key={item.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg text-sm",
                              item.status === 'completed' && "bg-event-emerald/10",
                              item.status === 'running' && "bg-event-amber/10",
                              item.status === 'failed' && "bg-destructive/10",
                              item.status === 'queued' && "bg-muted/30"
                            )}
                          >
                            <span className="text-base">{getAgentIcon(item.agentType)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.task.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {getAgentName(item.agentType)} • {item.task.estimatedTime || '2 min'}
                              </p>
                            </div>
                            {getStatusIcon(item.status)}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Arrow between waves */}
              {waveIndex < waves.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 rotate-90" />
                </div>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {/* Reorder notice */}
      {isOrchestrating && (
        <p className="text-xs text-muted-foreground text-center">
          Reordering disabled while orchestrating
        </p>
      )}
    </div>
  );
}
