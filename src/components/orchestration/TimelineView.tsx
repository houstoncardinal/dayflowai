import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { AgentWorkItem } from '@/hooks/useAgentOrchestrator';
import { AgentType, AGENT_DEFINITIONS } from '@/types/agent';
import { cn } from '@/lib/utils';

interface TimelineViewProps {
  waves: AgentWorkItem[][];
  currentWaveIndex?: number;
}

function parseEstimatedTime(timeStr?: string): number {
  if (!timeStr) return 2; // default 2 minutes
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2;
}

function getAgentIcon(type: AgentType): string {
  const def = AGENT_DEFINITIONS.find(d => d.type === type);
  return def?.icon || '🤖';
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

export function TimelineView({ waves, currentWaveIndex }: TimelineViewProps) {
  // Calculate cumulative times for each wave
  const timeline = useMemo(() => {
    let cumulativeTime = 0;
    
    return waves.map((wave, index) => {
      const startTime = cumulativeTime;
      // For parallel execution, wave duration is the max task duration
      const waveDuration = Math.max(...wave.map(w => parseEstimatedTime(w.task.estimatedTime)));
      cumulativeTime += waveDuration;
      
      return {
        wave,
        waveIndex: index,
        startTime,
        endTime: cumulativeTime,
        duration: waveDuration,
        status: getWaveStatus(wave),
      };
    });
  }, [waves]);

  const totalTime = timeline.length > 0 ? timeline[timeline.length - 1].endTime : 0;

  if (waves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No timeline to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium">Execution Timeline</span>
        </div>
        <span className="text-muted-foreground">
          Est. total: {totalTime} min
        </span>
      </div>

      {/* Timeline Bar */}
      <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
        {timeline.map((entry, i) => {
          const leftPercent = (entry.startTime / totalTime) * 100;
          const widthPercent = (entry.duration / totalTime) * 100;
          
          return (
            <motion.div
              key={i}
              className={cn(
                "absolute top-0 bottom-0 flex items-center justify-center border-r border-background/50",
                entry.status === 'completed' && "bg-event-emerald/40",
                entry.status === 'running' && "bg-event-amber/40",
                entry.status === 'failed' && "bg-destructive/40",
                entry.status === 'pending' && "bg-muted/50"
              )}
              style={{ 
                left: `${leftPercent}%`, 
                width: `${widthPercent}%`,
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <div className="flex items-center gap-0.5">
                {entry.wave.slice(0, 3).map((item, j) => (
                  <span key={j} className="text-xs">
                    {getAgentIcon(item.agentType)}
                  </span>
                ))}
                {entry.wave.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{entry.wave.length - 3}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
        
        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-0.5 text-[9px] text-muted-foreground">
          <span>0m</span>
          <span>{Math.round(totalTime / 2)}m</span>
          <span>{totalTime}m</span>
        </div>
      </div>

      {/* Wave Details */}
      <div className="space-y-2">
        {timeline.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg border transition-all",
              entry.status === 'running' && "border-event-amber bg-event-amber/5",
              entry.status === 'completed' && "border-event-emerald/50 bg-event-emerald/5",
              entry.status === 'failed' && "border-destructive/50 bg-destructive/5",
              entry.status === 'pending' && "border-border bg-muted/20"
            )}
          >
            {/* Wave number */}
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
              entry.status === 'completed' && "bg-event-emerald/20 text-event-emerald",
              entry.status === 'running' && "bg-event-amber/20 text-event-amber",
              entry.status === 'failed' && "bg-destructive/20 text-destructive",
              entry.status === 'pending' && "bg-muted text-muted-foreground"
            )}>
              {entry.status === 'completed' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : entry.status === 'running' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : entry.status === 'failed' ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </div>

            {/* Wave info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {entry.wave.map((item, j) => (
                  <span key={j} className="text-sm" title={item.task.title}>
                    {getAgentIcon(item.agentType)}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {entry.wave.map(w => w.task.title).join(' • ')}
              </p>
            </div>

            {/* Time info */}
            <div className="text-right text-xs">
              <p className="font-medium">{entry.duration}m</p>
              <p className="text-[10px] text-muted-foreground">
                {entry.startTime}–{entry.endTime}m
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
        <span className="text-muted-foreground">
          {waves.length} waves • {waves.reduce((acc, w) => acc + w.length, 0)} total tasks
        </span>
        <span className="font-medium text-primary">
          ~{totalTime} min saved with parallel execution
        </span>
      </div>
    </div>
  );
}
