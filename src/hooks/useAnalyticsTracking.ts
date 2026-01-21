import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AnalyticsEventType = 'voice_command' | 'automated_task' | 'event_created' | 'event_edited';

export function useAnalyticsTracking() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    eventType: AnalyticsEventType,
    eventData?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.from('analytics_tracking').insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData || {},
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }, [user]);

  const trackVoiceCommand = useCallback((command: string) => {
    trackEvent('voice_command', { command });
  }, [trackEvent]);

  const trackAutomatedTask = useCallback((taskType: string, taskTitle: string) => {
    trackEvent('automated_task', { taskType, taskTitle });
  }, [trackEvent]);

  const trackEventCreated = useCallback((eventTitle: string, source: 'manual' | 'voice' | 'import') => {
    trackEvent('event_created', { eventTitle, source });
  }, [trackEvent]);

  const trackEventEdited = useCallback((eventId: string) => {
    trackEvent('event_edited', { eventId });
  }, [trackEvent]);

  return {
    trackEvent,
    trackVoiceCommand,
    trackAutomatedTask,
    trackEventCreated,
    trackEventEdited,
  };
}
