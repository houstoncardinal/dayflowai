import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Sparkles, 
  Zap, 
  Layers, 
  Clock, 
  Users,
  ArrowRight,
  Check,
  GripVertical,
  CalendarDays,
  Star,
  Quote,
  Crown,
  Mic,
  Bell,
  Brain,
  BarChart3,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: Mic,
    title: 'Voice Control',
    description: 'Create events hands-free with natural voice commands.',
    highlight: 'NEW',
  },
  {
    icon: Brain,
    title: 'AI Assistant',
    description: 'Get intelligent suggestions and schedule optimization.',
    highlight: 'SMART',
  },
  {
    icon: Bell,
    title: 'Proactive Alerts',
    description: 'Never miss important deadlines with smart notifications.',
    highlight: '',
  },
  {
    icon: Layers,
    title: 'Multiple Views',
    description: 'Switch between month, week, and day views seamlessly.',
    highlight: '',
  },
  {
    icon: GripVertical,
    title: 'Drag & Drop',
    description: 'Effortlessly reschedule events with intuitive gestures.',
    highlight: '',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track productivity and optimize your time allocation.',
    highlight: 'PRO',
  },
];

const testimonials = [
  {
    name: 'Alexandra Chen',
    role: 'CEO, TechVentures',
    content: 'Dayflow has completely transformed how I manage my executive calendar. The voice commands save me hours every week.',
    rating: 5,
  },
  {
    name: 'Marcus Williams',
    role: 'Creative Director',
    content: 'The most elegant calendar app I\'ve ever used. It\'s like having a personal assistant that actually understands me.',
    rating: 5,
  },
  {
    name: 'Sofia Rodriguez',
    role: 'Entrepreneur',
    content: 'The proactive alerts are game-changing. I never miss a deadline or important prep time anymore.',
    rating: 5,
  },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '2M+', label: 'Events Created' },
  { value: '4.9', label: 'App Rating' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Landing() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/8 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-tl from-gold/6 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-event-violet/6 to-transparent blur-3xl" />
        
        {/* Elegant grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Premium Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto glass-premium rounded-2xl px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 group">
                <motion.div 
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.6 }}
                  className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold"
                >
                  <CalendarDays className="h-5 w-5 text-white" />
                </motion.div>
                <span className="font-display text-xl font-bold text-foreground">
                  Dayflow
                </span>
              </Link>
              
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Reviews
                </a>
                <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link to="/demo">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Try Demo
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-gradient-gold hover:opacity-90 text-white shadow-gold font-medium">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-40 pb-32 px-6 z-10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Premium badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-premium border-gold mb-8"
            >
              <Crown className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium">Introducing Dayflow 2.0 with Voice AI</span>
              <span className="shimmer px-2 py-0.5 rounded-full bg-gradient-gold text-white text-xs font-bold">
                NEW
              </span>
            </motion.div>
            
            <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.95]">
              <span className="text-foreground">Your time,</span>
              <br />
              <span className="text-gradient-gold">elevated.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              The premium calendar experience with voice control, AI intelligence, and proactive scheduling that adapts to your life.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="gap-3 text-lg px-10 h-16 rounded-2xl bg-gradient-gold hover:opacity-90 text-white shadow-gold font-medium">
                    Start Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/demo">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" variant="outline" className="gap-3 text-lg px-10 h-16 rounded-2xl border-2 font-medium">
                    <Play className="h-5 w-5" />
                    Watch Demo
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-border/50"
            >
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                ))}
                <span className="ml-2 text-sm font-medium">4.9/5 rating</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <span className="hidden sm:block text-sm text-muted-foreground">Trusted by 50,000+ professionals</span>
            </motion.div>
          </motion.div>

          {/* Hero Calendar Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-gold/20 via-primary/20 to-event-violet/20 rounded-[2rem] blur-2xl opacity-50" />
            
            <div className="relative glass-premium rounded-3xl shadow-premium overflow-hidden border border-gold/10">
              {/* Window controls */}
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-event-rose" />
                  <div className="w-3 h-3 rounded-full bg-gold" />
                  <div className="w-3 h-3 rounded-full bg-event-emerald" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">January 2026</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mic className="h-4 w-4 text-gold" />
                  <span>Voice Active</span>
                </div>
              </div>

              {/* Calendar content */}
              <div className="p-8">
                <div className="grid grid-cols-7 gap-3">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={day} className={`text-center text-sm font-semibold py-3 ${i === 0 || i === 6 ? 'text-event-rose' : 'text-muted-foreground'}`}>
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const hasEvent = [8, 12, 15, 22, 26].includes(i);
                    const eventColors = ['bg-gradient-gold', 'bg-gradient-to-r from-primary to-event-violet', 'bg-gradient-to-r from-event-coral to-event-rose', 'bg-gradient-to-r from-event-teal to-event-emerald', 'bg-gradient-to-r from-event-amber to-gold'];
                    const eventLabels = ['Board Meeting', 'Design Review', 'Launch Day ✨', 'Team Sync', 'Strategy'];
                    const eventIndex = [8, 12, 15, 22, 26].indexOf(i);
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.01 }}
                        className={`aspect-square rounded-2xl p-2 text-sm transition-all cursor-pointer hover:ring-2 hover:ring-gold/30
                          ${hasEvent ? 'bg-secondary/50' : 'hover:bg-secondary/30'}
                        `}
                      >
                        <span className={`font-medium ${hasEvent ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {(i % 31) + 1}
                        </span>
                        {hasEvent && (
                          <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.8 + eventIndex * 0.1 }}
                            className={`mt-1.5 text-[10px] ${eventColors[eventIndex]} text-white rounded-lg px-2 py-1 truncate font-medium shadow-sm`}
                          >
                            {eventLabels[eventIndex]}
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-4xl md:text-5xl font-bold text-gradient-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-sm font-medium text-gold uppercase tracking-wider">Features</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold mt-4 mb-6">
              Everything you need,
              <br />
              <span className="text-gradient-gold">nothing you don't.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed with simplicity in mind. Get more done with less effort.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-card rounded-3xl p-8 border border-border hover:border-gold/30 hover-lift"
              >
                {feature.highlight && (
                  <span className="absolute top-6 right-6 text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-gold text-white">
                    {feature.highlight}
                  </span>
                )}
                <div className="h-14 w-14 rounded-2xl bg-gradient-gold/10 flex items-center justify-center mb-6 group-hover:bg-gradient-gold group-hover:shadow-gold transition-all duration-300">
                  <feature.icon className="h-7 w-7 text-gold group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 px-6 relative z-10 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-sm font-medium text-gold uppercase tracking-wider">Testimonials</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold mt-4 mb-6">
              Loved by <span className="text-gradient-gold">leaders</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what professionals are saying about Dayflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-3xl p-8 border border-border hover-lift"
              >
                <Quote className="h-10 w-10 text-gold/30 mb-6" />
                <p className="text-lg mb-8 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-gold flex items-center justify-center text-white font-bold shadow-gold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mt-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-sm font-medium text-gold uppercase tracking-wider">Pricing</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold mt-4 mb-6">
              Simple, <span className="text-gradient-gold">transparent</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free. Upgrade when you're ready.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-8">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-3xl p-10 border border-border hover-lift"
            >
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-5xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mb-8">Perfect for getting started</p>
              <ul className="space-y-4 mb-10">
                {['Unlimited events', 'All calendar views', 'Drag & drop scheduling', 'Real-time sync', 'Basic AI assistant'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-event-emerald/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-event-emerald" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="w-full h-14 text-lg rounded-2xl border-2 font-medium">
                  Get Started
                </Button>
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative bg-card rounded-3xl p-10 border-2 border-gold/50 shadow-gold hover-lift"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-gold text-white text-sm font-bold px-6 py-2 rounded-full shadow-gold">
                <Crown className="h-4 w-4 inline mr-2" />
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-5xl font-bold text-gradient-gold">$9</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mb-8">For power users who want more</p>
              <ul className="space-y-4 mb-10">
                {['Everything in Free', 'Voice control', 'Proactive alerts', 'Advanced analytics', 'Calendar integrations', 'Priority support'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full h-14 text-lg rounded-2xl bg-gradient-gold hover:opacity-90 text-white shadow-gold font-medium">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-block mb-8"
          >
            <div className="h-20 w-20 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold mx-auto">
              <CalendarDays className="h-10 w-10 text-white" />
            </div>
          </motion.div>
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
            Ready to take control
            <br />
            <span className="text-gradient-gold">of your time?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of professionals who've transformed their productivity with Dayflow.
          </p>
          <Link to="/auth">
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Button size="lg" className="gap-3 text-lg px-12 h-16 rounded-2xl bg-gradient-gold hover:opacity-90 text-white shadow-gold font-medium">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold">Dayflow</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Dayflow. Crafted with precision.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
