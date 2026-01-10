import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent, EventColor } from '@/types/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
      setEvents((data || []) as CalendarEvent[]);
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

    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error updating event',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
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
        description: 'The event has been removed from your calendar.',
      });
    }
  };

  const moveEvent = async (id: string, newDate: string, newStartTime?: string, newEndTime?: string) => {
    const updates: Partial<CalendarEvent> = { event_date: newDate };
    if (newStartTime !== undefined) updates.start_time = newStartTime;
    if (newEndTime !== undefined) updates.end_time = newEndTime;
    
    await updateEvent(id, updates);
  };

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    refetch: fetchEvents,
  };
}
