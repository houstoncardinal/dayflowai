import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, X, Calendar, ArrowRight, Sparkles, Users, Building2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individuals getting started',
    icon: Calendar,
    cta: 'Get Started',
    ctaVariant: 'outline' as const,
    features: [
      { name: 'Unlimited events', included: true },
      { name: 'All calendar views', included: true },
      { name: 'Drag & drop scheduling', included: true },
      { name: 'Basic AI assistant', included: true },
      { name: '1 scheduling link', included: true },
      { name: 'Voice commands', included: false },
      { name: 'AI meeting notes', included: false },
      { name: 'Team workspaces', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For power users who want more',
    icon: Sparkles,
    cta: 'Get Started',
    ctaVariant: 'default' as const,
    popular: true,
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Voice commands', included: true },
      { name: 'Advanced AI assistant', included: true },
      { name: 'AI meeting notes & agendas', included: true },
      { name: 'Unlimited scheduling links', included: true },
      { name: 'Analytics dashboard', included: true },
      { name: 'Calendar integrations', included: true },
      { name: 'Priority support', included: true },
      { name: 'Team workspaces', included: false },
    ],
  },
  {
    name: 'Team',
    price: '$39',
    period: '/seat/month',
    description: 'For small teams collaborating',
    icon: Users,
    cta: 'Start Team Trial',
    ctaVariant: 'outline' as const,
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Team workspaces', included: true },
      { name: 'Shared calendars', included: true },
      { name: 'Team analytics', included: true },
      { name: 'Member management', included: true },
      { name: 'Up to 20 seats', included: true },
      { name: 'API access', included: true },
      { name: 'Webhooks', included: true },
      { name: 'SSO / SAML', included: false },
    ],
  },
  {
    name: 'Business',
    price: '$79',
    period: '/seat/month',
    description: 'For growing companies',
    icon: Building2,
    cta: 'Contact Sales',
    ctaVariant: 'outline' as const,
    features: [
      { name: 'Everything in Team', included: true },
      { name: 'Unlimited seats', included: true },
      { name: 'Advanced admin controls', included: true },
      { name: 'Audit logs', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'SSO / SAML', included: true },
      { name: '99.9% uptime SLA', included: true },
      { name: 'White-label options', included: true },
    ],
  },
];

const enterprisePlan = {
  name: 'Enterprise',
  price: 'Custom',
  period: 'starting at $149/seat',
  description: 'For large organizations with custom needs',
  icon: Crown,
  features: [
    'Everything in Business',
    'Dedicated infrastructure',
    'Custom AI model training',
    'White-label & embed',
    'On-premise deployment option',
    'Custom SLA & support',
    'Compliance readiness support',
    'Volume discounts',
  ],
};

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-foreground flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-background" />
            </div>
            <span className="font-semibold text-base md:text-lg">Dayflow</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-28 pb-16 px-4 md:px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing</span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mt-4 mb-4">
            Plans for every team size
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free, scale as you grow. No credit card required.
          </p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 md:px-6 pb-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl p-6 border relative ${
                plan.popular
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background text-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <plan.icon className={`h-6 w-6 mb-3 ${plan.popular ? 'text-background/70' : 'text-muted-foreground'}`} />
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? 'text-background/60' : 'text-muted-foreground'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mt-2 ${plan.popular ? 'text-background/60' : 'text-muted-foreground'}`}>{plan.description}</p>
              </div>

              <Link to="/auth">
                <Button
                  variant={plan.popular ? 'secondary' : plan.ctaVariant}
                  className={`w-full mb-6 ${plan.popular ? 'bg-background text-foreground hover:bg-background/90' : ''}`}
                >
                  {plan.cta}
                </Button>
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <Check className={`h-4 w-4 shrink-0 ${plan.popular ? 'text-background/70' : 'text-emerald-500'}`} />
                    ) : (
                      <X className={`h-4 w-4 shrink-0 ${plan.popular ? 'text-background/30' : 'text-muted-foreground/30'}`} />
                    )}
                    <span className={!feature.included ? (plan.popular ? 'text-background/40' : 'text-muted-foreground/50') : ''}>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="px-4 md:px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-secondary/50 rounded-2xl p-8 md:p-12 border border-border"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-amber-500" />
                <h2 className="text-2xl font-bold">{enterprisePlan.name}</h2>
              </div>
              <p className="text-3xl font-bold mb-1">{enterprisePlan.price}</p>
              <p className="text-sm text-muted-foreground mb-2">{enterprisePlan.period}</p>
              <p className="text-muted-foreground mb-6">{enterprisePlan.description}</p>
              <Button size="lg" className="gap-2">
                Contact Sales <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-3">
              {enterprisePlan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="font-semibold">Dayflow</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Dayflow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
