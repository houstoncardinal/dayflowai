import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useSubscription, Feature, Plan } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
}

const FEATURE_NAMES: Record<Feature, string> = {
  'voice-commands': 'Voice Commands',
  'ai-agents': 'AI Agents',
  'team-workspace': 'Team Workspace',
  'api-webhooks': 'API & Webhooks',
  'analytics': 'Analytics Dashboard',
  'meeting-intelligence': 'AI Meeting Intelligence',
  'scheduling-links': 'Scheduling Links',
  'automation-workflows': 'Automation Workflows',
};

const PLAN_PRICES: Record<Plan, string> = {
  free: '$0',
  pro: '$19/mo',
  team: '$39/seat',
  business: '$79/seat',
  enterprise: 'Custom',
};

export function FeatureGate({ feature, children, fallback, showDialog = false }: FeatureGateProps) {
  const { canAccess, getUpgradePlan, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) return null;

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  const requiredPlan = getUpgradePlan(feature);

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative"
    >
      <div className="pointer-events-none opacity-50 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-card border-2 border-event-amber rounded-xl shadow-xl p-6 max-w-sm text-center"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-event-amber to-event-coral mb-3">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-event-amber" />
            {FEATURE_NAMES[feature]}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to <strong className="text-foreground">{requiredPlan.toUpperCase()}</strong> to unlock this feature
          </p>
          <Badge variant="outline" className="mb-4 border-event-amber text-event-amber">
            {PLAN_PRICES[requiredPlan]}
          </Badge>
          <Button
            onClick={() => navigate('/pricing')}
            className="w-full bg-gradient-to-r from-event-amber to-event-coral text-white hover:opacity-90"
          >
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function FeatureGateDialog({
  feature,
  open,
  onOpenChange,
}: {
  feature: Feature;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { getUpgradePlan } = useSubscription();
  const navigate = useNavigate();
  const requiredPlan = getUpgradePlan(feature);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-event-amber to-event-coral flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center">
            Upgrade to {requiredPlan.toUpperCase()}
          </DialogTitle>
          <DialogDescription className="text-center">
            <strong className="text-foreground">{FEATURE_NAMES[feature]}</strong> is available on the {requiredPlan} plan and above.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-event-amber">{PLAN_PRICES[requiredPlan]}</p>
            <p className="text-xs text-muted-foreground mt-1">per month</p>
          </div>
          <Button
            onClick={() => {
              navigate('/pricing');
              onOpenChange(false);
            }}
            className="w-full bg-gradient-to-r from-event-amber to-event-coral text-white hover:opacity-90"
          >
            View Pricing Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
