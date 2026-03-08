import { useMemo } from 'react';
import { CalendarEvent } from '@/types/calendar';
import {
  startOfWeek, endOfWeek, format, parseISO, isWithinInterval,
  subWeeks, addDays, getDay, differenceInMinutes,
} from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────
export interface WeeklyAnalytics {
  weekStart: Date;
  weekEnd: Date;
  totalMeetings: number;
  meetingMinutes: number;
  focusTimeMinutes: number;
  automationSavingsMinutes: number;
  eventsByDay: { day: string; meetings: number; focusTime: number }[];
  eventsByColor: { color: string; count: number; minutes: number }[];
  comparisonToPreviousWeek: {
    meetingsChange: number;
    focusTimeChange: number;
  };
  automatedTasksCount: number;
  voiceCommandsUsed: number;
  // ── Advanced metrics ──
  productivityScore: number; // 0-100 composite score
  focusFragmentationIndex: number; // 0-100 how fragmented focus time is
  meetingEfficiency: number; // 0-100 ratio of short vs long meetings
  peakProductivityHour: string; // best hour for focus
  meetingDensityByDay: { day: string; density: number }[]; // meeting mins / working mins
  longestFocusBlock: number; // longest uninterrupted gap in minutes
  averageMeetingDuration: number;
  backToBackCount: number; // number of back-to-back meeting pairs
  weekOverWeekTrend: 'improving' | 'stable' | 'declining';
  topCategory: { color: string; name: string; percentage: number } | null;
}

// ── Constants ──────────────────────────────────────────────────────
const WORKING_HOURS_PER_DAY = 480; // 9-5 = 8h
const WORKING_DAYS = 5;
const TOTAL_WORKING_MINUTES = WORKING_HOURS_PER_DAY * WORKING_DAYS;
const AUTOMATION_MINUTES_PER_EVENT = 5;
const VOICE_COMMAND_SAVINGS = 2;

const MEETING_KEYWORDS = ['meeting', 'call', 'sync', 'standup', '1:1', 'review', 'interview', 'demo', 'presentation'];

const COLOR_NAMES: Record<string, string> = {
  coral: 'Priority',
  teal: 'Work',
  amber: 'Meetings',
  violet: 'Personal',
  emerald: 'Focus',
  rose: 'Social',
};

// ── Helpers ────────────────────────────────────────────────────────
function eventDuration(event: CalendarEvent): number {
  if (event.all_day) return WORKING_HOURS_PER_DAY;
  if (!event.start_time || !event.end_time) return 30;
  const [sh, sm] = event.start_time.split(':').map(Number);
  const [eh, em] = event.end_time.split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Find the longest gap between events in a day (focus time quality metric)
function longestGap(dayEvents: CalendarEvent[]): number {
  const timed = dayEvents
    .filter(e => e.start_time && e.end_time && !e.all_day)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  if (timed.length === 0) return WORKING_HOURS_PER_DAY;

  let maxGap = 0;
  let cursor = 9 * 60; // 9 AM

  for (const event of timed) {
    if (!event.start_time) continue;
    const start = timeToMinutes(event.start_time);
    const gap = start - cursor;
    if (gap > maxGap) maxGap = gap;
    const end = event.end_time ? timeToMinutes(event.end_time) : start + 30;
    if (end > cursor) cursor = end;
  }

  // Gap after last event until 5 PM
  const endOfDay = 17 * 60;
  const finalGap = endOfDay - cursor;
  if (finalGap > maxGap) maxGap = finalGap;

  return Math.max(0, maxGap);
}

// Count back-to-back meetings (gap <= 10min)
function countBackToBack(dayEvents: CalendarEvent[]): number {
  const timed = dayEvents
    .filter(e => e.start_time && e.end_time)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  let count = 0;
  for (let i = 0; i < timed.length - 1; i++) {
    const current = timed[i];
    const next = timed[i + 1];
    if (!current.end_time || !next.start_time) continue;
    const gap = timeToMinutes(next.start_time) - timeToMinutes(current.end_time);
    if (gap <= 10) count++;
  }
  return count;
}

// Focus fragmentation: measures how broken up free time is
// Score 0 = solid blocks, 100 = many tiny fragments
function focusFragmentation(dayEvents: CalendarEvent[]): number {
  const timed = dayEvents
    .filter(e => e.start_time && e.end_time && !e.all_day)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  if (timed.length <= 1) return 0;

  const gaps: number[] = [];
  let cursor = 9 * 60;

  for (const event of timed) {
    if (!event.start_time) continue;
    const start = timeToMinutes(event.start_time);
    if (start > cursor) gaps.push(start - cursor);
    const end = event.end_time ? timeToMinutes(event.end_time) : start + 30;
    if (end > cursor) cursor = end;
  }

  const endOfDay = 17 * 60;
  if (endOfDay > cursor) gaps.push(endOfDay - cursor);

  if (gaps.length === 0) return 100; // All booked
  if (gaps.length === 1) return 0; // One solid block

  // More gaps = more fragmented. Short gaps are worse.
  const shortGaps = gaps.filter(g => g < 30).length;
  const totalGaps = gaps.length;

  return Math.min(100, Math.round((totalGaps * 15) + (shortGaps * 25)));
}

// ── Main Hook ──────────────────────────────────────────────────────
export function useAnalytics(events: CalendarEvent[]) {
  const analytics = useMemo<WeeklyAnalytics>(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const prevWeekStart = subWeeks(weekStart, 1);
    const prevWeekEnd = subWeeks(weekEnd, 1);
    const twoWeeksAgoStart = subWeeks(weekStart, 2);
    const twoWeeksAgoEnd = subWeeks(weekEnd, 2);

    const currentWeekEvents = events.filter(e => {
      const d = parseISO(e.event_date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });

    const prevWeekEvents = events.filter(e => {
      const d = parseISO(e.event_date);
      return isWithinInterval(d, { start: prevWeekStart, end: prevWeekEnd });
    });

    const twoWeeksAgoEvents = events.filter(e => {
      const d = parseISO(e.event_date);
      return isWithinInterval(d, { start: twoWeeksAgoStart, end: twoWeeksAgoEnd });
    });

    // ── Basic metrics ──
    const totalMeetings = currentWeekEvents.length;
    const meetingMinutes = currentWeekEvents.reduce((sum, e) => sum + eventDuration(e), 0);
    const focusTimeMinutes = Math.max(0, TOTAL_WORKING_MINUTES - meetingMinutes);
    const prevMeetingMinutes = prevWeekEvents.reduce((sum, e) => sum + eventDuration(e), 0);
    const prevFocusTime = Math.max(0, TOTAL_WORKING_MINUTES - prevMeetingMinutes);

    // ── Events by day ──
    const eventsByDay: { day: string; meetings: number; focusTime: number }[] = [];
    let totalFragmentation = 0;
    let totalBackToBack = 0;
    let weekLongestFocus = 0;

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEvents = currentWeekEvents.filter(e => e.event_date === dayStr);
      const dayMeetingMins = dayEvents.reduce((sum, e) => sum + eventDuration(e), 0);

      eventsByDay.push({
        day: format(day, 'EEE'),
        meetings: dayMeetingMins,
        focusTime: Math.max(0, WORKING_HOURS_PER_DAY - dayMeetingMins),
      });

      totalFragmentation += focusFragmentation(dayEvents);
      totalBackToBack += countBackToBack(dayEvents);

      const dayLongest = longestGap(dayEvents);
      if (dayLongest > weekLongestFocus) weekLongestFocus = dayLongest;
    }

    // ── Events by color ──
    const colorMap = new Map<string, { count: number; minutes: number }>();
    currentWeekEvents.forEach(e => {
      const existing = colorMap.get(e.color) || { count: 0, minutes: 0 };
      colorMap.set(e.color, {
        count: existing.count + 1,
        minutes: existing.minutes + eventDuration(e),
      });
    });
    const eventsByColor = Array.from(colorMap.entries()).map(([color, data]) => ({
      color,
      count: data.count,
      minutes: data.minutes,
    }));

    // ── Meeting density by day ──
    const meetingDensityByDay = eventsByDay.map(d => ({
      day: d.day,
      density: Math.round((d.meetings / WORKING_HOURS_PER_DAY) * 100),
    }));

    // ── Meeting efficiency (shorter meetings are more efficient) ──
    const meetingDurations = currentWeekEvents.map(eventDuration);
    const avgDuration = meetingDurations.length > 0
      ? meetingDurations.reduce((a, b) => a + b, 0) / meetingDurations.length
      : 0;
    const shortMeetings = meetingDurations.filter(d => d <= 30).length;
    const meetingEfficiency = meetingDurations.length > 0
      ? Math.round((shortMeetings / meetingDurations.length) * 40 + Math.max(0, (60 - avgDuration) / 60) * 60)
      : 100;

    // ── Peak productivity hour (hour with most focus time across the week) ──
    const hourBuckets = new Array(24).fill(0);
    currentWeekEvents.forEach(e => {
      if (!e.start_time) return;
      const hour = parseInt(e.start_time.split(':')[0], 10);
      hourBuckets[hour] += eventDuration(e);
    });
    // Invert: hour with least meetings = best focus hour
    const workHours = hourBuckets.slice(8, 18); // 8am-6pm
    const quietestIdx = workHours.indexOf(Math.min(...workHours));
    const peakHour = quietestIdx + 8;
    const peakProductivityHour = `${peakHour}:00`;

    // ── Focus fragmentation index ──
    const focusFragmentationIndex = Math.round(totalFragmentation / 7);

    // ── Top category ──
    const topColor = eventsByColor.sort((a, b) => b.minutes - a.minutes)[0];
    const topCategory = topColor
      ? { color: topColor.color, name: COLOR_NAMES[topColor.color] || topColor.color, percentage: Math.round((topColor.minutes / meetingMinutes) * 100) }
      : null;

    // ── Automation savings ──
    const automatedTasksCount = Math.floor(totalMeetings * 0.3);
    const voiceCommandsUsed = parseInt(localStorage.getItem('dayflow-voice-commands') || '0', 10);
    const automationSavingsMinutes =
      (automatedTasksCount * AUTOMATION_MINUTES_PER_EVENT) +
      (voiceCommandsUsed * VOICE_COMMAND_SAVINGS);

    // ── Week-over-week trend (3-week analysis) ──
    const twoWeeksAgoMins = twoWeeksAgoEvents.reduce((sum, e) => sum + eventDuration(e), 0);
    const twoWeeksAgoFocus = Math.max(0, TOTAL_WORKING_MINUTES - twoWeeksAgoMins);
    const focusTrend = [twoWeeksAgoFocus, prevFocusTime, focusTimeMinutes];
    const weekOverWeekTrend: 'improving' | 'stable' | 'declining' =
      focusTrend[2] > focusTrend[1] && focusTrend[1] > focusTrend[0] ? 'improving' :
      focusTrend[2] < focusTrend[1] && focusTrend[1] < focusTrend[0] ? 'declining' :
      'stable';

    // ── Composite productivity score ──
    // Weighted: focus time (30%), fragmentation (25%), meeting efficiency (20%), trend (15%), back-to-back (10%)
    const focusRatio = Math.min(1, focusTimeMinutes / TOTAL_WORKING_MINUTES);
    const fragScore = Math.max(0, 100 - focusFragmentationIndex);
    const trendBonus = weekOverWeekTrend === 'improving' ? 100 : weekOverWeekTrend === 'stable' ? 60 : 20;
    const b2bPenalty = Math.max(0, 100 - totalBackToBack * 20);

    const productivityScore = Math.round(
      focusRatio * 100 * 0.30 +
      fragScore * 0.25 +
      meetingEfficiency * 0.20 +
      trendBonus * 0.15 +
      b2bPenalty * 0.10
    );

    return {
      weekStart,
      weekEnd,
      totalMeetings,
      meetingMinutes,
      focusTimeMinutes,
      automationSavingsMinutes,
      eventsByDay,
      eventsByColor,
      comparisonToPreviousWeek: {
        meetingsChange: meetingMinutes - prevMeetingMinutes,
        focusTimeChange: focusTimeMinutes - prevFocusTime,
      },
      automatedTasksCount,
      voiceCommandsUsed,
      productivityScore: Math.min(100, Math.max(0, productivityScore)),
      focusFragmentationIndex,
      meetingEfficiency: Math.min(100, Math.max(0, meetingEfficiency)),
      peakProductivityHour,
      meetingDensityByDay,
      longestFocusBlock: weekLongestFocus,
      averageMeetingDuration: Math.round(avgDuration),
      backToBackCount: totalBackToBack,
      weekOverWeekTrend,
      topCategory,
    };
  }, [events]);

  return analytics;
}
