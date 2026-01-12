import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent, EventColor } from '@/types/calendar';
import { supabase } from '@/integrations/supabase/client';

export type SyncProvider = 'google' | 'outlook';

export interface SyncStatus {
  provider: SyncProvider;
  connected: boolean;
  lastSync?: Date;
  syncing: boolean;
  error?: string;
}

export interface CalendarSyncState {
  google: SyncStatus;
  outlook: SyncStatus;
}

const INITIAL_STATE: CalendarSyncState = {
  google: {
    provider: 'google',
    connected: false,
    syncing: false,
  },
  outlook: {
    provider: 'outlook',
    connected: false,
    syncing: false,
  },
};

export function useCalendarSync() {
  const { toast } = useToast();
  const [syncState, setSyncState] = useState<CalendarSyncState>(() => {
    const saved = localStorage.getItem('dayflow-calendar-sync');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          google: { ...INITIAL_STATE.google, ...parsed.google },
          outlook: { ...INITIAL_STATE.outlook, ...parsed.outlook },
        };
      } catch {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const saveState = useCallback((state: CalendarSyncState) => {
    localStorage.setItem('dayflow-calendar-sync', JSON.stringify(state));
    setSyncState(state);
  }, []);

  const connectGoogle = useCallback(async () => {
    // In production, this would initiate OAuth flow
    // For now, we'll simulate the connection
    toast({
      title: 'Google Calendar',
      description: 'OAuth integration requires additional setup. Contact support for enterprise access.',
    });
    
    // Simulated connection for demo
    const newState = {
      ...syncState,
      google: {
        ...syncState.google,
        connected: true,
        lastSync: new Date(),
      },
    };
    saveState(newState);
  }, [syncState, saveState, toast]);

  const connectOutlook = useCallback(async () => {
    // In production, this would initiate Microsoft OAuth flow
    toast({
      title: 'Outlook Calendar',
      description: 'OAuth integration requires additional setup. Contact support for enterprise access.',
    });
    
    // Simulated connection for demo
    const newState = {
      ...syncState,
      outlook: {
        ...syncState.outlook,
        connected: true,
        lastSync: new Date(),
      },
    };
    saveState(newState);
  }, [syncState, saveState, toast]);

  const disconnect = useCallback((provider: SyncProvider) => {
    const newState = {
      ...syncState,
      [provider]: {
        ...syncState[provider],
        connected: false,
        lastSync: undefined,
      },
    };
    saveState(newState);
    
    toast({
      title: `${provider === 'google' ? 'Google' : 'Outlook'} Calendar`,
      description: 'Calendar disconnected successfully.',
    });
  }, [syncState, saveState, toast]);

  const syncNow = useCallback(async (provider: SyncProvider, events: CalendarEvent[]) => {
    if (!syncState[provider].connected) {
      toast({
        title: 'Not Connected',
        description: `Please connect your ${provider === 'google' ? 'Google' : 'Outlook'} Calendar first.`,
        variant: 'destructive',
      });
      return;
    }

    setSyncState(prev => ({
      ...prev,
      [provider]: { ...prev[provider], syncing: true },
    }));

    try {
      // Call edge function for sync
      const { data, error } = await supabase.functions.invoke('calendar-sync', {
        body: { 
          provider, 
          action: 'sync',
          events: events.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            date: e.event_date,
            startTime: e.start_time,
            endTime: e.end_time,
            allDay: e.all_day,
          })),
        },
      });

      if (error) throw error;

      const newState = {
        ...syncState,
        [provider]: {
          ...syncState[provider],
          syncing: false,
          lastSync: new Date(),
          error: undefined,
        },
      };
      saveState(newState);

      toast({
        title: 'Sync Complete',
        description: `Your events have been synced with ${provider === 'google' ? 'Google' : 'Outlook'} Calendar.`,
      });

      return data;
    } catch (error: any) {
      setSyncState(prev => ({
        ...prev,
        [provider]: { 
          ...prev[provider], 
          syncing: false, 
          error: error.message,
        },
      }));

      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync calendar. Please try again.',
        variant: 'destructive',
      });
    }
  }, [syncState, saveState, toast]);

  const importEvents = useCallback(async (provider: SyncProvider) => {
    if (!syncState[provider].connected) {
      toast({
        title: 'Not Connected',
        description: `Please connect your ${provider === 'google' ? 'Google' : 'Outlook'} Calendar first.`,
        variant: 'destructive',
      });
      return [];
    }

    setSyncState(prev => ({
      ...prev,
      [provider]: { ...prev[provider], syncing: true },
    }));

    try {
      const { data, error } = await supabase.functions.invoke('calendar-sync', {
        body: { provider, action: 'import' },
      });

      if (error) throw error;

      setSyncState(prev => ({
        ...prev,
        [provider]: { ...prev[provider], syncing: false },
      }));

      toast({
        title: 'Import Complete',
        description: `Imported ${data?.events?.length || 0} events from ${provider === 'google' ? 'Google' : 'Outlook'} Calendar.`,
      });

      return data?.events || [];
    } catch (error: any) {
      setSyncState(prev => ({
        ...prev,
        [provider]: { ...prev[provider], syncing: false },
      }));

      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import events.',
        variant: 'destructive',
      });

      return [];
    }
  }, [syncState, toast]);

  return {
    syncState,
    connectGoogle,
    connectOutlook,
    disconnect,
    syncNow,
    importEvents,
  };
}
