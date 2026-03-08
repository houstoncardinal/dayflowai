import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { format, parseISO, differenceInMinutes, isToday, isTomorrow } from 'date-fns';

export interface ProactiveAlert {
  id: string;
  type: 'deadline' | 'prep' | 'reminder' | 'burnout' | 'conflict' | 'gap';
  event: CalendarEvent;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  dismissed: boolean;
  confidence: number; // 0-1 how confident we are this alert matters
  actionHint?: string; // what the user should do
}

interface UseProactiveAlertsOptions {
  enabled: boolean;
  onAlert: (alert: ProactiveAlert) => void;
}

// ── Intelligent alert thresholds ───────────────────────────────────
const MEETING_KEYWORDS = ['meeting', 'call', 'sync', 'standup', '1:1', 'review', 'interview', 'demo', 'presentation', 'workshop', 'kickoff'];
const HIGH_PREP_KEYWORDS = ['presentation', 'interview', 'demo', 'pitch', 'board', 'client', 'executive'];

function isMeeting(title: string): boolean {
  return MEETING_KEYWORDS.some(k => title.toLowerCase().includes(k));
}

function isHighPrepEvent(title: string): boolean {
  return HIGH_PREP_KEYWORDS.some(k => title.toLowerCase().includes(k));
}

// Estimate prep time needed based on event type
function estimatedPrepMinutes(event: CalendarEvent): number {
  const lower = event.title.toLowerCase();
  if (HIGH_PREP_KEYWORDS.some(k => lower.includes(k))) return 60;
  if (lower.includes('meeting') || lower.includes('call')) return 15;
  if (lower.includes('standup') || lower.includes('sync')) return 5;
  return 10;
}

// Calculate urgency dynamically based on time proximity and event importance
function calculateUrgency(minutesUntil: number, isHighPrep: boolean): 'low' | 'medium' | 'high' | 'critical' {
  if (minutesUntil <= 5) return 'critical';
  if (minutesUntil <= 15) return isHighPrep ? 'critical' : 'high';
  if (minutesUntil <= 30) return isHighPrep ? 'high' : 'medium';
  if (minutesUntil <= 60) return isHighPrep ? 'medium' : 'low';
  return 'low';
}

export function useProactiveAlerts(events: CalendarEvent[], options: UseProactiveAlertsOptions) {
  const { enabled, onAlert } = options;
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('dayflow-dismissed-alerts');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const checkIntervalRef = useRef<number | null>(null);

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

    // ── Pre-index today's events for conflict detection ──
    const todayTimed = events
      .filter(e => isToday(parseISO(e.event_date)) && e.start_time && e.end_time)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    events.forEach(event => {
      const eventDate = parseISO(event.event_date);
      const isEventToday = isToday(eventDate);
      const isEventTomorrow = isTomorrow(eventDate);

      // ── Smart deadline alerts with dynamic thresholds ──
      if (event.start_time && isEventToday) {
        const [hours, minutes] = event.start_time.split(':').map(Number);
        const eventTime = new Date(eventDate);
        eventTime.setHours(hours, minutes, 0, 0);
        const minutesUntil = differenceInMinutes(eventTime, now);

        if (minutesUntil <= 0) return; // Event already started

        const highPrep = isHighPrepEvent(event.title);
        const prepTime = estimatedPrepMinutes(event);

        // Tiered alerts: 5min, 15min, 30min, prep-time
        const alertTiers = [
          { threshold: 5, id: `critical-${event.id}`, msg: `"${event.title}" starts in ${minutesUntil} minutes!` },
          { threshold: 15, id: `soon-${event.id}`, msg: `"${event.title}" starts in ${minutesUntil} minutes` },
          { threshold: 30, id: `upcoming-${event.id}`, msg: `"${event.title}" is coming up at ${event.start_time}` },
          { threshold: prepTime + 10, id: `prep-${event.id}`, msg: `Prepare for "${event.title}" — estimated ${prepTime}min prep needed` },
        ];

        for (const tier of alertTiers) {
          if (minutesUntil <= tier.threshold && minutesUntil > 0 && !dismissedIds.has(tier.id)) {
            // Only push the most urgent tier (first match wins)
            const existing = newAlerts.find(a => a.event.id === event.id);
            if (!existing) {
              const urgency = calculateUrgency(minutesUntil, highPrep);
              newAlerts.push({
                id: tier.id,
                type: minutesUntil <= prepTime ? 'prep' : 'deadline',
                event,
                message: tier.msg,
                urgency,
                triggeredAt: now,
                dismissed: false,
                confidence: Math.min(1, 0.6 + (1 - minutesUntil / 60) * 0.4),
                actionHint: minutesUntil <= 15 ? 'Join now' : 'Prepare',
              });
            }
            break; // Only one alert per event
          }
        }
      }

      // ── Conflict detection (real-time) ──
      if (isEventToday && event.start_time && event.end_time) {
        for (const other of todayTimed) {
          if (other.id === event.id) continue;
          if (!other.start_time || !other.end_time) continue;
          // Check overlap
          if (event.end_time > other.start_time && event.start_time < other.end_time) {
            const conflictId = `conflict-${[event.id, other.id].sort().join('-')}`;
            if (!dismissedIds.has(conflictId) && !newAlerts.some(a => a.id === conflictId)) {
              newAlerts.push({
                id: conflictId,
                type: 'conflict',
                event,
                message: `"${event.title}" overlaps with "${other.title}" — consider rescheduling one`,
                urgency: 'high',
                triggeredAt: now,
                dismissed: false,
                confidence: 0.95,
                actionHint: 'Resolve conflict',
              });
            }
          }
        }
      }

      // ── Tomorrow evening reminders (with importance weighting) ──
      const currentHour = now.getHours();
      if (isEventTomorrow && currentHour >= 18 && currentHour < 21) {
        const reminderId = `reminder-${event.id}-${event.event_date}`;
        if (!dismissedIds.has(reminderId) && (isMeeting(event.title) || isHighPrepEvent(event.title))) {
          const importance = isHighPrepEvent(event.title) ? 0.9 : 0.6;
          newAlerts.push({
            id: reminderId,
            type: 'reminder',
            event,
            message: `Tomorrow: "${event.title}"${event.start_time ? ` at ${event.start_time}` : ''} — ${isHighPrepEvent(event.title) ? 'high-prep event, start preparing now' : 'set your alarm'}`,
            urgency: isHighPrepEvent(event.title) ? 'medium' : 'low',
            triggeredAt: now,
            dismissed: false,
            confidence: importance,
            actionHint: isHighPrepEvent(event.title) ? 'Prep now' : undefined,
          });
        }
      }
    });

    // ── Back-to-back burnout detection ──
    let consecutiveMeetings = 0;
    for (let i = 0; i < todayTimed.length - 1; i++) {
      const current = todayTimed[i];
      const next = todayTimed[i + 1];
      if (!current.end_time || !next.start_time) continue;
      const gap = differenceInMinutes(
        new Date(`${next.event_date}T${next.start_time}`),
        new Date(`${current.event_date}T${current.end_time}`)
      );
      if (gap <= 10) consecutiveMeetings++;
      else consecutiveMeetings = 0;

      if (consecutiveMeetings >= 2) {
        const burnoutId = `burnout-${format(now, 'yyyy-MM-dd')}`;
        if (!dismissedIds.has(burnoutId) && !newAlerts.some(a => a.id === burnoutId)) {
          newAlerts.push({
            id: burnoutId,
            type: 'burnout',
            event: todayTimed[i + 1],
            message: `${consecutiveMeetings + 1} meetings back-to-back detected — consider taking a 10min break`,
            urgency: 'medium',
            triggeredAt: now,
            dismissed: false,
            confidence: 0.85,
            actionHint: 'Add break',
          });
        }
        break;
      }
    }

    // Trigger callbacks & merge
    newAlerts.forEach(alert => {
      if (!alerts.find(a => a.id === alert.id)) {
        onAlert(alert);
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const trulyNew = newAlerts.filter(a => !existingIds.has(a.id));
        return [...prev, ...trulyNew];
      });
    }
  }, [enabled, events, dismissedIds, alerts, onAlert]);

  useEffect(() => {
    if (!enabled) {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      return;
    }
    checkForAlerts();
    checkIntervalRef.current = window.setInterval(checkForAlerts, 30000); // Every 30s for responsiveness
    return () => { if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); };
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
