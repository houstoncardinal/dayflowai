import { useState, useCallback, useRef } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { 
  Agent, 
  AutomationTask, 
  AgentType,
  AGENT_DEFINITIONS 
} from '@/types/agent';
import { toast } from '@/hooks/use-toast';
import { 
  ThinkingStep, 
  ThinkingPhase, 
  ExecutionEvent,
  generateThinkingPipeline 
} from '@/components/AgentThinkingVisualizer';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export interface AgentWorkItem {
  id: string;
  agentType: AgentType;
  task: AutomationTask;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface OrchestrationPlan {
  workItems: AgentWorkItem[];
  expectedOutcome: string;
  humanCheckpoints: string[];
  coordinationNotes: string;
}

export interface AgentCollaboration {
  leadAgent: AgentType;
  supportingAgents: AgentType[];
  task: string;
  output?: any;
}

// Execution visualization state
export interface ExecutionVisualization {
  taskId: string;
  agentType: AgentType;
  agentIcon: string;
  taskTitle: string;
  steps: ThinkingStep[];
  currentPhase: ThinkingPhase;
  startTime: number;
  elapsedMs: number;
  totalTokens: number;
  liveTokens: string[];
  isStreaming: boolean;
  events: ExecutionEvent[];
}

export function useAgentOrchestrator(events: CalendarEvent[]) {
  const [agents, setAgents] = useState<Agent[]>(() => 
    AGENT_DEFINITIONS.map((def, i) => ({
      ...def,
      id: `agent-${i}`,
      status: 'idle',
      completedTasks: 0,
    }))
  );
  
  const [workQueue, setWorkQueue] = useState<AgentWorkItem[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<OrchestrationPlan | null>(null);
  const [activeVisualization, setActiveVisualization] = useState<ExecutionVisualization | null>(null);
  const [visualizationHistory, setVisualizationHistory] = useState<ExecutionVisualization[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance thinking steps through the pipeline with realistic timing
  const runThinkingPipeline = useCallback(async (
    taskId: string,
    agentType: AgentType,
    taskTitle: string,
    eventTitle?: string
  ): Promise<void> => {
    const agentDef = AGENT_DEFINITIONS.find(d => d.type === agentType);
    const steps = generateThinkingPipeline(agentType, taskTitle, eventTitle);
    const startTime = Date.now();
    
    const viz: ExecutionVisualization = {
      taskId,
      agentType,
      agentIcon: agentDef?.icon || '🤖',
      taskTitle,
      steps,
      currentPhase: 'initializing',
      startTime,
      elapsedMs: 0,
      totalTokens: 0,
      liveTokens: [],
      isStreaming: false,
      events: [],
    };
    
    setActiveVisualization(viz);
    
    // Start elapsed time counter
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveVisualization(prev => prev ? {
        ...prev,
        elapsedMs: Date.now() - startTime
      } : null);
    }, 100);
    
    // Simulate stepping through phases before the actual API call
    const preApiSteps = steps.filter(s => 
      s.phase !== 'executing' && s.phase !== 'synthesizing' && 
      s.phase !== 'quality_check' && s.phase !== 'complete'
    );
    
    for (const step of preApiSteps) {
      // Set step to active
      setActiveVisualization(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentPhase: step.phase,
          steps: prev.steps.map(s => 
            s.id === step.id ? { ...s, status: 'active' as const } : s
          ),
          events: [...prev.events, {
            timestamp: Date.now(),
            type: 'phase_start' as const,
            phase: step.phase,
            message: step.label,
          }],
        };
      });
      
      // Realistic delay per phase type
      const delay = step.phase === 'initializing' ? 300 
        : step.phase === 'context_gathering' ? 400 + Math.random() * 200
        : step.phase === 'reasoning' ? 500 + Math.random() * 300
        : step.phase === 'planning' ? 400 + Math.random() * 200
        : 200;
      
      await new Promise(r => setTimeout(r, delay));
      
      // Set step to done
      setActiveVisualization(prev => {
        if (!prev) return null;
        return {
          ...prev,
          steps: prev.steps.map(s => 
            s.id === step.id ? { ...s, status: 'done' as const, duration: Math.round(delay) } : s
          ),
          events: [...prev.events, {
            timestamp: Date.now(),
            type: 'phase_end' as const,
            phase: step.phase,
            message: `${step.label} complete`,
          }],
        };
      });
    }
    
    // Mark executing phase as active
    setActiveVisualization(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentPhase: 'executing',
        isStreaming: true,
        steps: prev.steps.map(s => 
          s.phase === 'executing' ? { ...s, status: 'active' as const } : s
        ),
      };
    });
  }, []);

  // Complete the visualization pipeline after API call
  const completeThinkingPipeline = useCallback((success: boolean, tokenCount?: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setActiveVisualization(prev => {
      if (!prev) return null;
      
      const finalSteps = prev.steps.map(s => {
        if (s.status === 'active' || s.status === 'pending') {
          if (success) {
            return { ...s, status: 'done' as const, duration: Math.round(Math.random() * 200 + 100) };
          } else if (s.status === 'active') {
            return { ...s, status: 'error' as const };
          }
          return s;
        }
        return s;
      });
      
      const completed: ExecutionVisualization = {
        ...prev,
        steps: finalSteps,
        currentPhase: success ? 'complete' : 'error',
        isStreaming: false,
        elapsedMs: Date.now() - prev.startTime,
        totalTokens: tokenCount || prev.totalTokens,
      };
      
      // Add to history
      setVisualizationHistory(h => [completed, ...h].slice(0, 10));
      
      return completed;
    });
    
    // Clear active after a delay so user can see the complete state
    setTimeout(() => {
      setActiveVisualization(null);
    }, 2000);
  }, []);

  // Execute a single task with tool calling
  const executeTask = useCallback(async (task: AutomationTask): Promise<any> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [],
        events: events.slice(0, 30),
        action: 'execute_task',
        task: {
          id: task.id,
          type: task.type,
          title: task.title,
          eventId: task.eventId,
          eventTitle: task.eventTitle,
          context: task.description,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Task execution failed');
    }

    return response.json();
  }, [events]);

  // Analyze schedule with AI
  const analyzeSchedule = useCallback(async () => {
    setIsOrchestrating(true);
    
    // Run thinking visualization for analysis
    await runThinkingPipeline('analysis', 'scheduling', 'Analyze Schedule Health');
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [],
          events: events.slice(0, 50),
          action: 'analyze',
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      completeThinkingPipeline(true, result.usage?.total_tokens);
      return result.data;
    } catch (error) {
      console.error('Schedule analysis error:', error);
      completeThinkingPipeline(false);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not analyze schedule',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsOrchestrating(false);
    }
  }, [events, runThinkingPipeline, completeThinkingPipeline]);

  // Plan orchestrated execution for complex tasks
  const planOrchestration = useCallback(async (taskDescription: string): Promise<OrchestrationPlan | null> => {
    setIsOrchestrating(true);
    
    await runThinkingPipeline('plan', 'preparation', `Plan: ${taskDescription.slice(0, 50)}`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: taskDescription }],
          events: events.slice(0, 30),
          action: 'orchestrate',
          agentTeam: AGENT_DEFINITIONS.map(d => d.type),
        }),
      });

      if (!response.ok) {
        throw new Error('Orchestration planning failed');
      }

      const result = await response.json();
      completeThinkingPipeline(true, result.usage?.total_tokens);
      
      if (result.data?.task_breakdown) {
        const workItems: AgentWorkItem[] = result.data.task_breakdown.map((item: any, index: number) => ({
          id: `work-${Date.now()}-${index}`,
          agentType: item.agent_type,
          task: {
            id: `task-${Date.now()}-${index}`,
            type: item.agent_type,
            title: item.subtask,
            description: item.subtask,
            automatable: true,
            humanRequired: false,
            priority: item.priority === 1 ? 'high' : 'medium',
            status: 'pending',
            estimatedTime: item.estimated_time || '2 min',
            createdAt: new Date(),
          } as AutomationTask,
          status: 'queued' as const,
        }));

        const plan: OrchestrationPlan = {
          workItems,
          expectedOutcome: result.data.expected_outcome || '',
          humanCheckpoints: result.data.human_checkpoints || [],
          coordinationNotes: result.data.coordination_notes || '',
        };

        setCurrentPlan(plan);
        setWorkQueue(workItems);
        return plan;
      }
      
      return null;
    } catch (error) {
      console.error('Orchestration planning error:', error);
      completeThinkingPipeline(false);
      toast({
        title: 'Planning Failed',
        description: error instanceof Error ? error.message : 'Could not create execution plan',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsOrchestrating(false);
    }
  }, [events, runThinkingPipeline, completeThinkingPipeline]);

  // Run a single work item with visual feedback
  const runWorkItem = useCallback(async (workItem: AgentWorkItem): Promise<AgentWorkItem> => {
    // Update agent status
    setAgents(prev => prev.map(a => 
      a.type === workItem.agentType 
        ? { ...a, status: 'working', currentTask: workItem.task }
        : a
    ));

    // Update work item status
    setWorkQueue(prev => prev.map(w => 
      w.id === workItem.id 
        ? { ...w, status: 'running', startedAt: new Date() }
        : w
    ));

    // Start thinking visualization
    await runThinkingPipeline(
      workItem.id, 
      workItem.agentType, 
      workItem.task.title,
      workItem.task.eventTitle
    );

    try {
      const result = await executeTask(workItem.task);
      
      completeThinkingPipeline(true, result.usage?.total_tokens);
      
      const completedItem: AgentWorkItem = {
        ...workItem,
        status: 'completed',
        result: result.data,
        completedAt: new Date(),
      };

      setWorkQueue(prev => prev.map(w => 
        w.id === workItem.id ? completedItem : w
      ));

      setAgents(prev => prev.map(a => 
        a.type === workItem.agentType 
          ? { ...a, status: 'completed', currentTask: undefined, completedTasks: a.completedTasks + 1 }
          : a
      ));

      return completedItem;
    } catch (error) {
      completeThinkingPipeline(false);
      
      const failedItem: AgentWorkItem = {
        ...workItem,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      };

      setWorkQueue(prev => prev.map(w => 
        w.id === workItem.id ? failedItem : w
      ));

      setAgents(prev => prev.map(a => 
        a.type === workItem.agentType 
          ? { ...a, status: 'idle', currentTask: undefined }
          : a
      ));

      return failedItem;
    }
  }, [executeTask, runThinkingPipeline, completeThinkingPipeline]);

  // Execute the orchestration plan
  const executeOrchestration = useCallback(async () => {
    if (!currentPlan || workQueue.length === 0) return;
    
    setIsOrchestrating(true);
    abortControllerRef.current = new AbortController();

    const pendingItems = workQueue.filter(w => w.status === 'queued');
    
    for (const item of pendingItems) {
      if (abortControllerRef.current?.signal.aborted) break;
      
      await runWorkItem(item);
      
      // Small delay between agents for visual effect
      await new Promise(r => setTimeout(r, 800));
    }

    // Reset all agents to idle
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle', currentTask: undefined })));
    setIsOrchestrating(false);

    toast({
      title: 'Orchestration Complete',
      description: `${pendingItems.length} tasks executed by AI agents`,
    });
  }, [currentPlan, workQueue, runWorkItem]);

  // Cancel ongoing orchestration
  const cancelOrchestration = useCallback(() => {
    abortControllerRef.current?.abort();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsOrchestrating(false);
    setActiveVisualization(null);
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle', currentTask: undefined })));
  }, []);

  // Get collaboration recommendations
  const getCollaborationFor = useCallback((taskType: AgentType): AgentCollaboration => {
    const collaborations: Record<AgentType, { support: AgentType[], example: string }> = {
      'preparation': { 
        support: ['research', 'scheduling'], 
        example: 'Research gathers context → Schedule finds prep time → Prep creates agenda'
      },
      'follow-up': { 
        support: ['documentation', 'communication'], 
        example: 'Docs captures notes → Follow-up extracts actions → Comms sends update'
      },
      'scheduling': { 
        support: ['communication'], 
        example: 'Schedule finds optimal times → Comms sends invitations'
      },
      'research': { 
        support: ['documentation'], 
        example: 'Research compiles info → Docs structures the brief'
      },
      'communication': { 
        support: ['documentation'], 
        example: 'Comms drafts message → Docs archives for reference'
      },
      'documentation': { 
        support: ['follow-up'], 
        example: 'Docs creates notes → Follow-up generates action items'
      },
    };

    const collab = collaborations[taskType];
    return {
      leadAgent: taskType,
      supportingAgents: collab.support,
      task: collab.example,
    };
  }, []);

  return {
    agents,
    workQueue,
    currentPlan,
    isOrchestrating,
    activeVisualization,
    visualizationHistory,
    executeTask,
    analyzeSchedule,
    planOrchestration,
    executeOrchestration,
    runWorkItem,
    cancelOrchestration,
    getCollaborationFor,
  };
}
