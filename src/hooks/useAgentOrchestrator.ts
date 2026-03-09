import { useState, useCallback, useRef } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { 
  AutomationTask, 
  AgentType,
  AGENT_DEFINITIONS 
} from '@/types/agent';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const analyzeSchedule = useCallback(async () => {
    setIsOrchestrating(true);
    
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
      return result.data;
    } catch (error) {
      console.error('Schedule analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not analyze schedule',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsOrchestrating(false);
    }
  }, [events]);

  const planOrchestration = useCallback(async (taskDescription: string): Promise<OrchestrationPlan | null> => {
    setIsOrchestrating(true);
    
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
      toast({
        title: 'Planning Failed',
        description: error instanceof Error ? error.message : 'Could not create execution plan',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsOrchestrating(false);
    }
  }, [events]);

  const runWorkItem = useCallback(async (workItem: AgentWorkItem): Promise<AgentWorkItem> => {
    setAgents(prev => prev.map(a => 
      a.type === workItem.agentType 
        ? { ...a, status: 'working', currentTask: workItem.task }
        : a
    ));

    setWorkQueue(prev => prev.map(w => 
      w.id === workItem.id 
        ? { ...w, status: 'running', startedAt: new Date() }
        : w
    ));

    try {
      const result = await executeTask(workItem.task);
      
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
  }, [executeTask]);

  const executeOrchestration = useCallback(async () => {
    if (!currentPlan || workQueue.length === 0) return;
    
    setIsOrchestrating(true);
    abortControllerRef.current = new AbortController();

    const pendingItems = workQueue.filter(w => w.status === 'queued');
    
    for (const item of pendingItems) {
      if (abortControllerRef.current?.signal.aborted) break;
      await runWorkItem(item);
      await new Promise(r => setTimeout(r, 800));
    }

    setAgents(prev => prev.map(a => ({ ...a, status: 'idle', currentTask: undefined })));
    setIsOrchestrating(false);

    toast({
      title: 'Orchestration Complete',
      description: `${pendingItems.length} tasks executed by AI agents`,
    });
  }, [currentPlan, workQueue, runWorkItem]);

  const cancelOrchestration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsOrchestrating(false);
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle', currentTask: undefined })));
  }, []);

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
        support: ['research'], 
        example: 'Research provides context → Comms crafts message'
      },
      'documentation': { 
        support: ['research'], 
        example: 'Research gathers data → Docs creates structure'
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
    analyzeSchedule,
    planOrchestration,
    executeOrchestration,
    cancelOrchestration,
    getCollaborationFor,
  };
}
