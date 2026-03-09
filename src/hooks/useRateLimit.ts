import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Clock } from 'lucide-react';

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;        // time window in ms
  cooldownMs?: number;     // extra cooldown after limit is hit
  label?: string;          // display name for toast
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'ai-command':    { maxCalls: 5, windowMs: 60_000, cooldownMs: 30_000, label: 'AI commands' },
  'voice-command': { maxCalls: 10, windowMs: 60_000, cooldownMs: 15_000, label: 'Voice commands' },
  'ai-agent':      { maxCalls: 3, windowMs: 60_000, cooldownMs: 30_000, label: 'AI agent runs' },
  'meeting-intel': { maxCalls: 4, windowMs: 60_000, cooldownMs: 20_000, label: 'AI generation' },
  'analytics':     { maxCalls: 10, windowMs: 60_000, label: 'Analytics refreshes' },
};

interface RateLimitState {
  callTimestamps: number[];
  cooldownUntil: number | null;
}

export function useRateLimit(key: string) {
  const config = RATE_LIMITS[key] ?? { maxCalls: 10, windowMs: 60_000 };
  const stateRef = useRef<RateLimitState>({ callTimestamps: [], cooldownUntil: null });
  const [, forceRender] = useState(0);

  const getRemainingCalls = useCallback((): number => {
    const now = Date.now();
    const state = stateRef.current;
    if (state.cooldownUntil && now < state.cooldownUntil) return 0;

    const windowStart = now - config.windowMs;
    const recentCalls = state.callTimestamps.filter(t => t > windowStart);
    return Math.max(0, config.maxCalls - recentCalls.length);
  }, [config]);

  const getCooldownSeconds = useCallback((): number => {
    const now = Date.now();
    const state = stateRef.current;
    if (state.cooldownUntil && now < state.cooldownUntil) {
      return Math.ceil((state.cooldownUntil - now) / 1000);
    }
    if (getRemainingCalls() === 0) {
      const windowStart = now - config.windowMs;
      const earliest = stateRef.current.callTimestamps.find(t => t > windowStart);
      if (earliest) return Math.ceil((earliest + config.windowMs - now) / 1000);
    }
    return 0;
  }, [config, getRemainingCalls]);

  /**
   * Returns true if the call is allowed, false if rate-limited.
   * Call this BEFORE making the actual API request.
   */
  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    const state = stateRef.current;

    // In cooldown?
    if (state.cooldownUntil && now < state.cooldownUntil) {
      const secs = Math.ceil((state.cooldownUntil - now) / 1000);
      toast.error(`Rate limit — cooling down`, {
        description: `Try again in ${secs}s. ${config.label ?? key} is temporarily limited.`,
        icon: <Clock className="h-4 w-4 text-event-coral" />,
        duration: 4000,
      });
      return false;
    }

    // Prune old timestamps
    const windowStart = now - config.windowMs;
    state.callTimestamps = state.callTimestamps.filter(t => t > windowStart);

    if (state.callTimestamps.length >= config.maxCalls) {
      // Hit the rate limit — enter cooldown
      const cooldownDuration = config.cooldownMs ?? config.windowMs;
      state.cooldownUntil = now + cooldownDuration;
      const secs = Math.ceil(cooldownDuration / 1000);

      toast.error(`Too many ${config.label ?? key}`, {
        description: `Limit: ${config.maxCalls} per minute. Please wait ${secs}s before trying again.`,
        icon: <AlertCircle className="h-4 w-4 text-event-coral" />,
        duration: 5000,
        action: {
          label: 'Got it',
          onClick: () => {},
        },
      });
      forceRender(n => n + 1);
      return false;
    }

    // Record this call
    state.callTimestamps.push(now);
    
    // Warn when approaching limit
    const remaining = config.maxCalls - state.callTimestamps.length;
    if (remaining === 1) {
      toast.warning(`1 ${config.label ?? key} remaining`, {
        description: `You're approaching the rate limit. Limit resets in ${Math.ceil(config.windowMs / 1000)}s.`,
        duration: 3000,
      });
    }

    forceRender(n => n + 1);
    return true;
  }, [config, key]);

  return {
    checkLimit,
    remainingCalls: getRemainingCalls(),
    cooldownSeconds: getCooldownSeconds(),
    isLimited: getRemainingCalls() === 0,
    maxCalls: config.maxCalls,
  };
}
