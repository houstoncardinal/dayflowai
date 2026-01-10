import { useState, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { 
  Agent, 
  AutomationTask, 
  ScheduleAnalysis, 
  ScheduleInsight,
  AgentType,
  AGENT_DEFINITIONS 
} from '@/types/agent';
import { format, parseISO, isToday, isTomorrow, isThisWeek, addDays } from 'date-fns';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export function useAgents(events: CalendarEvent[]) {
  const [agents, setAgents] = useState<Agent[]>(() => 
    AGENT_DEFINITIONS.map((def, i) => ({
      ...def,
      id: `agent-${i}`,
      status: 'idle',
      completedTasks: 0,
    }))
  );
  const [analysis, setAnalysis] = useState<ScheduleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const analyzeSchedule = useCallback(async (): Promise<ScheduleAnalysis> => {
    setIsAnalyzing(true);
    
    // Get upcoming events (next 7 days)
    const today = new Date();
    const upcomingEvents = events.filter(e => {
      const eventDate = parseISO(e.event_date);
      return eventDate >= today && eventDate <= addDays(today, 7);
    });

    const automatableTasks: AutomationTask[] = [];
    const humanRequiredTasks: AutomationTask[] = [];
    const insights: ScheduleInsight[] = [];

    // Analyze each event for automation opportunities
    upcomingEvents.forEach((event, index) => {
      const eventDate = parseISO(event.event_date);
      const isUpcoming = isToday(eventDate) || isTomorrow(eventDate);
      
      // Meeting prep - automatable
      if (event.title.toLowerCase().includes('meeting') || 
          event.title.toLowerCase().includes('call') ||
          event.title.toLowerCase().includes('sync')) {
        automatableTasks.push({
          id: `task-prep-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'preparation',
          title: `Prepare agenda for "${event.title}"`,
          description: `Generate meeting agenda, talking points, and relevant context`,
          automatable: true,
          humanRequired: false,
          priority: isUpcoming ? 'high' : 'medium',
          status: 'pending',
          estimatedTime: '2 min',
          dueDate: event.event_date,
          createdAt: new Date(),
        });

        // Follow-up task
        automatableTasks.push({
          id: `task-followup-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'follow-up',
          title: `Draft follow-up for "${event.title}"`,
          description: `Create follow-up email template with action items`,
          automatable: true,
          humanRequired: false,
          priority: 'medium',
          status: 'pending',
          estimatedTime: '1 min',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }

      // Interview or review - needs human
      if (event.title.toLowerCase().includes('interview') ||
          event.title.toLowerCase().includes('review') ||
          event.title.toLowerCase().includes('1:1')) {
        humanRequiredTasks.push({
          id: `task-human-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'preparation',
          title: `Personal preparation for "${event.title}"`,
          description: `Review notes and prepare personal talking points`,
          automatable: false,
          humanRequired: true,
          humanReason: 'Requires personal judgment and context that only you possess',
          priority: isUpcoming ? 'critical' : 'high',
          status: 'pending',
          estimatedTime: '15 min',
          dueDate: event.event_date,
          createdAt: new Date(),
        });

        // But research can be automated
        automatableTasks.push({
          id: `task-research-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'research',
          title: `Research background for "${event.title}"`,
          description: `Compile relevant information and context`,
          automatable: true,
          humanRequired: false,
          priority: isUpcoming ? 'high' : 'medium',
          status: 'pending',
          estimatedTime: '3 min',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }

      // Presentation or demo - partial automation
      if (event.title.toLowerCase().includes('presentation') ||
          event.title.toLowerCase().includes('demo')) {
        automatableTasks.push({
          id: `task-outline-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'documentation',
          title: `Create outline for "${event.title}"`,
          description: `Generate presentation structure and key points`,
          automatable: true,
          humanRequired: false,
          priority: 'high',
          status: 'pending',
          estimatedTime: '2 min',
          dueDate: event.event_date,
          createdAt: new Date(),
        });

        humanRequiredTasks.push({
          id: `task-rehearse-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'preparation',
          title: `Rehearse "${event.title}"`,
          description: `Practice delivery and timing`,
          automatable: false,
          humanRequired: true,
          humanReason: 'Physical practice and delivery cannot be automated',
          priority: isUpcoming ? 'critical' : 'high',
          status: 'pending',
          estimatedTime: '30 min',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }
    });

    // Generate insights
    if (upcomingEvents.length > 5) {
      insights.push({
        type: 'warning',
        title: 'Heavy schedule ahead',
        description: `You have ${upcomingEvents.length} events in the next 7 days. Consider delegating or rescheduling.`,
        actionable: true,
        suggestedAction: 'Review and prioritize your calendar',
      });
    }

    const todayEvents = upcomingEvents.filter(e => isToday(parseISO(e.event_date)));
    if (todayEvents.length > 3) {
      insights.push({
        type: 'optimization',
        title: 'Busy day today',
        description: `${todayEvents.length} events today. I've prioritized preparation tasks.`,
        actionable: false,
      });
    }

    if (automatableTasks.length > 0) {
      insights.push({
        type: 'opportunity',
        title: `${automatableTasks.length} tasks can be automated`,
        description: `Let AI agents handle routine preparation and follow-ups while you focus on what matters.`,
        actionable: true,
        suggestedAction: 'Run all automation tasks',
      });
    }

    // Detect meeting patterns
    const meetingCount = upcomingEvents.filter(e => 
      e.title.toLowerCase().includes('meeting') || e.title.toLowerCase().includes('call')
    ).length;
    if (meetingCount >= 3) {
      insights.push({
        type: 'pattern',
        title: 'Meeting-heavy week',
        description: `${meetingCount} meetings scheduled. Ensure you have buffer time for deep work.`,
        actionable: true,
        suggestedAction: 'Schedule focus blocks',
      });
    }

    const workloadScore = Math.min(100, (upcomingEvents.length * 10) + (humanRequiredTasks.length * 15));
    const automationPotential = automatableTasks.length > 0 
      ? Math.round((automatableTasks.length / (automatableTasks.length + humanRequiredTasks.length)) * 100)
      : 0;

    // Determine which agents are recommended
    const recommendedAgentTypes = new Set<AgentType>();
    automatableTasks.forEach(t => recommendedAgentTypes.add(t.type));
    
    const recommendedAgents = agents.filter(a => recommendedAgentTypes.has(a.type));

    const result: ScheduleAnalysis = {
      totalEvents: upcomingEvents.length,
      automatableTasks,
      humanRequiredTasks,
      insights,
      recommendedAgents,
      workloadScore,
      automationPotential,
    };

    setAnalysis(result);
    setIsAnalyzing(false);
    
    return result;
  }, [events, agents]);

  const runTask = useCallback(async (task: AutomationTask): Promise<string> => {
    if (!task.automatable) {
      throw new Error('This task requires human action');
    }

    setActiveTaskId(task.id);
    
    // Update agent status
    setAgents(prev => prev.map(a => 
      a.type === task.type 
        ? { ...a, status: 'working', currentTask: task }
        : a
    ));

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Execute this automation task: "${task.title}"\n\nContext: ${task.description}\n${task.eventTitle ? `For event: "${task.eventTitle}"` : ''}\n\nProvide actionable, ready-to-use output.`,
          }],
          events: events.slice(0, 50),
          action: 'automate',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute task');
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) result += content;
              } catch {}
            }
          }
        }
      }

      // Update task in analysis
      if (analysis) {
        setAnalysis({
          ...analysis,
          automatableTasks: analysis.automatableTasks.map(t =>
            t.id === task.id ? { ...t, status: 'completed', output: result } : t
          ),
        });
      }

      // Update agent
      setAgents(prev => prev.map(a => 
        a.type === task.type 
          ? { ...a, status: 'completed', currentTask: undefined, completedTasks: a.completedTasks + 1 }
          : a
      ));

      setActiveTaskId(null);
      return result;
    } catch (error) {
      setAgents(prev => prev.map(a => 
        a.type === task.type 
          ? { ...a, status: 'idle', currentTask: undefined }
          : a
      ));
      setActiveTaskId(null);
      throw error;
    }
  }, [analysis, events]);

  const runAllTasks = useCallback(async () => {
    if (!analysis) return;
    
    const pendingTasks = analysis.automatableTasks.filter(t => t.status === 'pending');
    
    for (const task of pendingTasks) {
      try {
        await runTask(task);
        // Small delay between tasks
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`Failed to run task ${task.id}:`, error);
      }
    }
  }, [analysis, runTask]);

  return {
    agents,
    analysis,
    isAnalyzing,
    activeTaskId,
    analyzeSchedule,
    runTask,
    runAllTasks,
  };
}
