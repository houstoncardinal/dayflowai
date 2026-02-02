import { useState, useMemo, useCallback } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
  parseISO
} from 'date-fns';
import { CalendarEvent, CalendarView, DayInfo, HourSlot } from '@/types/calendar';

// Memoized event lookup map for O(1) access
function createEventMap(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = event.event_date;
    const existing = map.get(key);
    if (existing) {
      existing.push(event);
    } else {
      map.set(key, [event]);
    }
  }
  return map;
}

export function useCalendar(events: CalendarEvent[]) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<CalendarView>('month');

  // Create event map for fast lookups
  const eventMap = useMemo(() => createEventMap(events), [events]);

  const calendarDays = useMemo((): DayInfo[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const today = new Date();

    return days.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        date,
        isCurrentMonth: isSameMonth(date, currentDate),
        isToday: isSameDay(date, today),
        events: eventMap.get(dateKey) || [],
      };
    });
  }, [currentDate, eventMap]);

  const weekDays = useMemo((): DayInfo[] => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const today = new Date();

    return days.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        date,
        isCurrentMonth: isSameMonth(date, currentDate),
        isToday: isSameDay(date, today),
        events: eventMap.get(dateKey) || [],
      };
    });
  }, [currentDate, eventMap]);

  const dayHours = useMemo((): HourSlot[] => {
    const hours: HourSlot[] = [];
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayEvents = eventMap.get(dateStr) || [];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourEvents = dayEvents.filter((event) => {
        if (!event.start_time) return hour === 0;
        const eventHour = parseInt(event.start_time.split(':')[0], 10);
        return eventHour === hour;
      });

      hours.push({
        hour,
        label: format(new Date().setHours(hour, 0, 0, 0), 'h a'),
        events: hourEvents,
      });
    }
    return hours;
  }, [currentDate, eventMap]);

  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      switch (view) {
        case 'month':
          return addMonths(prev, 1);
        case 'week':
          return addWeeks(prev, 1);
        case 'day':
          return addDays(prev, 1);
        default:
          return prev;
      }
    });
  }, [view]);

  const goToPrev = useCallback(() => {
    setCurrentDate(prev => {
      switch (view) {
        case 'month':
          return subMonths(prev, 1);
        case 'week':
          return subWeeks(prev, 1);
        case 'day':
          return subDays(prev, 1);
        default:
          return prev;
      }
    });
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }, []);

  const currentMonthLabel = useMemo(() => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return '';
    }
  }, [view, currentDate]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return eventMap.get(dateKey) || [];
  }, [selectedDate, eventMap]);

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendarDays,
    weekDays,
    dayHours,
    currentMonthLabel,
    goToNext,
    goToPrev,
    goToToday,
    selectedDateEvents,
  };
}
