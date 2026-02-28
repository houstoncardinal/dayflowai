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
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

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

  // AI-powered schedule analysis
  const analyzeSchedule = useCallback(async (): Promise<ScheduleAnalysis> => {
    setIsAnalyzing(true);
    
    const today = startOfDay(new Date());
    const endOfRange = addDays(today, 7);
    
    const upcomingEvents = events.filter(e => {
      const eventDate = startOfDay(parseISO(e.event_date));
      return eventDate >= today && eventDate <= endOfRange;
    });

    const automatableTasks: AutomationTask[] = [];
    const humanRequiredTasks: AutomationTask[] = [];
    const insights: ScheduleInsight[] = [];

    // Try AI-powered analysis
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [],
          events: upcomingEvents.slice(0, 50),
          action: 'analyze',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          const aiData = result.data;
          
          if (aiData.optimization_suggestions) {
            aiData.optimization_suggestions.forEach((suggestion: any) => {
              insights.push({
                type: suggestion.impact === 'high' ? 'opportunity' : 'optimization',
                title: suggestion.suggestion.split('.')[0] || 'Schedule Optimization',
                description: suggestion.suggestion,
                actionable: suggestion.effort !== 'hard',
                suggestedAction: suggestion.effort === 'easy' ? 'Apply now' : undefined,
              });
            });
          }

          if (aiData.conflicts?.length > 0) {
            insights.push({
              type: 'warning',
              title: `${aiData.conflicts.length} scheduling conflicts detected`,
              description: aiData.conflicts.map((c: any) => `${c.event1} conflicts with ${c.event2}`).join(', '),
              actionable: true,
              suggestedAction: 'Resolve conflicts',
            });
          }

          if (aiData.recommended_focus_blocks?.length > 0) {
            insights.push({
              type: 'opportunity',
              title: 'Focus time available',
              description: `AI found ${aiData.recommended_focus_blocks.length} optimal focus blocks in your schedule`,
              actionable: true,
              suggestedAction: 'Block focus time',
            });
          }
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
    }

    // Generate tasks based on events
    upcomingEvents.forEach((event) => {
      const eventDate = parseISO(event.event_date);
      const isUpcoming = isToday(eventDate) || isTomorrow(eventDate);
      const titleLower = event.title.toLowerCase();
      
      if (titleLower.includes('meeting') || titleLower.includes('call') || 
          titleLower.includes('sync') || titleLower.includes('standup')) {
        automatableTasks.push({
          id: `task-prep-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'preparation',
          title: `Prepare agenda for "${event.title}"`,
          description: `AI will generate a comprehensive meeting agenda`,
          automatable: true,
          humanRequired: false,
          priority: isUpcoming ? 'high' : 'medium',
          status: 'pending',
          estimatedTime: '~30 sec',
          dueDate: event.event_date,
          createdAt: new Date(),
        });

        automatableTasks.push({
          id: `task-followup-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'follow-up',
          title: `Draft follow-up for "${event.title}"`,
          description: `AI will create a follow-up email template with action items`,
          automatable: true,
          humanRequired: false,
          priority: 'medium',
          status: 'pending',
          estimatedTime: '~30 sec',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }

      if (titleLower.includes('interview') || titleLower.includes('review') || 
          titleLower.includes('1:1') || titleLower.includes('one on one')) {
        humanRequiredTasks.push({
          id: `task-human-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'preparation',
          title: `Personal preparation for "${event.title}"`,
          description: `Review notes and prepare personal talking points`,
          automatable: false,
          humanRequired: true,
          humanReason: 'Requires personal judgment and relationship context',
          priority: isUpcoming ? 'critical' : 'high',
          status: 'pending',
          estimatedTime: '15 min',
          dueDate: event.event_date,
          createdAt: new Date(),
        });

        automatableTasks.push({
          id: `task-research-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'research',
          title: `Research background for "${event.title}"`,
          description: `AI will compile relevant context and preparation notes`,
          automatable: true,
          humanRequired: false,
          priority: isUpcoming ? 'high' : 'medium',
          status: 'pending',
          estimatedTime: '~30 sec',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }

      if (titleLower.includes('presentation') || titleLower.includes('demo') || 
          titleLower.includes('pitch') || titleLower.includes('workshop')) {
        automatableTasks.push({
          id: `task-outline-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'documentation',
          title: `Create outline for "${event.title}"`,
          description: `AI will generate a structured presentation outline`,
          automatable: true,
          humanRequired: false,
          priority: 'high',
          status: 'pending',
          estimatedTime: '~30 sec',
          dueDate: event.event_date,
          createdAt: new Date(),
        });

        humanRequiredTasks.push({
          id: `task-rehearse-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'preparation',
          title: `Rehearse "${event.title}"`,
          description: `Practice delivery, timing, and handle Q&A scenarios`,
          automatable: false,
          humanRequired: true,
          humanReason: 'Physical practice cannot be automated',
          priority: isUpcoming ? 'critical' : 'high',
          status: 'pending',
          estimatedTime: '30 min',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }

      if (titleLower.includes('client') || titleLower.includes('customer') ||
          titleLower.includes('prospect') || titleLower.includes('partner')) {
        automatableTasks.push({
          id: `task-comms-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'communication',
          title: `Prepare communications for "${event.title}"`,
          description: `AI will draft confirmation and pre-meeting communications`,
          automatable: true,
          humanRequired: false,
          priority: isUpcoming ? 'high' : 'medium',
          status: 'pending',
          estimatedTime: '~30 sec',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }
    });

    // Default insights
    if (insights.length === 0) {
      if (upcomingEvents.length > 5) {
        insights.push({
          type: 'warning',
          title: 'Busy week ahead',
          description: `You have ${upcomingEvents.length} events in the next 7 days.`,
          actionable: true,
          suggestedAction: 'Review calendar',
        });
      }

      if (automatableTasks.length > 0) {
        insights.push({
          type: 'opportunity',
          title: `${automatableTasks.length} tasks can be automated`,
          description: `Let AI agents handle routine preparation while you focus on what matters.`,
          actionable: true,
          suggestedAction: 'Run all tasks',
        });
      }
    }

    const workloadScore = Math.min(100, (upcomingEvents.length * 10) + (humanRequiredTasks.length * 15));
    const automationPotential = automatableTasks.length > 0 
      ? Math.round((automatableTasks.length / (automatableTasks.length + humanRequiredTasks.length)) * 100)
      : 0;

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

  // Execute a single task with AI
  const runTask = useCallback(async (task: AutomationTask): Promise<string> => {
    if (!task.automatable) {
      throw new Error('This task requires human action');
    }

    setActiveTaskId(task.id);
    
    setAgents(prev => prev.map(a => 
      a.type === task.type 
        ? { ...a, status: 'working', currentTask: task }
        : a
    ));

    try {
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

      const result = await response.json();
      
      let formattedOutput = '';
      if (result.data) {
        formattedOutput = formatToolOutput(result.tool, result.data);
      } else if (result.content) {
        formattedOutput = result.content;
      }

      if (analysis) {
        setAnalysis({
          ...analysis,
          automatableTasks: analysis.automatableTasks.map(t =>
            t.id === task.id ? { ...t, status: 'completed', output: formattedOutput } : t
          ),
        });
      }

      setAgents(prev => prev.map(a => 
        a.type === task.type 
          ? { ...a, status: 'completed', currentTask: undefined, completedTasks: a.completedTasks + 1 }
          : a
      ));

      toast({
        title: 'Task Completed',
        description: `${task.title} has been completed by AI`,
      });

      setActiveTaskId(null);
      return formattedOutput;
    } catch (error) {
      setAgents(prev => prev.map(a => 
        a.type === task.type 
          ? { ...a, status: 'idle', currentTask: undefined }
          : a
      ));
      setActiveTaskId(null);
      
      toast({
        title: 'Task Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [analysis, events]);

  const runAllTasks = useCallback(async () => {
    if (!analysis) return;
    
    const pendingTasks = analysis.automatableTasks.filter(t => t.status === 'pending');
    let completed = 0;
    let failed = 0;
    
    for (const task of pendingTasks) {
      try {
        await runTask(task);
        completed++;
        await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }

    setAgents(prev => prev.map(a => ({ ...a, status: 'idle', currentTask: undefined })));

    if (failed > 0) {
      toast({
        title: 'Automation Complete',
        description: `${completed} tasks completed, ${failed} failed`,
        variant: failed === pendingTasks.length ? 'destructive' : 'default',
      });
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

// =====================================================
// OUTPUT FORMATTERS
// =====================================================

function formatToolOutput(tool: string, data: any): string {
  switch (tool) {
    case 'generate_meeting_agenda': return formatAgenda(data);
    case 'draft_follow_up_email': return formatFollowUpEmail(data);
    case 'create_research_brief': return formatResearchBrief(data);
    case 'analyze_schedule': return formatScheduleAnalysis(data);
    case 'generate_documentation': return formatDocumentation(data);
    case 'create_communication': return formatCommunication(data);
    default: return JSON.stringify(data, null, 2);
  }
}

function formatAgenda(data: any): string {
  let output = `# 📋 ${data.title || 'Meeting Agenda'}\n\n`;
  if (data.meeting_type) output += `**Type:** ${data.meeting_type.replace('_', ' ').toUpperCase()}\n`;
  if (data.duration_minutes) output += `**Duration:** ${data.duration_minutes} minutes\n\n`;
  if (data.objectives?.length > 0) {
    output += `## 🎯 Objectives\n`;
    data.objectives.forEach((obj: string) => { output += `- ${obj}\n`; });
    output += '\n';
  }
  if (data.agenda_items?.length > 0) {
    output += `## 📝 Agenda\n\n`;
    data.agenda_items.forEach((item: any, i: number) => {
      output += `### ${i + 1}. ${item.topic} (${item.duration_minutes} min)\n`;
      if (item.expected_outcome) output += `**Expected Outcome:** ${item.expected_outcome}\n`;
      if (item.discussion_points?.length > 0) {
        item.discussion_points.forEach((point: string) => { output += `  - ${point}\n`; });
      }
      output += '\n';
    });
  }
  if (data.preparation_needed?.length > 0) {
    output += `## ✅ Preparation\n`;
    data.preparation_needed.forEach((prep: any) => {
      output += typeof prep === 'string' ? `- [ ] ${prep}\n` : `- [ ] ${prep.task}\n`;
    });
  }
  return output;
}

function formatFollowUpEmail(data: any): string {
  let output = `# ✉️ Follow-Up Email\n\n`;
  output += `**Subject:** ${data.subject || 'Meeting Follow-Up'}\n\n---\n\n`;
  output += `${data.greeting || 'Hi team,'}\n\n`;
  if (data.summary || data.executive_summary) output += `${data.summary || data.executive_summary}\n\n`;
  if (data.action_items?.length > 0) {
    output += `## Action Items\n`;
    data.action_items.forEach((item: any) => {
      output += `- [ ] ${item.task}`;
      if (item.owner) output += ` *(${item.owner})*`;
      if (item.due_date) output += ` — Due: ${item.due_date}`;
      output += '\n';
    });
  }
  output += `\n${data.closing || 'Best regards'}\n`;
  return output;
}

function formatResearchBrief(data: any): string {
  let output = `# 🔍 Research Brief: ${data.topic}\n\n`;
  output += `## Executive Summary\n${data.executive_summary}\n\n`;
  if (data.key_findings?.length > 0) {
    output += `## Key Findings\n\n`;
    data.key_findings.forEach((f: any) => {
      output += `- **${f.finding}** (${f.confidence_level} confidence)\n`;
    });
    output += '\n';
  }
  if (data.recommended_actions?.length > 0) {
    output += `## Recommended Actions\n`;
    data.recommended_actions.forEach((a: any) => { output += `- ${a.action}\n`; });
  }
  return output;
}

function formatScheduleAnalysis(data: any): string {
  let output = `# 📅 Schedule Analysis\n\n`;
  output += `**Health Score:** ${data.schedule_health_score}/100\n`;
  output += `**Meeting Load:** ${data.meeting_load}\n\n`;
  if (data.optimization_suggestions?.length > 0) {
    output += `## 💡 Suggestions\n`;
    data.optimization_suggestions.forEach((s: any) => { output += `- ${s.suggestion}\n`; });
  }
  return output;
}

function formatDocumentation(data: any): string {
  let output = `# 📝 ${data.title}\n\n`;
  if (data.tldr) output += `> ${data.tldr}\n\n`;
  if (data.sections?.length > 0) {
    data.sections.forEach((section: any) => {
      output += `## ${section.heading}\n`;
      if (section.content) output += `${section.content}\n`;
      if (section.bullet_points?.length > 0) {
        section.bullet_points.forEach((p: string) => { output += `- ${p}\n`; });
      }
      output += '\n';
    });
  }
  return output;
}

function formatCommunication(data: any): string {
  let output = `# 💬 ${data.type?.charAt(0).toUpperCase() + data.type?.slice(1) || 'Communication'}\n\n`;
  output += `**Subject:** ${data.subject}\n\n---\n\n`;
  if (data.structure) {
    output += `${data.structure.opening}\n\n${data.structure.main_message}\n\n`;
    if (data.structure.call_to_action) output += `**${data.structure.call_to_action}**\n\n`;
    output += `${data.structure.closing}\n`;
  } else if (data.full_body) {
    output += `${data.full_body}\n`;
  }
  return output;
}
