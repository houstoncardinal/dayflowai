import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  Target,
  Layers,
  GitBranch,
  ArrowRight,
  Sparkles,
  Clock,
  Activity,
  Search,
  FileText,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// =====================================================
// TYPES
// =====================================================

export type ThinkingPhase = 
  | 'initializing'
  | 'context_gathering'
  | 'reasoning'
  | 'planning'
  | 'executing'
  | 'synthesizing'
  | 'quality_check'
  | 'complete'
  | 'error';

export interface ThinkingStep {
  id: string;
  phase: ThinkingPhase;
  label: string;
  detail?: string;
  duration?: number;
  tokens?: number;
  status: 'pending' | 'active' | 'done' | 'error';
  children?: ThinkingStep[];
  reasoning?: string;
  algorithm?: string;
  confidence?: number;
}

export interface ExecutionEvent {
  timestamp: number;
  type: 'phase_start' | 'phase_end' | 'token' | 'reasoning' | 'decision' | 'tool_call' | 'result';
  phase: ThinkingPhase;
  data?: any;
  message?: string;
}

// =====================================================
// PHASE CONFIG
// =====================================================

const PHASE_CONFIG: Record<ThinkingPhase, { 
  icon: typeof Brain; 
  label: string; 
  color: string;
  description: string;
}> = {
  initializing: { 
    icon: Cpu, 
    label: 'Initializing', 
    color: 'text-muted-foreground',
    description: 'Bootstrapping agent context'
  },
  context_gathering: { 
    icon: Search, 
    label: 'Gathering Context', 
    color: 'text-event-teal',
    description: 'Scanning calendar & task data'
  },
  reasoning: { 
    icon: Brain, 
    label: 'Reasoning', 
    color: 'text-event-violet',
    description: 'Chain-of-thought analysis'
  },
  planning: { 
    icon: Target, 
    label: 'Planning', 
    color: 'text-event-amber',
    description: 'Building execution strategy'
  },
  executing: { 
    icon: Zap, 
    label: 'Executing', 
    color: 'text-primary',
    description: 'Running agent tools'
  },
  synthesizing: { 
    icon: Layers, 
    label: 'Synthesizing', 
    color: 'text-event-emerald',
    description: 'Combining results'
  },
  quality_check: { 
    icon: Eye, 
    label: 'Quality Check', 
    color: 'text-event-coral',
    description: 'Validating output quality'
  },
  complete: { 
    icon: CheckCircle2, 
    label: 'Complete', 
    color: 'text-event-emerald',
    description: 'Task finished'
  },
  error: { 
    icon: AlertCircle, 
    label: 'Error', 
    color: 'text-destructive',
    description: 'Something went wrong'
  },
};

const AGENT_TYPE_ICONS: Record<string, typeof Brain> = {
  preparation: FileText,
  'follow-up': MessageSquare,
  scheduling: Calendar,
  research: Search,
  communication: MessageSquare,
  documentation: FileText,
};

// =====================================================
// ALGORITHM SIMULATION ENGINE
// This generates realistic thinking steps from AI task data
// =====================================================

export function generateThinkingPipeline(
  taskType: string, 
  taskTitle: string,
  eventTitle?: string
): ThinkingStep[] {
  const id = () => `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  const contextSteps: ThinkingStep[] = [
    {
      id: id(),
      phase: 'context_gathering',
      label: 'Load calendar events',
      detail: 'Fetching upcoming events within 7-day window',
      status: 'pending',
      algorithm: 'Binary search on sorted event dates, O(log n)',
    },
    {
      id: id(),
      phase: 'context_gathering',
      label: 'Extract task metadata',
      detail: eventTitle 
        ? `Analyzing "${eventTitle}" — attendees, timing, dependencies`
        : 'Scanning task context and dependencies',
      status: 'pending',
      algorithm: 'Graph traversal for dependency mapping',
    },
  ];

  const reasoningSteps: ThinkingStep[] = [];
  
  switch (taskType) {
    case 'preparation':
      reasoningSteps.push(
        {
          id: id(),
          phase: 'reasoning',
          label: 'Classify meeting type',
          detail: 'Determining optimal agenda structure',
          status: 'pending',
          algorithm: 'Multi-label classification with confidence scoring',
          reasoning: 'Analyzing title, description, and attendee patterns to select from 8 meeting archetypes',
        },
        {
          id: id(),
          phase: 'reasoning',
          label: 'Estimate time allocation',
          detail: 'Balancing agenda items by priority weight',
          status: 'pending',
          algorithm: 'Weighted knapsack optimization — maximize coverage within time budget',
          confidence: 0.87,
        },
        {
          id: id(),
          phase: 'planning',
          label: 'Structure agenda flow',
          detail: 'Ordering items for optimal energy and engagement',
          status: 'pending',
          algorithm: 'Topological sort with energy-curve heuristic',
        }
      );
      break;
    case 'follow-up':
      reasoningSteps.push(
        {
          id: id(),
          phase: 'reasoning',
          label: 'Extract action items',
          detail: 'Parsing meeting context for commitments and next steps',
          status: 'pending',
          algorithm: 'Named entity recognition + intent classification',
          reasoning: 'Identifying WHO needs to do WHAT by WHEN',
        },
        {
          id: id(),
          phase: 'reasoning',
          label: 'Prioritize follow-ups',
          detail: 'Scoring urgency × impact for each action item',
          status: 'pending',
          algorithm: 'Eisenhower matrix scoring: urgency(0-1) × importance(0-1)',
          confidence: 0.92,
        },
        {
          id: id(),
          phase: 'planning',
          label: 'Draft communication',
          detail: 'Selecting tone and structure based on recipient analysis',
          status: 'pending',
          algorithm: 'Template selection with dynamic context injection',
        }
      );
      break;
    case 'research':
      reasoningSteps.push(
        {
          id: id(),
          phase: 'reasoning',
          label: 'Identify research scope',
          detail: 'Determining what information is most valuable',
          status: 'pending',
          algorithm: 'Information gain maximization',
          reasoning: 'Balancing breadth vs depth based on time constraints',
        },
        {
          id: id(),
          phase: 'reasoning',
          label: 'Synthesize findings',
          detail: 'Cross-referencing data points for coherent brief',
          status: 'pending',
          algorithm: 'Hierarchical clustering of related insights',
          confidence: 0.85,
        },
        {
          id: id(),
          phase: 'planning',
          label: 'Structure deliverable',
          detail: 'Organizing research into actionable format',
          status: 'pending',
          algorithm: 'Pyramid principle — lead with conclusions',
        }
      );
      break;
    case 'scheduling':
      reasoningSteps.push(
        {
          id: id(),
          phase: 'reasoning',
          label: 'Analyze schedule patterns',
          detail: 'Detecting meeting clusters, gaps, and conflicts',
          status: 'pending',
          algorithm: 'Interval scheduling with gap detection, O(n log n)',
          reasoning: 'Sorting events by start time, scanning for overlaps and sub-optimal spacing',
        },
        {
          id: id(),
          phase: 'reasoning',
          label: 'Calculate health scores',
          detail: 'Multi-dimensional schedule quality assessment',
          status: 'pending',
          algorithm: 'Weighted scoring: focus_time(0.3) + meeting_load(0.25) + balance(0.25) + buffer(0.2)',
          confidence: 0.91,
        },
        {
          id: id(),
          phase: 'planning',
          label: 'Generate optimizations',
          detail: 'Finding improvements with highest impact/effort ratio',
          status: 'pending',
          algorithm: 'Pareto frontier analysis — effort vs impact',
        }
      );
      break;
    case 'communication':
      reasoningSteps.push(
        {
          id: id(),
          phase: 'reasoning',
          label: 'Analyze recipient context',
          detail: 'Determining relationship, preferences, and priorities',
          status: 'pending',
          algorithm: 'Stakeholder profiling with communication style matching',
        },
        {
          id: id(),
          phase: 'planning',
          label: 'Select channel & tone',
          detail: 'Optimizing delivery for maximum impact',
          status: 'pending',
          algorithm: 'Decision tree: urgency → formality → channel selection',
          confidence: 0.89,
        }
      );
      break;
    case 'documentation':
      reasoningSteps.push(
        {
          id: id(),
          phase: 'reasoning',
          label: 'Determine document type',
          detail: 'Matching format to audience and purpose',
          status: 'pending',
          algorithm: 'Template classification with audience analysis',
        },
        {
          id: id(),
          phase: 'planning',
          label: 'Build document structure',
          detail: 'Organizing sections for readability and completeness',
          status: 'pending',
          algorithm: 'Information architecture — progressive disclosure pattern',
          confidence: 0.88,
        }
      );
      break;
  }

  const executionSteps: ThinkingStep[] = [
    {
      id: id(),
      phase: 'executing',
      label: 'Call AI model',
      detail: 'GPT-4o with structured tool calling',
      status: 'pending',
      algorithm: 'Function calling with JSON schema enforcement',
    },
    {
      id: id(),
      phase: 'synthesizing',
      label: 'Parse & format output',
      detail: 'Converting tool response to structured markdown',
      status: 'pending',
    },
    {
      id: id(),
      phase: 'quality_check',
      label: 'Validate completeness',
      detail: 'Checking all required sections are present',
      status: 'pending',
      algorithm: 'Schema validation + content coverage scoring',
      confidence: 0.95,
    },
  ];

  return [
    { id: id(), phase: 'initializing', label: 'Initialize agent', detail: `Activating ${taskType} agent`, status: 'pending' },
    ...contextSteps,
    ...reasoningSteps,
    ...executionSteps,
    { id: id(), phase: 'complete', label: 'Task complete', status: 'pending' },
  ];
}

// =====================================================
// COMPONENTS
// =====================================================

interface ThinkingStepRowProps {
  step: ThinkingStep;
  index: number;
  isLast: boolean;
  showAlgorithm: boolean;
}

const ThinkingStepRow = memo(function ThinkingStepRow({ step, index, isLast, showAlgorithm }: ThinkingStepRowProps) {
  const config = PHASE_CONFIG[step.phase];
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(false);
  const hasDetails = step.algorithm || step.reasoning || step.confidence;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="relative"
    >
      {/* Connector line */}
      {!isLast && (
        <div className={cn(
          "absolute left-[15px] top-[32px] w-px h-[calc(100%-8px)]",
          step.status === 'done' ? 'bg-event-emerald/40' : 'bg-border'
        )} />
      )}
      
      <div 
        className={cn(
          "flex items-start gap-3 py-2 px-2 rounded-lg transition-colors cursor-pointer",
          step.status === 'active' && "bg-primary/5",
          hasDetails && "hover:bg-muted/50"
        )}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        {/* Status indicator */}
        <div className={cn(
          "relative h-[30px] w-[30px] rounded-lg flex items-center justify-center shrink-0 border transition-all",
          step.status === 'done' && "bg-event-emerald/10 border-event-emerald/30",
          step.status === 'active' && "bg-primary/10 border-primary/30",
          step.status === 'error' && "bg-destructive/10 border-destructive/30",
          step.status === 'pending' && "bg-muted/50 border-border"
        )}>
          {step.status === 'active' ? (
            <Loader2 className={cn("h-3.5 w-3.5 animate-spin", config.color)} />
          ) : step.status === 'done' ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-event-emerald" />
          ) : step.status === 'error' ? (
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          
          {step.status === 'active' && (
            <motion.div
              className="absolute inset-0 rounded-lg border border-primary/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium",
              step.status === 'active' && "text-foreground",
              step.status === 'done' && "text-muted-foreground",
              step.status === 'pending' && "text-muted-foreground/60",
              step.status === 'error' && "text-destructive"
            )}>
              {step.label}
            </span>
            
            {step.confidence && step.status === 'done' && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-event-emerald/30 text-event-emerald">
                {Math.round(step.confidence * 100)}%
              </Badge>
            )}
            
            {step.tokens && (
              <span className="text-[9px] text-muted-foreground tabular-nums">
                {step.tokens} tok
              </span>
            )}
            
            {step.duration && step.status === 'done' && (
              <span className="text-[9px] text-muted-foreground tabular-nums ml-auto">
                {step.duration}ms
              </span>
            )}
            
            {hasDetails && (
              <span className="ml-auto">
                {expanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            )}
          </div>
          
          {step.detail && (
            <p className={cn(
              "text-[11px] mt-0.5 leading-relaxed",
              step.status === 'active' ? "text-muted-foreground" : "text-muted-foreground/60"
            )}>
              {step.detail}
            </p>
          )}
          
          {/* Expanded algorithm/reasoning detail */}
          <AnimatePresence>
            {expanded && hasDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5 p-2.5 rounded-md bg-muted/50 border border-border">
                  {step.algorithm && (
                    <div className="flex items-start gap-1.5">
                      <Cpu className="h-3 w-3 text-event-violet mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-semibold text-event-violet uppercase tracking-wider">Algorithm</span>
                        <p className="text-[11px] text-foreground/80 font-mono leading-relaxed">{step.algorithm}</p>
                      </div>
                    </div>
                  )}
                  {step.reasoning && (
                    <div className="flex items-start gap-1.5">
                      <Brain className="h-3 w-3 text-event-teal mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-semibold text-event-teal uppercase tracking-wider">Reasoning</span>
                        <p className="text-[11px] text-foreground/80 leading-relaxed">{step.reasoning}</p>
                      </div>
                    </div>
                  )}
                  {step.confidence && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-muted-foreground">Confidence</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-event-emerald rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${step.confidence * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-event-emerald tabular-nums">
                        {Math.round(step.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

// =====================================================
// LIVE EXECUTION VISUALIZER
// =====================================================

interface LiveTokenStreamProps {
  tokens: string[];
  isStreaming: boolean;
}

const LiveTokenStream = memo(function LiveTokenStream({ tokens, isStreaming }: LiveTokenStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [tokens]);
  
  if (tokens.length === 0) return null;
  
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="mt-2 rounded-lg border border-primary/20 bg-primary/5 overflow-hidden"
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-primary/10 bg-primary/5">
        <Activity className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Live Output</span>
        {isStreaming && (
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-event-emerald ml-auto"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      <div 
        ref={containerRef}
        className="px-3 py-2 max-h-24 overflow-y-auto text-[11px] font-mono text-foreground/80 leading-relaxed"
      >
        {tokens.map((token, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            {token}
          </motion.span>
        ))}
        {isStreaming && (
          <motion.span
            className="inline-block w-1.5 h-3.5 bg-primary/60 ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
});

// =====================================================
// MAIN COMPONENT
// =====================================================

interface AgentThinkingVisualizerProps {
  steps: ThinkingStep[];
  currentPhase: ThinkingPhase;
  agentType: string;
  agentIcon: string;
  taskTitle: string;
  elapsedMs: number;
  totalTokens: number;
  liveTokens?: string[];
  isStreaming?: boolean;
  compact?: boolean;
}

export const AgentThinkingVisualizer = memo(function AgentThinkingVisualizer({
  steps,
  currentPhase,
  agentType,
  agentIcon,
  taskTitle,
  elapsedMs,
  totalTokens,
  liveTokens = [],
  isStreaming = false,
  compact = false,
}: AgentThinkingVisualizerProps) {
  const completedSteps = steps.filter(s => s.status === 'done').length;
  const progress = (completedSteps / steps.length) * 100;
  const config = PHASE_CONFIG[currentPhase];
  const PhaseIcon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.span 
              className="text-xl"
              animate={currentPhase !== 'complete' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {agentIcon}
            </motion.span>
            <div>
              <p className="text-xs font-semibold">{taskTitle}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <PhaseIcon className={cn("h-3 w-3", config.color)} />
                <span className={cn("text-[10px] font-medium", config.color)}>
                  {config.label}
                </span>
                <span className="text-[10px] text-muted-foreground">— {config.description}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground tabular-nums">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(elapsedMs / 1000).toFixed(1)}s
            </span>
            {totalTokens > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {totalTokens}
              </span>
            )}
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-2.5 flex items-center gap-2">
          <Progress value={progress} className="h-1 flex-1" />
          <span className="text-[10px] text-muted-foreground tabular-nums">{completedSteps}/{steps.length}</span>
        </div>
      </div>
      
      {/* Steps */}
      <div className={cn("px-3 py-2", compact ? "max-h-48" : "max-h-72", "overflow-y-auto")}>
        {steps.map((step, i) => (
          <ThinkingStepRow
            key={step.id}
            step={step}
            index={i}
            isLast={i === steps.length - 1}
            showAlgorithm={!compact}
          />
        ))}
      </div>
      
      {/* Live token stream */}
      {liveTokens.length > 0 && (
        <div className="px-3 pb-3">
          <LiveTokenStream tokens={liveTokens} isStreaming={isStreaming} />
        </div>
      )}
    </motion.div>
  );
});

// =====================================================
// MINI PHASE INDICATOR (for inline use in task cards)
// =====================================================

interface PhaseIndicatorProps {
  phase: ThinkingPhase;
  className?: string;
}

export const PhaseIndicator = memo(function PhaseIndicator({ phase, className }: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {phase !== 'complete' && phase !== 'error' ? (
        <Loader2 className={cn("h-3 w-3 animate-spin", config.color)} />
      ) : (
        <Icon className={cn("h-3 w-3", config.color)} />
      )}
      <span className={cn("text-[10px] font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  );
});
