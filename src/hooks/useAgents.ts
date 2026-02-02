import { useState, useCallback, useEffect } from 'react';
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
    
    // Filter events within the next 7 days (inclusive of today)
    const upcomingEvents = events.filter(e => {
      const eventDate = startOfDay(parseISO(e.event_date));
      return eventDate >= today && eventDate <= endOfRange;
    });

    console.log('[AgentHub] Analyzing events:', {
      totalEvents: events.length,
      upcomingEvents: upcomingEvents.length,
      eventTitles: upcomingEvents.map(e => e.title),
    });

    const automatableTasks: AutomationTask[] = [];
    const humanRequiredTasks: AutomationTask[] = [];
    const insights: ScheduleInsight[] = [];

    // Try AI-powered analysis first
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
          // Use AI insights
          const aiData = result.data;
          
          if (aiData.optimization_suggestions) {
            aiData.optimization_suggestions.forEach((suggestion: any, i: number) => {
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
      
      // Meeting prep - automatable
      if (titleLower.includes('meeting') || titleLower.includes('call') || 
          titleLower.includes('sync') || titleLower.includes('standup')) {
        automatableTasks.push({
          id: `task-prep-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'preparation',
          title: `Prepare agenda for "${event.title}"`,
          description: `AI will generate a comprehensive meeting agenda with objectives, talking points, and time allocation`,
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
          description: `AI will create a follow-up email template with action items and next steps`,
          automatable: true,
          humanRequired: false,
          priority: 'medium',
          status: 'pending',
          estimatedTime: '~30 sec',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }

      // Interview/review - needs human for personal touch but research can be automated
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
          description: `AI will compile relevant context, talking points, and preparation notes`,
          automatable: true,
          humanRequired: false,
          priority: isUpcoming ? 'high' : 'medium',
          status: 'pending',
          estimatedTime: '~30 sec',
          dueDate: event.event_date,
          createdAt: new Date(),
        });
      }

      // Presentation - automated outline, human rehearsal
      if (titleLower.includes('presentation') || titleLower.includes('demo') || 
          titleLower.includes('pitch') || titleLower.includes('workshop')) {
        automatableTasks.push({
          id: `task-outline-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'documentation',
          title: `Create outline for "${event.title}"`,
          description: `AI will generate a structured presentation outline with key points and flow`,
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

      // Client events - require comms
      if (titleLower.includes('client') || titleLower.includes('customer') ||
          titleLower.includes('prospect') || titleLower.includes('partner')) {
        automatableTasks.push({
          id: `task-comms-${event.id}`,
          eventId: event.id,
          eventTitle: event.title,
          type: 'communication',
          title: `Prepare communications for "${event.title}"`,
          description: `AI will draft confirmation and any pre-meeting communications`,
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

    // Add default insights if none from AI
    if (insights.length === 0) {
      if (upcomingEvents.length > 5) {
        insights.push({
          type: 'warning',
          title: 'Busy week ahead',
          description: `You have ${upcomingEvents.length} events in the next 7 days. Consider delegating or rescheduling.`,
          actionable: true,
          suggestedAction: 'Review calendar',
        });
      }

      const todayEvents = upcomingEvents.filter(e => isToday(parseISO(e.event_date)));
      if (todayEvents.length > 3) {
        insights.push({
          type: 'optimization',
          title: 'Busy day today',
          description: `${todayEvents.length} events today. Tasks prioritized accordingly.`,
          actionable: false,
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
    
    // Update agent status
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
      
      // Format the output based on the tool used
      let formattedOutput = '';
      if (result.data) {
        formattedOutput = formatToolOutput(result.tool, result.data);
      } else if (result.content) {
        formattedOutput = result.content;
      }

      // Update task in analysis
      if (analysis) {
        setAnalysis({
          ...analysis,
          automatableTasks: analysis.automatableTasks.map(t =>
            t.id === task.id ? { ...t, status: 'completed', output: formattedOutput } : t
          ),
        });
      }

      // Update agent
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
        // Small delay between tasks
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`Failed to run task ${task.id}:`, error);
        failed++;
      }
    }

    // Reset all agents to idle
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

// Format structured tool output into readable markdown
function formatToolOutput(tool: string, data: any): string {
  switch (tool) {
    case 'generate_meeting_agenda':
      return formatAgenda(data);
    case 'draft_follow_up_email':
      return formatFollowUpEmail(data);
    case 'create_research_brief':
      return formatResearchBrief(data);
    case 'analyze_schedule':
      return formatScheduleAnalysis(data);
    case 'generate_documentation':
      return formatDocumentation(data);
    case 'create_communication':
      return formatCommunication(data);
    case 'prioritize_tasks':
      return formatPrioritization(data);
    case 'enrich_context':
      return formatContextEnrichment(data);
    case 'orchestrate_agents':
      return formatOrchestration(data);
    default:
      return JSON.stringify(data, null, 2);
  }
}

function formatAgenda(data: any): string {
  let output = `# 📋 ${data.title || 'Meeting Agenda'}\n\n`;
  
  if (data.meeting_type) {
    output += `**Type:** ${data.meeting_type.replace('_', ' ').toUpperCase()}\n`;
  }
  if (data.duration_minutes) {
    output += `**Duration:** ${data.duration_minutes} minutes\n\n`;
  }
  
  // AI Reasoning insight
  if (data.reasoning) {
    output += `> 💭 *${data.reasoning.slice(0, 200)}${data.reasoning.length > 200 ? '...' : ''}*\n\n`;
  }
  
  if (data.objectives?.length > 0) {
    output += `## 🎯 Objectives\n`;
    data.objectives.forEach((obj: string) => {
      output += `- ${obj}\n`;
    });
    output += '\n';
  }
  
  if (data.agenda_items?.length > 0) {
    output += `## 📝 Agenda\n\n`;
    data.agenda_items.forEach((item: any, i: number) => {
      output += `### ${i + 1}. ${item.topic} (${item.duration_minutes} min)\n`;
      if (item.owner) output += `**Owner:** ${item.owner}\n`;
      if (item.objective) output += `**Objective:** ${item.objective}\n`;
      if (item.discussion_points?.length > 0) {
        output += `**Discussion Points:**\n`;
        item.discussion_points.forEach((point: string) => {
          output += `  - ${point}\n`;
        });
      }
      if (item.expected_outcome) output += `**Expected Outcome:** ${item.expected_outcome}\n`;
      output += '\n';
    });
  }
  
  if (data.preparation_needed?.length > 0) {
    output += `## ✅ Pre-Meeting Preparation\n`;
    data.preparation_needed.forEach((prep: any) => {
      if (typeof prep === 'string') {
        output += `- [ ] ${prep}\n`;
      } else {
        const icon = prep.importance === 'critical' ? '🔴' : prep.importance === 'important' ? '🟡' : '🟢';
        output += `- [ ] ${icon} ${prep.task}`;
        if (prep.assignee) output += ` *(${prep.assignee})*`;
        if (prep.deadline) output += ` — by ${prep.deadline}`;
        output += '\n';
      }
    });
    output += '\n';
  }

  if (data.success_metrics?.length > 0) {
    output += `## 📊 Success Metrics\n`;
    data.success_metrics.forEach((metric: string) => {
      output += `- ${metric}\n`;
    });
    output += '\n';
  }

  if (data.potential_challenges?.length > 0) {
    output += `## ⚠️ Potential Challenges\n`;
    data.potential_challenges.forEach((challenge: string) => {
      output += `- ${challenge}\n`;
    });
  }
  
  return output;
}

function formatFollowUpEmail(data: any): string {
  let output = `# ✉️ Follow-Up Email\n\n`;
  output += `**Subject:** ${data.subject || 'Meeting Follow-Up'}\n\n`;
  output += `---\n\n`;
  output += `${data.greeting || 'Hi team,'}\n\n`;
  output += `${data.summary}\n\n`;
  
  if (data.key_decisions?.length > 0) {
    output += `## Key Decisions\n`;
    data.key_decisions.forEach((decision: string) => {
      output += `- ✓ ${decision}\n`;
    });
    output += '\n';
  }
  
  if (data.action_items?.length > 0) {
    output += `## Action Items\n`;
    data.action_items.forEach((item: any) => {
      output += `- [ ] ${item.task}`;
      if (item.owner) output += ` *(${item.owner})*`;
      if (item.due_date) output += ` — Due: ${item.due_date}`;
      output += '\n';
    });
    output += '\n';
  }
  
  if (data.next_steps) {
    output += `## Next Steps\n${data.next_steps}\n\n`;
  }
  
  output += `${data.closing || 'Best regards'}\n`;
  
  return output;
}

function formatResearchBrief(data: any): string {
  let output = `# 🔍 Research Brief: ${data.topic}\n\n`;
  output += `## Executive Summary\n${data.executive_summary}\n\n`;
  
  if (data.key_points?.length > 0) {
    output += `## Key Findings\n\n`;
    data.key_points.forEach((point: any) => {
      const importance = point.importance === 'high' ? '🔴' : point.importance === 'medium' ? '🟡' : '🟢';
      output += `### ${importance} ${point.heading}\n${point.content}\n\n`;
    });
  }
  
  if (data.questions_to_explore?.length > 0) {
    output += `## Questions to Explore\n`;
    data.questions_to_explore.forEach((q: string) => {
      output += `- ${q}\n`;
    });
    output += '\n';
  }
  
  if (data.recommended_resources?.length > 0) {
    output += `## Recommended Resources\n`;
    data.recommended_resources.forEach((r: string) => {
      output += `- ${r}\n`;
    });
  }
  
  return output;
}

function formatScheduleAnalysis(data: any): string {
  let output = `# 📅 Schedule Analysis\n\n`;
  output += `**Health Score:** ${data.schedule_health_score}/100\n`;
  output += `**Meeting Load:** ${data.meeting_load}\n`;
  if (data.focus_time_hours !== undefined) {
    output += `**Available Focus Time:** ${data.focus_time_hours} hours\n`;
  }
  output += '\n';
  
  if (data.conflicts?.length > 0) {
    output += `## ⚠️ Conflicts Detected\n`;
    data.conflicts.forEach((c: any) => {
      output += `- ${c.event1} ↔ ${c.event2}: ${c.conflict_type}\n`;
    });
    output += '\n';
  }
  
  if (data.optimization_suggestions?.length > 0) {
    output += `## 💡 Optimization Suggestions\n`;
    data.optimization_suggestions.forEach((s: any) => {
      const impact = s.impact === 'high' ? '🔴' : s.impact === 'medium' ? '🟡' : '🟢';
      output += `- ${impact} ${s.suggestion}`;
      if (s.effort) output += ` *(${s.effort} effort)*`;
      output += '\n';
    });
    output += '\n';
  }
  
  if (data.recommended_focus_blocks?.length > 0) {
    output += `## 🎯 Recommended Focus Blocks\n`;
    data.recommended_focus_blocks.forEach((block: any) => {
      output += `- ${block.day}: ${block.time_slot} (${block.duration_hours}h)\n`;
    });
  }
  
  return output;
}

function formatDocumentation(data: any): string {
  let output = `# 📝 ${data.title}\n\n`;
  output += `**Type:** ${data.type}\n`;
  if (data.date) output += `**Date:** ${data.date}\n`;
  output += '\n';
  
  if (data.sections?.length > 0) {
    data.sections.forEach((section: any) => {
      output += `## ${section.heading}\n`;
      if (section.content) output += `${section.content}\n`;
      if (section.bullet_points?.length > 0) {
        section.bullet_points.forEach((point: string) => {
          output += `- ${point}\n`;
        });
      }
      output += '\n';
    });
  }
  
  if (data.tags?.length > 0) {
    output += `---\n**Tags:** ${data.tags.map((t: string) => `\`${t}\``).join(' ')}\n`;
  }
  
  return output;
}

function formatCommunication(data: any): string {
  let output = `# 💬 ${data.type?.charAt(0).toUpperCase() + data.type?.slice(1) || 'Communication'}\n\n`;
  output += `**Subject:** ${data.subject}\n`;
  if (data.channel) output += `**Channel:** ${data.channel}\n`;
  if (data.urgency) output += `**Urgency:** ${data.urgency}\n`;
  if (data.recipient_analysis?.relationship) output += `**Relationship:** ${data.recipient_analysis.relationship}\n`;
  output += '\n';

  // AI Reasoning
  if (data.reasoning) {
    output += `> 💭 *${data.reasoning.slice(0, 150)}${data.reasoning.length > 150 ? '...' : ''}*\n\n`;
  }

  output += `---\n\n`;
  
  if (data.structure) {
    output += `${data.structure.opening}\n\n`;
    output += `${data.structure.context || ''}\n\n`;
    output += `${data.structure.main_message}\n\n`;
    if (data.structure.supporting_points?.length > 0) {
      data.structure.supporting_points.forEach((point: string) => {
        output += `- ${point}\n`;
      });
      output += '\n';
    }
    output += `**${data.structure.call_to_action}**\n\n`;
    output += `${data.structure.closing}\n`;
  } else if (data.full_body) {
    output += `${data.full_body}\n`;
  } else if (data.body) {
    output += `${data.body}\n`;
  }
  
  if (data.follow_up_plan) {
    output += `\n---\n📅 **Follow-up Plan:** If no response by ${data.follow_up_plan.if_no_response_by}, ${data.follow_up_plan.follow_up_action}\n`;
  }

  if (data.suggested_send_time) {
    output += `\n*Suggested send time: ${data.suggested_send_time}*\n`;
  }
  
  return output;
}

function formatPrioritization(data: any): string {
  let output = `# 🎯 Task Prioritization\n\n`;
  
  if (data.prioritization_framework) {
    output += `**Framework:** ${data.prioritization_framework.replace('_', ' ').toUpperCase()}\n\n`;
  }

  // AI Reasoning
  if (data.reasoning) {
    output += `> 💭 *${data.reasoning.slice(0, 200)}${data.reasoning.length > 200 ? '...' : ''}*\n\n`;
  }

  if (data.quick_wins?.length > 0) {
    output += `## ⚡ Quick Wins\n`;
    data.quick_wins.forEach((win: string) => {
      output += `- 🏃 ${win}\n`;
    });
    output += '\n';
  }

  if (data.prioritized_tasks?.length > 0) {
    output += `## 📋 Prioritized Tasks\n\n`;
    data.prioritized_tasks.forEach((task: any, i: number) => {
      const priorityIcon = task.recommended_priority === 'critical' ? '🔴' : 
                          task.recommended_priority === 'high' ? '🟠' : 
                          task.recommended_priority === 'medium' ? '🟡' : '🟢';
      output += `### ${i + 1}. ${priorityIcon} ${task.task_id}\n`;
      output += `**Priority:** ${task.recommended_priority} (Score: ${task.priority_score}/100)\n`;
      if (task.recommended_execution_time) output += `**Best Time:** ${task.recommended_execution_time}\n`;
      output += `**Rationale:** ${task.rationale}\n\n`;
    });
  }

  if (data.execution_order?.length > 0) {
    output += `## 📌 Recommended Order\n`;
    data.execution_order.forEach((taskId: string, i: number) => {
      output += `${i + 1}. ${taskId}\n`;
    });
    output += '\n';
  }

  if (data.time_blocks?.length > 0) {
    output += `## 🕐 Time Blocks\n`;
    data.time_blocks.forEach((block: any) => {
      output += `- **${block.time_slot}** (${block.theme}): ${block.tasks.join(', ')}\n`;
    });
  }

  return output;
}

function formatContextEnrichment(data: any): string {
  let output = `# 🔮 Context Enrichment\n\n`;

  // AI Reasoning
  if (data.reasoning) {
    output += `> 💭 *${data.reasoning}*\n\n`;
  }

  if (data.event_context) {
    output += `## 📊 Event Analysis\n`;
    if (data.event_context.event_type_analysis) output += `**Type:** ${data.event_context.event_type_analysis}\n`;
    if (data.event_context.historical_pattern) output += `**Pattern:** ${data.event_context.historical_pattern}\n`;
    if (data.event_context.typical_outcomes?.length > 0) {
      output += `**Typical Outcomes:**\n`;
      data.event_context.typical_outcomes.forEach((outcome: string) => {
        output += `- ${outcome}\n`;
      });
    }
    output += '\n';
  }

  if (data.stakeholder_context?.length > 0) {
    output += `## 👥 Stakeholders\n`;
    data.stakeholder_context.forEach((stakeholder: any) => {
      output += `### ${stakeholder.role}\n`;
      if (stakeholder.likely_priorities?.length > 0) {
        output += `**Priorities:** ${stakeholder.likely_priorities.join(', ')}\n`;
      }
      if (stakeholder.communication_preferences) output += `**Communication Style:** ${stakeholder.communication_preferences}\n`;
      output += '\n';
    });
  }

  if (data.success_factors?.length > 0) {
    output += `## ✅ Success Factors\n`;
    data.success_factors.forEach((factor: string) => {
      output += `- ${factor}\n`;
    });
    output += '\n';
  }

  if (data.potential_pitfalls?.length > 0) {
    output += `## ⚠️ Potential Pitfalls\n`;
    data.potential_pitfalls.forEach((pitfall: any) => {
      output += `- **${pitfall.pitfall}** → *Prevention:* ${pitfall.prevention}\n`;
    });
    output += '\n';
  }

  if (data.recommended_talking_points?.length > 0) {
    output += `## 💬 Recommended Talking Points\n`;
    data.recommended_talking_points.forEach((point: string, i: number) => {
      output += `${i + 1}. ${point}\n`;
    });
    output += '\n';
  }

  if (data.questions_to_ask?.length > 0) {
    output += `## ❓ Questions to Ask\n`;
    data.questions_to_ask.forEach((q: string) => {
      output += `- ${q}\n`;
    });
  }

  return output;
}

function formatOrchestration(data: any): string {
  let output = `# 🤖 Agent Orchestration Plan\n\n`;

  // AI Reasoning
  if (data.reasoning) {
    output += `> 💭 *${data.reasoning.slice(0, 250)}${data.reasoning.length > 250 ? '...' : ''}*\n\n`;
  }

  if (data.expected_outcome) {
    output += `## 🎯 Expected Outcome\n${data.expected_outcome}\n\n`;
  }

  if (data.total_estimated_time) {
    output += `**Total Estimated Time:** ${data.total_estimated_time}\n\n`;
  }

  if (data.execution_waves?.length > 0) {
    output += `## 🌊 Execution Waves\n\n`;
    data.execution_waves.forEach((wave: any) => {
      output += `### Wave ${wave.wave_number} ${wave.parallel_execution ? '(Parallel)' : '(Sequential)'}\n`;
      output += `Tasks: ${wave.tasks.map((t: number) => `#${t + 1}`).join(', ')}\n\n`;
    });
  }

  if (data.task_breakdown?.length > 0) {
    output += `## 📋 Task Breakdown\n\n`;
    data.task_breakdown.forEach((task: any, i: number) => {
      const agentIcon = {
        'preparation': '📋',
        'follow-up': '✉️',
        'scheduling': '📅',
        'research': '🔍',
        'communication': '💬',
        'documentation': '📝'
      }[task.agent_type] || '🤖';
      
      output += `### ${i + 1}. ${agentIcon} ${task.subtask}\n`;
      output += `**Agent:** ${task.agent_type}\n`;
      if (task.estimated_time) output += `**Time:** ${task.estimated_time}\n`;
      if (task.can_run_parallel) output += `✓ Can run in parallel\n`;
      if (task.depends_on?.length > 0) output += `↳ Depends on: ${task.depends_on.map((d: number) => `#${d + 1}`).join(', ')}\n`;
      if (task.quality_criteria) output += `**Quality:** ${task.quality_criteria}\n`;
      output += '\n';
    });
  }

  if (data.human_checkpoints?.length > 0) {
    output += `## 👤 Human Checkpoints\n`;
    data.human_checkpoints.forEach((checkpoint: any) => {
      output += `- After task #${checkpoint.after_task + 1}: ${checkpoint.checkpoint_purpose}\n`;
      if (checkpoint.decision_needed) output += `  → Decision needed: ${checkpoint.decision_needed}\n`;
    });
    output += '\n';
  }

  if (data.risk_mitigation?.length > 0) {
    output += `## 🛡️ Risk Mitigation\n`;
    data.risk_mitigation.forEach((risk: any) => {
      output += `- **${risk.risk}** → ${risk.mitigation}\n`;
    });
  }

  if (data.coordination_notes) {
    output += `\n---\n📝 *${data.coordination_notes}*\n`;
  }

  return output;
}
