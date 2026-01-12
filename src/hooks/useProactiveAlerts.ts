import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { format, parseISO, differenceInMinutes, isToday, isTomorrow, addMinutes } from 'date-fns';

export interface ProactiveAlert {
  id: string;
  type: 'deadline' | 'prep' | 'reminder';
  event: CalendarEvent;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  dismissed: boolean;
}

interface UseProactiveAlertsOptions {
  enabled: boolean;
  onAlert: (alert: ProactiveAlert) => void;
}

export function useProactiveAlerts(events: CalendarEvent[], options: UseProactiveAlertsOptions) {
  const { enabled, onAlert } = options;
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('dayflow-dismissed-alerts');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const checkIntervalRef = useRef<number | null>(null);
  const lastCheckRef = useRef<Date>(new Date());

  // Save dismissed IDs to localStorage
  useEffect(() => {
    localStorage.setItem('dayflow-dismissed-alerts', JSON.stringify([...dismissedIds]));
  }, [dismissedIds]);

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedIds(prev => new Set([...prev, alertId]));
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, dismissed: true } : a));
  }, []);

  const checkForAlerts = useCallback(() => {
    if (!enabled || events.length === 0) return;

    const now = new Date();
    const newAlerts: ProactiveAlert[] = [];

    events.forEach(event => {
      const eventDate = parseISO(event.event_date);
      const isEventToday = isToday(eventDate);
      const isEventTomorrow = isTomorrow(eventDate);

      // Create alert IDs based on event and alert type
      const prepAlertId = `prep-${event.id}-${event.event_date}`;
      const deadlineAlertId = `deadline-${event.id}-${event.event_date}`;
      const reminderAlertId = `reminder-${event.id}-${event.event_date}`;

      // Skip if already dismissed
      if (dismissedIds.has(prepAlertId) && dismissedIds.has(deadlineAlertId) && dismissedIds.has(reminderAlertId)) {
        return;
      }

      // For events with start time
      if (event.start_time && isEventToday) {
        const [hours, minutes] = event.start_time.split(':').map(Number);
        const eventTime = new Date(eventDate);
        eventTime.setHours(hours, minutes, 0, 0);

        const minutesUntilEvent = differenceInMinutes(eventTime, now);

        // 30-minute warning
        if (minutesUntilEvent > 0 && minutesUntilEvent <= 30 && !dismissedIds.has(deadlineAlertId)) {
          newAlerts.push({
            id: deadlineAlertId,
            type: 'deadline',
            event,
            message: `"${event.title}" starts in ${minutesUntilEvent} minutes!`,
            urgency: minutesUntilEvent <= 10 ? 'critical' : 'high',
            triggeredAt: now,
            dismissed: false,
          });
        }

        // 1-hour prep reminder
        if (minutesUntilEvent > 30 && minutesUntilEvent <= 60 && !dismissedIds.has(prepAlertId)) {
          const needsPrep = event.title.toLowerCase().includes('meeting') ||
            event.title.toLowerCase().includes('call') ||
            event.title.toLowerCase().includes('presentation') ||
            event.title.toLowerCase().includes('interview');

          if (needsPrep) {
            newAlerts.push({
              id: prepAlertId,
              type: 'prep',
              event,
              message: `Time to prepare for "${event.title}" - starting in about an hour`,
              urgency: 'medium',
              triggeredAt: now,
              dismissed: false,
            });
          }
        }
      }

      // Morning reminder for tomorrow's events
      const currentHour = now.getHours();
      if (isEventTomorrow && currentHour >= 18 && currentHour < 21 && !dismissedIds.has(reminderAlertId)) {
        const hasImportantEvent = event.title.toLowerCase().includes('meeting') ||
          event.title.toLowerCase().includes('interview') ||
          event.title.toLowerCase().includes('presentation') ||
          event.title.toLowerCase().includes('deadline');

        if (hasImportantEvent) {
          newAlerts.push({
            id: reminderAlertId,
            type: 'reminder',
            event,
            message: `Don't forget: "${event.title}" is tomorrow${event.start_time ? ` at ${event.start_time}` : ''}`,
            urgency: 'low',
            triggeredAt: now,
            dismissed: false,
          });
        }
      }
    });

    // Trigger callbacks for new alerts
    newAlerts.forEach(alert => {
      const existingAlert = alerts.find(a => a.id === alert.id);
      if (!existingAlert) {
        onAlert(alert);
      }
    });

    // Update alerts state
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const trulyNew = newAlerts.filter(a => !existingIds.has(a.id));
        return [...prev, ...trulyNew];
      });
    }

    lastCheckRef.current = now;
  }, [enabled, events, dismissedIds, alerts, onAlert]);

  // Check for alerts periodically
  useEffect(() => {
    if (!enabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkForAlerts();

    // Check every minute
    checkIntervalRef.current = window.setInterval(checkForAlerts, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, checkForAlerts]);

  const activeAlerts = alerts.filter(a => !a.dismissed);

  return {
    alerts: activeAlerts,
    allAlerts: alerts,
    dismissAlert,
    dismissAllAlerts: () => {
      const ids = alerts.map(a => a.id);
      setDismissedIds(prev => new Set([...prev, ...ids]));
      setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })));
    },
    clearOldAlerts: () => {
      const now = new Date();
      setAlerts(prev => prev.filter(a => differenceInMinutes(now, a.triggeredAt) < 120));
    },
  };
}
