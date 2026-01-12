import { useMemo } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { startOfWeek, endOfWeek, format, parseISO, differenceInMinutes, isWithinInterval, subWeeks, addDays } from 'date-fns';

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
}

// Working hours: 9 AM - 5 PM = 8 hours = 480 minutes per day
const WORKING_HOURS_PER_DAY = 480;
const WORKING_DAYS_PER_WEEK = 5;
const TOTAL_WORKING_MINUTES_PER_WEEK = WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_WEEK;

// Estimate automation savings per event (e.g., AI-assisted scheduling saves ~5 min per event)
const AUTOMATION_MINUTES_PER_EVENT = 5;
const VOICE_COMMAND_SAVINGS_MINUTES = 2;

function calculateEventDuration(event: CalendarEvent): number {
  if (event.all_day) return 480; // Full day = 8 hours
  if (!event.start_time || !event.end_time) return 30; // Default 30 min
  
  const [startH, startM] = event.start_time.split(':').map(Number);
  const [endH, endM] = event.end_time.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return Math.max(0, endMinutes - startMinutes);
}

export function useAnalytics(events: CalendarEvent[]) {
  const analytics = useMemo<WeeklyAnalytics>(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    
    const previousWeekStart = subWeeks(weekStart, 1);
    const previousWeekEnd = subWeeks(weekEnd, 1);
    
    // Filter events for current week
    const currentWeekEvents = events.filter(event => {
      const eventDate = parseISO(event.event_date);
      return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
    });
    
    // Filter events for previous week
    const previousWeekEvents = events.filter(event => {
      const eventDate = parseISO(event.event_date);
      return isWithinInterval(eventDate, { start: previousWeekStart, end: previousWeekEnd });
    });
    
    // Calculate current week metrics
    const totalMeetings = currentWeekEvents.length;
    const meetingMinutes = currentWeekEvents.reduce((sum, event) => 
      sum + calculateEventDuration(event), 0
    );
    const focusTimeMinutes = TOTAL_WORKING_MINUTES_PER_WEEK - meetingMinutes;
    
    // Calculate previous week metrics
    const prevMeetingMinutes = previousWeekEvents.reduce((sum, event) => 
      sum + calculateEventDuration(event), 0
    );
    const prevFocusTimeMinutes = TOTAL_WORKING_MINUTES_PER_WEEK - prevMeetingMinutes;
    
    // Events by day
    const eventsByDay: { day: string; meetings: number; focusTime: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEvents = currentWeekEvents.filter(e => e.event_date === dayStr);
      const dayMeetingMinutes = dayEvents.reduce((sum, e) => sum + calculateEventDuration(e), 0);
      
      eventsByDay.push({
        day: format(day, 'EEE'),
        meetings: dayMeetingMinutes,
        focusTime: Math.max(0, WORKING_HOURS_PER_DAY - dayMeetingMinutes),
      });
    }
    
    // Events by color (category)
    const colorMap = new Map<string, { count: number; minutes: number }>();
    currentWeekEvents.forEach(event => {
      const existing = colorMap.get(event.color) || { count: 0, minutes: 0 };
      colorMap.set(event.color, {
        count: existing.count + 1,
        minutes: existing.minutes + calculateEventDuration(event),
      });
    });
    
    const eventsByColor = Array.from(colorMap.entries()).map(([color, data]) => ({
      color,
      count: data.count,
      minutes: data.minutes,
    }));
    
    // Automation savings (estimated based on events created)
    const automatedTasksCount = Math.floor(totalMeetings * 0.3); // Assume 30% were AI-assisted
    const voiceCommandsUsed = parseInt(localStorage.getItem('dayflow-voice-commands') || '0', 10);
    const automationSavingsMinutes = 
      (automatedTasksCount * AUTOMATION_MINUTES_PER_EVENT) + 
      (voiceCommandsUsed * VOICE_COMMAND_SAVINGS_MINUTES);
    
    return {
      weekStart,
      weekEnd,
      totalMeetings,
      meetingMinutes,
      focusTimeMinutes: Math.max(0, focusTimeMinutes),
      automationSavingsMinutes,
      eventsByDay,
      eventsByColor,
      comparisonToPreviousWeek: {
        meetingsChange: meetingMinutes - prevMeetingMinutes,
        focusTimeChange: focusTimeMinutes - prevFocusTimeMinutes,
      },
      automatedTasksCount,
      voiceCommandsUsed,
    };
  }, [events]);
  
  return analytics;
}
