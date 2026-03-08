import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, isToday, isTomorrow, addDays, differenceInMinutes, format, startOfDay } from 'date-fns';

export type SuggestionCategory = 'prep' | 'optimize' | 'followup' | 'autopilot' | 'quick';
export type SuggestionPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface SmartSuggestion {
  id: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  eventId?: string;
  eventTitle?: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  result?: string;
  meta?: Record<string, any>;
}

// Local analysis — generates suggestions without any API call
function analyzeEventsLocally(events: CalendarEvent[]): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const todayEvents = events.filter(e => isToday(parseISO(e.event_date)));
  const tomorrowEvents = events.filter(e => isTomorrow(parseISO(e.event_date)));
  const weekEvents = events.filter(e => {
    const d = parseISO(e.event_date);
    return d >= today && d <= nextWeek;
  });

  // ---- PREP suggestions ----
  const meetingKeywords = ['meeting', 'call', 'sync', 'standup', '1:1', 'review', 'interview', 'demo', 'presentation'];
  
  todayEvents.forEach(event => {
    const lower = event.title.toLowerCase();
    if (meetingKeywords.some(k => lower.includes(k))) {
      const isUpcoming = event.start_time && differenceInMinutes(
        new Date(`${event.event_date}T${event.start_time}`), now
      ) > 0;
      
      if (isUpcoming || !event.start_time) {
        suggestions.push({
          id: `prep-${event.id}`,
          category: 'prep',
          priority: 'urgent',
          icon: '📋',
          title: `Prepare for "${event.title}"`,
          description: event.start_time 
            ? `Starts at ${event.start_time} — AI can generate an agenda & talking points`
            : 'AI can generate an agenda & talking points',
          actionLabel: 'Generate Agenda',
          eventId: event.id,
          eventTitle: event.title,
          status: 'pending',
        });
      }
    }
  });

  tomorrowEvents.forEach(event => {
    const lower = event.title.toLowerCase();
    if (meetingKeywords.some(k => lower.includes(k))) {
      suggestions.push({
        id: `prep-tomorrow-${event.id}`,
        category: 'prep',
        priority: 'high',
        icon: '📋',
        title: `Prep for tomorrow: "${event.title}"`,
        description: `Get a head start — AI prepares agenda & research brief`,
        actionLabel: 'Prep Now',
        eventId: event.id,
        eventTitle: event.title,
        status: 'pending',
      });
    }
  });

  // ---- FOLLOW-UP suggestions ----
  const pastTodayEvents = todayEvents.filter(e => {
    if (!e.end_time) return false;
    return new Date(`${e.event_date}T${e.end_time}`) < now;
  });

  pastTodayEvents.forEach(event => {
    const lower = event.title.toLowerCase();
    if (meetingKeywords.some(k => lower.includes(k))) {
      suggestions.push({
        id: `followup-${event.id}`,
        category: 'followup',
        priority: 'high',
        icon: '✉️',
        title: `Follow up on "${event.title}"`,
        description: 'AI drafts a follow-up email with action items',
        actionLabel: 'Draft Follow-up',
        eventId: event.id,
        eventTitle: event.title,
        status: 'pending',
      });
    }
  });

  // ---- OPTIMIZE suggestions ----
  if (weekEvents.length > 8) {
    suggestions.push({
      id: 'optimize-busy-week',
      category: 'optimize',
      priority: 'medium',
      icon: '⚡',
      title: 'Optimize your busy week',
      description: `${weekEvents.length} events this week — AI can find focus blocks & resolve conflicts`,
      actionLabel: 'Optimize Schedule',
      status: 'pending',
      meta: { eventCount: weekEvents.length },
    });
  }

  // Check for back-to-back meetings today
  const timedToday = todayEvents
    .filter(e => e.start_time)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  
  for (let i = 0; i < timedToday.length - 1; i++) {
    const current = timedToday[i];
    const next = timedToday[i + 1];
    if (current.end_time && next.start_time && current.end_time >= next.start_time) {
      suggestions.push({
        id: `conflict-${current.id}-${next.id}`,
        category: 'optimize',
        priority: 'urgent',
        icon: '⚠️',
        title: 'Schedule conflict detected',
        description: `"${current.title}" overlaps with "${next.title}"`,
        actionLabel: 'Resolve Conflict',
        status: 'pending',
        meta: { event1: current.id, event2: next.id },
      });
      break; // Only show first conflict
    }
  }

  // Focus time suggestion
  if (todayEvents.length >= 3 && todayEvents.length < 8) {
    const hasNoFocusBlock = !todayEvents.some(e => 
      e.title.toLowerCase().includes('focus') || e.title.toLowerCase().includes('deep work')
    );
    if (hasNoFocusBlock) {
      suggestions.push({
        id: 'focus-block',
        category: 'optimize',
        priority: 'medium',
        icon: '🎯',
        title: 'Block focus time',
        description: 'AI found gaps in your schedule for uninterrupted deep work',
        actionLabel: 'Add Focus Block',
        status: 'pending',
      });
    }
  }

  // ---- AUTOPILOT suggestions ----
  if (todayEvents.length >= 1) {
    suggestions.push({
      id: 'daily-autopilot',
      category: 'autopilot',
      priority: 'medium',
      icon: '🤖',
      title: 'Run Daily Autopilot',
      description: `Prep all ${todayEvents.length} events, flag conflicts, and draft follow-ups in one go`,
      actionLabel: 'Run Autopilot',
      status: 'pending',
      meta: { eventCount: todayEvents.length },
    });
  }

  // ---- QUICK actions ----
  if (tomorrowEvents.length === 0 && todayEvents.length === 0) {
    suggestions.push({
      id: 'quick-plan',
      category: 'quick',
      priority: 'low',
      icon: '✨',
      title: 'Plan your week',
      description: 'Schedule looks open — let AI suggest productive time blocks',
      actionLabel: 'Get Suggestions',
      status: 'pending',
    });
  }

  // Sort by priority
  const priorityOrder: Record<SuggestionPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function useSmartSuggestions(events: CalendarEvent[]) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [aiEnrichedIds, setAiEnrichedIds] = useState<Set<string>>(new Set());

  // Regenerate suggestions when events change
  useEffect(() => {
    const result = analyzeEventsLocally(events);
    setSuggestions(result);
  }, [events]);

  const urgentCount = useMemo(
    () => suggestions.filter(s => s.priority === 'urgent' && s.status === 'pending').length,
    [suggestions]
  );

  const pendingCount = useMemo(
    () => suggestions.filter(s => s.status === 'pending').length,
    [suggestions]
  );

  // Execute a single suggestion via AI
  const executeSuggestion = useCallback(async (suggestionId: string) => {
    if (!user) return;

    setSuggestions(prev => prev.map(s =>
      s.id === suggestionId ? { ...s, status: 'running' as const } : s
    ));

    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    try {
      // Determine action type
      let action = 'execute_task';
      let taskType = 'preparation';
      
      if (suggestion.category === 'followup') taskType = 'follow-up';
      else if (suggestion.category === 'optimize') {
        action = 'analyze';
        taskType = 'scheduling';
      }
      else if (suggestion.category === 'autopilot') action = 'analyze';

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: [],
            events: events.slice(0, 50),
            action,
            task: suggestion.eventId ? {
              id: suggestion.id,
              type: taskType,
              title: suggestion.title,
              eventId: suggestion.eventId,
              eventTitle: suggestion.eventTitle,
              context: suggestion.description,
            } : undefined,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${response.status})`);
      }

      const result = await response.json();

      let resultText = '';
      if (result.data) {
        // Format structured output
        resultText = formatSuggestionResult(result.tool, result.data);
      } else if (result.content) {
        resultText = result.content;
      } else {
        resultText = 'Task completed successfully.';
      }

      setSuggestions(prev => prev.map(s =>
        s.id === suggestionId ? { ...s, status: 'done' as const, result: resultText } : s
      ));
    } catch (error) {
      console.error('Suggestion execution error:', error);
      setSuggestions(prev => prev.map(s =>
        s.id === suggestionId ? {
          ...s,
          status: 'failed' as const,
          result: error instanceof Error ? error.message : 'Something went wrong',
        } : s
      ));
    }
  }, [user, suggestions, events]);

  // Run all pending suggestions (autopilot mode)
  const runAll = useCallback(async () => {
    const pending = suggestions.filter(s => s.status === 'pending' && s.category !== 'autopilot');
    for (const s of pending) {
      await executeSuggestion(s.id);
      await new Promise(r => setTimeout(r, 500));
    }
  }, [suggestions, executeSuggestion]);

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    suggestions,
    isOpen,
    setIsOpen,
    urgentCount,
    pendingCount,
    executeSuggestion,
    runAll,
    dismissSuggestion,
  };
}

// Format AI tool output into readable markdown
function formatSuggestionResult(tool: string, data: any): string {
  if (!data) return 'Done.';

  switch (tool) {
    case 'generate_meeting_agenda': {
      let out = `## 📋 ${data.title || 'Meeting Agenda'}\n\n`;
      if (data.objectives?.length) {
        out += `**Objectives:**\n${data.objectives.map((o: string) => `- ${o}`).join('\n')}\n\n`;
      }
      if (data.agenda_items?.length) {
        out += `**Agenda:**\n`;
        data.agenda_items.forEach((item: any, i: number) => {
          out += `${i + 1}. **${item.topic}** (${item.duration_minutes}m)\n`;
          if (item.discussion_points?.length) {
            item.discussion_points.forEach((p: string) => { out += `   - ${p}\n`; });
          }
        });
        out += '\n';
      }
      if (data.preparation_needed?.length) {
        out += `**Prep:**\n${data.preparation_needed.map((p: any) => `- [ ] ${typeof p === 'string' ? p : p.task}`).join('\n')}\n`;
      }
      return out;
    }

    case 'draft_follow_up_email': {
      let out = `## ✉️ Follow-Up Email\n\n**Subject:** ${data.subject || 'Follow-Up'}\n\n`;
      if (data.summary || data.executive_summary) out += `${data.summary || data.executive_summary}\n\n`;
      if (data.action_items?.length) {
        out += `**Action Items:**\n`;
        data.action_items.forEach((item: any) => {
          out += `- [ ] ${item.task}`;
          if (item.owner) out += ` *(${item.owner})*`;
          if (item.due_date) out += ` — ${item.due_date}`;
          out += '\n';
        });
      }
      return out;
    }

    case 'analyze_schedule': {
      let out = `## ⚡ Schedule Analysis\n\n`;
      out += `**Health Score:** ${data.schedule_health_score}/100\n`;
      out += `**Meeting Load:** ${data.meeting_load}\n\n`;
      if (data.optimization_suggestions?.length) {
        out += `**Suggestions:**\n`;
        data.optimization_suggestions.forEach((s: any) => { out += `- ${s.suggestion}\n`; });
        out += '\n';
      }
      if (data.recommended_focus_blocks?.length) {
        out += `**Focus Blocks:**\n`;
        data.recommended_focus_blocks.forEach((b: any) => {
          out += `- ${b.day} at ${b.time_slot} (${b.duration_hours}h)\n`;
        });
      }
      return out;
    }

    default:
      if (typeof data === 'string') return data;
      return '✅ Task completed successfully.';
  }
}
