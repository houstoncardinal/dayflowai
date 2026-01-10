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
  format
} from 'date-fns';
import { CalendarEvent, DayInfo, EventColor } from '@/types/calendar';

const EVENT_COLORS: EventColor[] = ['coral', 'teal', 'amber', 'violet', 'emerald', 'rose'];

const generateId = () => Math.random().toString(36).substring(2, 9);

// Sample events for demo
const createSampleEvents = (): CalendarEvent[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return [
    {
      id: generateId(),
      title: 'Team Standup',
      date: new Date(currentYear, currentMonth, 15),
      startTime: '09:00',
      endTime: '09:30',
      color: 'teal',
    },
    {
      id: generateId(),
      title: 'Product Review',
      date: new Date(currentYear, currentMonth, 15),
      startTime: '14:00',
      endTime: '15:00',
      color: 'violet',
    },
    {
      id: generateId(),
      title: 'Design Workshop',
      date: new Date(currentYear, currentMonth, 18),
      startTime: '10:00',
      endTime: '12:00',
      color: 'coral',
    },
    {
      id: generateId(),
      title: 'Client Call',
      date: new Date(currentYear, currentMonth, 20),
      startTime: '11:00',
      endTime: '11:30',
      color: 'amber',
    },
    {
      id: generateId(),
      title: 'Sprint Planning',
      date: new Date(currentYear, currentMonth, 22),
      startTime: '13:00',
      endTime: '14:30',
      color: 'emerald',
    },
    {
      id: generateId(),
      title: 'Yoga Class',
      date: new Date(currentYear, currentMonth, today.getDate()),
      startTime: '07:00',
      endTime: '08:00',
      color: 'rose',
    },
    {
      id: generateId(),
      title: 'Lunch with Alex',
      date: new Date(currentYear, currentMonth, today.getDate()),
      startTime: '12:30',
      endTime: '13:30',
      color: 'teal',
    },
  ];
};

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(createSampleEvents);

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
      events: events.filter((event) => isSameDay(event.date, date)),
    }));
  }, [currentDate, events]);

  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    setEvents((prev) => [...prev, { ...event, id: generateId() }]);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const currentMonthLabel = format(currentDate, 'MMMM yyyy');

  const selectedDateEvents = selectedDate
    ? events.filter((event) => isSameDay(event.date, selectedDate))
    : [];

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    calendarDays,
    currentMonthLabel,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    events,
    addEvent,
    deleteEvent,
    selectedDateEvents,
    eventColors: EVENT_COLORS,
  };
}
