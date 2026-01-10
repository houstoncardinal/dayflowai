export type EventColor = 'coral' | 'teal' | 'amber' | 'violet' | 'emerald' | 'rose';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: EventColor;
  description?: string;
}

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}
