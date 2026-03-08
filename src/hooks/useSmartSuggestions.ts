import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  parseISO, isToday, isTomorrow, addDays, differenceInMinutes,
  format, startOfDay, addMinutes, isBefore, isAfter, startOfWeek,
  endOfWeek, eachDayOfInterval, getDay,
} from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────
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
  confidence: number; // 0-1 score for how relevant/useful
}

// ── Utility helpers ────────────────────────────────────────────────
const MEETING_KEYWORDS = ['meeting', 'call', 'sync', 'standup', '1:1', 'review', 'interview', 'demo', 'presentation', 'workshop', 'sprint', 'retro', 'kickoff', 'brainstorm'];
const FOCUS_KEYWORDS = ['focus', 'deep work', 'heads down', 'no meetings', 'coding', 'writing', 'creative'];
const SOCIAL_KEYWORDS = ['lunch', 'coffee', 'happy hour', 'team building', '1:1', 'catch up'];

function isMeeting(title: string): boolean {
  const lower = title.toLowerCase();
  return MEETING_KEYWORDS.some(k => lower.includes(k));
}

function isFocusBlock(title: string): boolean {
  return FOCUS_KEYWORDS.some(k => title.toLowerCase().includes(k));
}

function parseTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}`);
}

function eventDurationMinutes(e: CalendarEvent): number {
  if (e.all_day) return 480;
  if (!e.start_time || !e.end_time) return 30;
  const [sh, sm] = e.start_time.split(':').map(Number);
  const [eh, em] = e.end_time.split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

// ── Context-switching cost algorithm ───────────────────────────────
// Measures how fragmented a day is — more switches = more cognitive load
function contextSwitchScore(dayEvents: CalendarEvent[]): number {
  const timed = dayEvents
    .filter(e => e.start_time && e.end_time)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  if (timed.length <= 1) return 0;

  let switches = 0;
  let shortGaps = 0;

  for (let i = 0; i < timed.length - 1; i++) {
    const current = timed[i];
    const next = timed[i + 1];
    if (!current.end_time || !next.start_time) continue;

    const gapMinutes = differenceInMinutes(
      parseTime(next.event_date, next.start_time),
      parseTime(current.event_date, current.end_time)
    );

    switches++;
    if (gapMinutes > 0 && gapMinutes < 30) shortGaps++; // <30min gaps are worst
  }

  // Score 0-100: higher = worse fragmentation
  return Math.min(100, (switches * 12) + (shortGaps * 20));
}

// ── Burnout risk detector ──────────────────────────────────────────
// Checks if user has too many meetings in a row or too many hours booked
function burnoutRisk(weekEvents: CalendarEvent[]): { risk: 'low' | 'medium' | 'high'; score: number; reason: string } {
  const totalMeetingMinutes = weekEvents
    .filter(e => isMeeting(e.title))
    .reduce((sum, e) => sum + eventDurationMinutes(e), 0);

  const totalHours = totalMeetingMinutes / 60;
  const daysWithEvents = new Set(weekEvents.map(e => e.event_date)).size;

  // Check for back-to-back marathon days
  const dayGroups = new Map<string, CalendarEvent[]>();
  weekEvents.forEach(e => {
    const existing = dayGroups.get(e.event_date) || [];
    existing.push(e);
    dayGroups.set(e.event_date, existing);
  });

  let marathonDays = 0;
  dayGroups.forEach(dayEvts => {
    const dayMeetingMins = dayEvts
      .filter(e => isMeeting(e.title))
      .reduce((sum, e) => sum + eventDurationMinutes(e), 0);
    if (dayMeetingMins > 300) marathonDays++; // 5+ hours of meetings
  });

  const score = Math.min(100,
    (totalHours > 20 ? 40 : totalHours > 15 ? 25 : totalHours > 10 ? 10 : 0) +
    (marathonDays * 20) +
    (daysWithEvents >= 5 ? 15 : 0)
  );

  return {
    risk: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
    score,
    reason: score >= 60
      ? `${totalHours.toFixed(0)}h of meetings this week with ${marathonDays} marathon days`
      : score >= 30
        ? `${totalHours.toFixed(0)}h of meetings — consider protecting focus time`
        : 'Meeting load looks manageable',
  };
}

// ── Gap finder algorithm ───────────────────────────────────────────
// Finds free slots between events for focus blocks
function findFreeSlots(dayEvents: CalendarEvent[], date: string): { start: string; end: string; minutes: number }[] {
  const timed = dayEvents
    .filter(e => e.start_time && e.end_time && !e.all_day)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const slots: { start: string; end: string; minutes: number }[] = [];
  const workStart = '09:00';
  const workEnd = '17:00';

  let cursor = workStart;

  for (const event of timed) {
    if (!event.start_time || !event.end_time) continue;
    if (event.start_time > cursor) {
      const gapMins = timeToMinutes(event.start_time) - timeToMinutes(cursor);
      if (gapMins >= 30) {
        slots.push({ start: cursor, end: event.start_time, minutes: gapMins });
      }
    }
    if (event.end_time > cursor) {
      cursor = event.end_time;
    }
  }

  // After last event until end of work
  if (cursor < workEnd) {
    const gapMins = timeToMinutes(workEnd) - timeToMinutes(cursor);
    if (gapMins >= 30) {
      slots.push({ start: cursor, end: workEnd, minutes: gapMins });
    }
  }

  return slots;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ── Pattern recognition ────────────────────────────────────────────
// Detects recurring patterns in user's schedule
function detectPatterns(events: CalendarEvent[]): { pattern: string; confidence: number; suggestion: string }[] {
  const patterns: { pattern: string; confidence: number; suggestion: string }[] = [];

  // Check for recurring meeting titles
  const titleFreq = new Map<string, number>();
  events.forEach(e => {
    const normalized = e.title.toLowerCase().trim();
    titleFreq.set(normalized, (titleFreq.get(normalized) || 0) + 1);
  });

  titleFreq.forEach((count, title) => {
    if (count >= 3 && !events.some(e => e.title.toLowerCase() === title && e.recurrence_rule)) {
      patterns.push({
        pattern: `"${title}" appears ${count} times but isn't set as recurring`,
        confidence: Math.min(0.95, 0.5 + count * 0.1),
        suggestion: `Make "${title}" a recurring event to save time`,
      });
    }
  });

  // Check for consistent daily patterns (e.g., always has meetings at 10am)
  const timeSlotFreq = new Map<string, number>();
  events
    .filter(e => e.start_time)
    .forEach(e => {
      const hour = e.start_time!.split(':')[0];
      timeSlotFreq.set(hour, (timeSlotFreq.get(hour) || 0) + 1);
    });

  const busiest = [...timeSlotFreq.entries()].sort((a, b) => b[1] - a[1])[0];
  if (busiest && busiest[1] >= 5) {
    patterns.push({
      pattern: `${busiest[1]} events start at ${busiest[0]}:00`,
      confidence: 0.7,
      suggestion: `Your peak meeting time is ${busiest[0]}:00 — consider batching meetings here and protecting other hours for focus`,
    });
  }

  // No-meeting day detection
  const dayOfWeekCounts = new Map<number, number>();
  events.forEach(e => {
    const day = getDay(parseISO(e.event_date));
    dayOfWeekCounts.set(day, (dayOfWeekCounts.get(day) || 0) + 1);
  });

  const quietestDay = [...dayOfWeekCounts.entries()].sort((a, b) => a[1] - b[1])[0];
  if (quietestDay && quietestDay[1] <= 2) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    patterns.push({
      pattern: `${dayNames[quietestDay[0]]} is your quietest day`,
      confidence: 0.8,
      suggestion: `Consider making ${dayNames[quietestDay[0]]} a no-meeting day for deep work`,
    });
  }

  return patterns;
}

// ── Main analysis engine ───────────────────────────────────────────
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

  // ── PREP suggestions (intelligent) ──
  const upcomingMeetings = todayEvents.filter(e => {
    if (!isMeeting(e.title)) return false;
    if (!e.start_time) return true;
    return differenceInMinutes(parseTime(e.event_date, e.start_time), now) > 0;
  });

  upcomingMeetings.forEach(event => {
    const minutesUntil = event.start_time
      ? differenceInMinutes(parseTime(event.event_date, event.start_time), now)
      : 999;

    // Confidence based on time proximity — closer = more urgent
    const confidence = Math.min(1, 0.5 + (1 - minutesUntil / 480) * 0.5);

    suggestions.push({
      id: `prep-${event.id}`,
      category: 'prep',
      priority: minutesUntil <= 60 ? 'urgent' : 'high',
      icon: '📋',
      title: `Prepare for "${event.title}"`,
      description: event.start_time
        ? `Starts at ${event.start_time} (${minutesUntil}min) — AI generates agenda & talking points`
        : 'AI can generate an agenda & talking points',
      actionLabel: 'Generate Agenda',
      eventId: event.id,
      eventTitle: event.title,
      status: 'pending',
      confidence,
    });
  });

  // Tomorrow prep — smarter: only if there are 2+ meetings
  const tomorrowMeetings = tomorrowEvents.filter(e => isMeeting(e.title));
  if (tomorrowMeetings.length >= 2) {
    suggestions.push({
      id: `prep-tomorrow-batch`,
      category: 'prep',
      priority: 'high',
      icon: '📋',
      title: `Batch-prep ${tomorrowMeetings.length} meetings for tomorrow`,
      description: `Get ahead — AI prepares agendas for all tomorrow's meetings at once`,
      actionLabel: 'Prep All',
      status: 'pending',
      confidence: 0.85,
      meta: { eventIds: tomorrowMeetings.map(e => e.id) },
    });
  } else {
    tomorrowMeetings.forEach(event => {
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
        confidence: 0.7,
      });
    });
  }

  // ── FOLLOW-UP suggestions (with time-decay scoring) ──
  const pastMeetings = todayEvents.filter(e => {
    if (!e.end_time || !isMeeting(e.title)) return false;
    return isBefore(parseTime(e.event_date, e.end_time), now);
  });

  pastMeetings.forEach(event => {
    const minutesSince = differenceInMinutes(now, parseTime(event.event_date, event.end_time!));
    // Follow-ups are most valuable within 2 hours
    const confidence = Math.max(0.3, 1 - minutesSince / 240);

    suggestions.push({
      id: `followup-${event.id}`,
      category: 'followup',
      priority: minutesSince <= 30 ? 'urgent' : 'high',
      icon: '✉️',
      title: `Follow up on "${event.title}"`,
      description: minutesSince <= 60
        ? `Just ended ${minutesSince}m ago — perfect time to draft follow-up`
        : 'AI drafts a follow-up email with action items',
      actionLabel: 'Draft Follow-up',
      eventId: event.id,
      eventTitle: event.title,
      status: 'pending',
      confidence,
    });
  });

  // ── OPTIMIZE suggestions (advanced algorithms) ──

  // Conflict detection with severity scoring
  const timedToday = todayEvents
    .filter(e => e.start_time && e.end_time)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const conflicts: { a: CalendarEvent; b: CalendarEvent; overlapMinutes: number }[] = [];
  for (let i = 0; i < timedToday.length - 1; i++) {
    for (let j = i + 1; j < timedToday.length; j++) {
      const a = timedToday[i];
      const b = timedToday[j];
      if (!a.end_time || !b.start_time) continue;
      if (a.end_time > b.start_time) {
        const overlap = timeToMinutes(a.end_time) - timeToMinutes(b.start_time);
        if (overlap > 0) conflicts.push({ a, b, overlapMinutes: overlap });
      }
    }
  }

  conflicts.forEach(({ a, b, overlapMinutes }) => {
    suggestions.push({
      id: `conflict-${a.id}-${b.id}`,
      category: 'optimize',
      priority: 'urgent',
      icon: '⚠️',
      title: `${overlapMinutes}min overlap detected`,
      description: `"${a.title}" (until ${a.end_time}) overlaps with "${b.title}" (from ${b.start_time})`,
      actionLabel: 'Resolve',
      status: 'pending',
      confidence: 1,
      meta: { event1: a.id, event2: b.id, overlapMinutes },
    });
  });

  // Context-switching cost
  const switchScore = contextSwitchScore(todayEvents);
  if (switchScore >= 50) {
    suggestions.push({
      id: 'context-switch-warning',
      category: 'optimize',
      priority: switchScore >= 75 ? 'high' : 'medium',
      icon: '🧠',
      title: 'High context-switching day',
      description: `Fragmentation score: ${switchScore}/100 — many short gaps between events reduce deep work capacity`,
      actionLabel: 'Optimize Gaps',
      status: 'pending',
      confidence: switchScore / 100,
      meta: { switchScore },
    });
  }

  // Focus block suggestions — with specific slot recommendations
  const freeSlots = findFreeSlots(todayEvents, format(today, 'yyyy-MM-dd'));
  const bestSlot = freeSlots.sort((a, b) => b.minutes - a.minutes)[0];

  if (bestSlot && bestSlot.minutes >= 60 && !todayEvents.some(e => isFocusBlock(e.title))) {
    suggestions.push({
      id: 'focus-block-smart',
      category: 'optimize',
      priority: 'medium',
      icon: '🎯',
      title: `Block ${Math.floor(bestSlot.minutes / 60)}h focus time`,
      description: `Best slot: ${bestSlot.start}–${bestSlot.end} (${bestSlot.minutes}min uninterrupted)`,
      actionLabel: 'Add Focus Block',
      status: 'pending',
      confidence: 0.8,
      meta: { slot: bestSlot },
    });
  }

  // Burnout risk
  const burnout = burnoutRisk(weekEvents);
  if (burnout.risk !== 'low') {
    suggestions.push({
      id: 'burnout-risk',
      category: 'optimize',
      priority: burnout.risk === 'high' ? 'urgent' : 'medium',
      icon: burnout.risk === 'high' ? '🔥' : '⚡',
      title: `${burnout.risk === 'high' ? 'Burnout risk detected' : 'Heavy meeting load this week'}`,
      description: burnout.reason,
      actionLabel: 'Optimize Week',
      status: 'pending',
      confidence: burnout.score / 100,
      meta: { burnoutScore: burnout.score },
    });
  }

  // Busy week optimization
  if (weekEvents.length > 8) {
    suggestions.push({
      id: 'optimize-busy-week',
      category: 'optimize',
      priority: 'medium',
      icon: '⚡',
      title: 'Optimize your busy week',
      description: `${weekEvents.length} events — AI can find focus blocks, batch meetings, & resolve conflicts`,
      actionLabel: 'Optimize Schedule',
      status: 'pending',
      confidence: Math.min(0.95, weekEvents.length / 20),
      meta: { eventCount: weekEvents.length },
    });
  }

  // Pattern-based suggestions
  const patterns = detectPatterns(events);
  patterns.forEach((p, i) => {
    suggestions.push({
      id: `pattern-${i}`,
      category: 'optimize',
      priority: 'low',
      icon: '📊',
      title: p.suggestion,
      description: p.pattern,
      actionLabel: 'Apply',
      status: 'pending',
      confidence: p.confidence,
      meta: { pattern: p },
    });
  });

  // ── AUTOPILOT ──
  if (todayEvents.length >= 1) {
    const meetingCount = todayEvents.filter(e => isMeeting(e.title)).length;
    suggestions.push({
      id: 'daily-autopilot',
      category: 'autopilot',
      priority: 'medium',
      icon: '🤖',
      title: 'Run Daily Autopilot',
      description: `Prep ${meetingCount} meetings, find ${freeSlots.length} focus slots, flag ${conflicts.length} conflicts — one click`,
      actionLabel: 'Run Autopilot',
      status: 'pending',
      confidence: 0.9,
      meta: { eventCount: todayEvents.length, meetingCount, conflictCount: conflicts.length },
    });
  }

  // ── QUICK actions ──
  if (tomorrowEvents.length === 0 && todayEvents.length === 0) {
    suggestions.push({
      id: 'quick-plan',
      category: 'quick',
      priority: 'low',
      icon: '✨',
      title: 'Plan your week',
      description: 'Schedule looks open — AI can suggest productive time blocks',
      actionLabel: 'Get Suggestions',
      status: 'pending',
      confidence: 0.5,
    });
  }

  // Sort by: priority first, then confidence
  const priorityOrder: Record<SuggestionPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return suggestions.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.confidence - a.confidence;
  });
}

// ── Hook ───────────────────────────────────────────────────────────
export function useSmartSuggestions(events: CalendarEvent[]) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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

  const executeSuggestion = useCallback(async (suggestionId: string) => {
    if (!user) return;

    setSuggestions(prev => prev.map(s =>
      s.id === suggestionId ? { ...s, status: 'running' as const } : s
    ));

    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    try {
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
            } : {
              id: suggestion.id,
              type: taskType,
              title: suggestion.title,
              context: `${suggestion.description}. Confidence: ${(suggestion.confidence * 100).toFixed(0)}%. ${JSON.stringify(suggestion.meta || {})}`,
            },
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

// ── Output formatters ──────────────────────────────────────────────
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
