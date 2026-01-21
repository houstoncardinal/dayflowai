export type EventColor = 'coral' | 'teal' | 'amber' | 'violet' | 'emerald' | 'rose';
export type CalendarView = 'month' | 'week' | 'day';
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  event_date: string; // YYYY-MM-DD format
  start_time?: string | null; // HH:MM format
  end_time?: string | null;
  color: EventColor;
  all_day?: boolean;
  recurrence_rule?: string | null;
  recurrence_end_date?: string | null;
  parent_event_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface HourSlot {
  hour: number;
  label: string;
  events: CalendarEvent[];
}

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  timezone?: string | null;
  notification_enabled?: boolean;
  notification_minutes_before?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: 'voice_command' | 'automated_task' | 'event_created' | 'event_edited';
  event_data?: Record<string, any>;
  created_at: string;
}
