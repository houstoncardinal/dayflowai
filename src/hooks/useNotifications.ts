import { useEffect, useCallback, useState, useRef } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { parseISO, isToday, differenceInMinutes } from 'date-fns';

interface UseNotificationsOptions {
  events: CalendarEvent[];
  enabled: boolean;
  minutesBefore?: number;
}

export function useNotifications({ events, enabled, minutesBefore = 15 }: UseNotificationsOptions) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notifiedEventsRef = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<number | null>(null);

  // Request permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [permission]);

  // Check for upcoming events
  const checkUpcomingEvents = useCallback(() => {
    if (!enabled || permission !== 'granted') return;

    const now = new Date();

    events.forEach((event) => {
      const eventDate = parseISO(event.event_date);
      
      // Only check today's events with a start time
      if (!isToday(eventDate) || !event.start_time) return;

      const [hours, minutes] = event.start_time.split(':').map(Number);
      const eventTime = new Date(eventDate);
      eventTime.setHours(hours, minutes, 0, 0);

      const minutesUntil = differenceInMinutes(eventTime, now);
      const notificationKey = `${event.id}-${event.event_date}-${minutesBefore}`;

      // Check if we should notify (within the notification window and not yet notified)
      if (
        minutesUntil > 0 &&
        minutesUntil <= minutesBefore &&
        !notifiedEventsRef.current.has(notificationKey)
      ) {
        notifiedEventsRef.current.add(notificationKey);
        
        sendNotification(`Upcoming: ${event.title}`, {
          body: `Starting in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}${event.description ? `\n${event.description}` : ''}`,
          tag: event.id,
          requireInteraction: true,
        });
      }
    });
  }, [events, enabled, permission, minutesBefore, sendNotification]);

  // Set up interval to check for upcoming events
  useEffect(() => {
    if (!enabled || permission !== 'granted') {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Check immediately
    checkUpcomingEvents();

    // Then check every minute
    checkIntervalRef.current = window.setInterval(checkUpcomingEvents, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, permission, checkUpcomingEvents]);

  // Clear notified events at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      notifiedEventsRef.current.clear();
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window,
  };
}
