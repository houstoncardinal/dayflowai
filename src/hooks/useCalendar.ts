import { useState, useMemo } from 'react';
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

export function useCalendar(events: CalendarEvent[]) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<CalendarView>('month');

  const calendarDays = useMemo((): DayInfo[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const today = new Date();

    return days.map((date) => ({
      date,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isSameDay(date, today),
      events: events.filter((event) => isSameDay(parseISO(event.event_date), date)),
    }));
  }, [currentDate, events]);

  const weekDays = useMemo((): DayInfo[] => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const today = new Date();

    return days.map((date) => ({
      date,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isSameDay(date, today),
      events: events.filter((event) => isSameDay(parseISO(event.event_date), date)),
    }));
  }, [currentDate, events]);

  const dayHours = useMemo((): HourSlot[] => {
    const hours: HourSlot[] = [];
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    for (let hour = 0; hour < 24; hour++) {
      const hourEvents = events.filter((event) => {
        if (event.event_date !== dateStr) return false;
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
  }, [currentDate, events]);

  const goToNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const goToPrev = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getHeaderLabel = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  const selectedDateEvents = selectedDate
    ? events.filter((event) => isSameDay(parseISO(event.event_date), selectedDate))
    : [];

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendarDays,
    weekDays,
    dayHours,
    currentMonthLabel: getHeaderLabel(),
    goToNext,
    goToPrev,
    goToToday,
    selectedDateEvents,
  };
}
