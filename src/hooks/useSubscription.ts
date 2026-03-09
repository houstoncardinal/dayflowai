import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type Plan = 'free' | 'pro' | 'team' | 'business' | 'enterprise';

export type Feature = 
  | 'voice-commands'
  | 'ai-agents'
  | 'team-workspace'
  | 'api-webhooks'
  | 'analytics'
  | 'meeting-intelligence'
  | 'scheduling-links'
  | 'automation-workflows';

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  free: ['scheduling-links'],
  pro: ['scheduling-links', 'voice-commands', 'ai-agents', 'meeting-intelligence', 'automation-workflows'],
  team: ['scheduling-links', 'voice-commands', 'ai-agents', 'meeting-intelligence', 'automation-workflows', 'team-workspace', 'analytics'],
  business: ['scheduling-links', 'voice-commands', 'ai-agents', 'meeting-intelligence', 'automation-workflows', 'team-workspace', 'analytics', 'api-webhooks'],
  enterprise: ['scheduling-links', 'voice-commands', 'ai-agents', 'meeting-intelligence', 'automation-workflows', 'team-workspace', 'analytics', 'api-webhooks'],
};

export function useSubscription() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .single();

      if (data && data.status === 'active') {
        setPlan(data.plan as Plan);
      } else {
        setPlan('free');
      }
      setLoading(false);
    };

    fetchSubscription();
  }, [user]);

  const canAccess = (feature: Feature): boolean => {
    return PLAN_FEATURES[plan].includes(feature);
  };

  const getUpgradePlan = (feature: Feature): Plan => {
    // Find the cheapest plan that has this feature
    const plans: Plan[] = ['pro', 'team', 'business', 'enterprise'];
    for (const p of plans) {
      if (PLAN_FEATURES[p].includes(feature)) {
        return p;
      }
    }
    return 'pro';
  };

  return {
    plan,
    loading,
    canAccess,
    getUpgradePlan,
    isPro: plan !== 'free',
    isTeam: ['team', 'business', 'enterprise'].includes(plan),
    isBusiness: ['business', 'enterprise'].includes(plan),
    isEnterprise: plan === 'enterprise',
  };
}
