export type EventColor = 'coral' | 'teal' | 'amber' | 'violet' | 'emerald' | 'rose';
export type CalendarView = 'month' | 'week' | 'day';

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
  created_at?: string;
  updated_at?: string;
}
