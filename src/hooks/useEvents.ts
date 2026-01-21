import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent, EventColor } from '@/types/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addDays, addWeeks, addMonths, addYears, parseISO, isBefore, format } from 'date-fns';

// Generate recurring event instances
function generateRecurringInstances(event: CalendarEvent, rangeEnd: Date): CalendarEvent[] {
  if (!event.recurrence_rule || event.recurrence_rule === 'none') {
    return [event];
  }

  const instances: CalendarEvent[] = [event];
  let currentDate = parseISO(event.event_date);
  const endDate = event.recurrence_end_date 
    ? parseISO(event.recurrence_end_date)
    : rangeEnd;

  const getNextDate = (date: Date): Date => {
    switch (event.recurrence_rule) {
      case 'daily':
        return addDays(date, 1);
      case 'weekly':
        return addWeeks(date, 1);
      case 'biweekly':
        return addWeeks(date, 2);
      case 'monthly':
        return addMonths(date, 1);
      case 'yearly':
        return addYears(date, 1);
      default:
        return date;
    }
  };

  // Generate up to 100 instances max
  for (let i = 0; i < 100; i++) {
    currentDate = getNextDate(currentDate);
    
    if (isBefore(endDate, currentDate) || isBefore(rangeEnd, currentDate)) {
      break;
    }

    instances.push({
      ...event,
      id: `${event.id}-${format(currentDate, 'yyyy-MM-dd')}`,
      event_date: format(currentDate, 'yyyy-MM-dd'),
      parent_event_id: event.id,
    });
  }

  return instances;
}

export function useEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<EventColor[]>([]);
  const [lastDeletedEvent, setLastDeletedEvent] = useState<CalendarEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true });

    if (error) {
      toast({
        title: 'Error fetching events',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Expand recurring events
      const rangeEnd = addMonths(new Date(), 6); // Show 6 months ahead
      const allEvents: CalendarEvent[] = [];
      
      (data || []).forEach((event: CalendarEvent) => {
        const instances = generateRecurringInstances(event, rangeEnd);
        allEvents.push(...instances);
      });
      
      setEvents(allEvents);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchEvents();

    if (!user) return;

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchEvents]);

  // Filter events based on search and color
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = !searchQuery || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesColor = colorFilter.length === 0 || colorFilter.includes(event.color);
      
      return matchesSearch && matchesColor;
    });
  }, [events, searchQuery, colorFilter]);

  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { error } = await supabase.from('events').insert({
      ...event,
      user_id: user.id,
    });

    if (error) {
      toast({
        title: 'Error adding event',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Event created',
        description: 'Your event has been added to the calendar.',
      });
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    if (!user) return;

    // Handle recurring event instances - update the parent event
    const actualId = id.includes('-') && id.split('-').length > 5 
      ? id.split('-').slice(0, 5).join('-') 
      : id;

    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', actualId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error updating event',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Event updated',
        description: 'Your changes have been saved.',
      });
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;

    // Store event for undo
    const eventToDelete = events.find(e => e.id === id || e.parent_event_id === id);
    if (eventToDelete) {
      setLastDeletedEvent(eventToDelete);
    }

    // Handle recurring event instances - delete the parent event
    const actualId = id.includes('-') && id.split('-').length > 5 
      ? id.split('-').slice(0, 5).join('-') 
      : id;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', actualId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error deleting event',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Event deleted',
        description: 'The event has been removed. Use Ctrl+Z to undo.',
      });
    }
  };

  const undoDelete = useCallback(async () => {
    if (!user || !lastDeletedEvent) return;

    const { error } = await supabase.from('events').insert({
      title: lastDeletedEvent.title,
      description: lastDeletedEvent.description,
      event_date: lastDeletedEvent.event_date,
      start_time: lastDeletedEvent.start_time,
      end_time: lastDeletedEvent.end_time,
      color: lastDeletedEvent.color,
      all_day: lastDeletedEvent.all_day,
      recurrence_rule: lastDeletedEvent.recurrence_rule,
      recurrence_end_date: lastDeletedEvent.recurrence_end_date,
      user_id: user.id,
    });

    if (error) {
      toast({
        title: 'Error restoring event',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setLastDeletedEvent(null);
      toast({
        title: 'Event restored',
        description: 'The event has been restored.',
      });
    }
  }, [user, lastDeletedEvent, toast]);

  const moveEvent = async (id: string, newDate: string, newStartTime?: string, newEndTime?: string) => {
    const updates: Partial<CalendarEvent> = { event_date: newDate };
    if (newStartTime !== undefined) updates.start_time = newStartTime;
    if (newEndTime !== undefined) updates.end_time = newEndTime;
    
    await updateEvent(id, updates);
  };

  return {
    events: filteredEvents,
    allEvents: events,
    loading,
    searchQuery,
    setSearchQuery,
    colorFilter,
    setColorFilter,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    undoDelete,
    lastDeletedEvent,
    refetch: fetchEvents,
  };
}
