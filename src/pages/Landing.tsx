import { motion } from 'framer-motion';
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
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Layers,
    title: 'Multiple Views',
    description: 'Switch seamlessly between month, week, and day views to plan at any scale.',
  },
  {
    icon: GripVertical,
    title: 'Drag & Drop',
    description: 'Effortlessly reschedule events by dragging them to new dates or times.',
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Your events sync instantly across all devices, always up to date.',
  },
  {
    icon: Sparkles,
    title: 'Beautiful Design',
    description: 'A clean, modern interface that makes scheduling feel delightful.',
  },
  {
    icon: Clock,
    title: 'Hour-by-Hour',
    description: 'Detailed time slots for precise scheduling down to the minute.',
  },
  {
    icon: Users,
    title: 'Personal Calendars',
    description: 'Your private calendar, secured with authentication.',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Designer',
    content: 'Dayflow transformed how I organize my week. The drag-and-drop is incredibly intuitive.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Johnson',
    role: 'Startup Founder',
    content: 'Finally, a calendar that looks as good as it works. My team loves it.',
    avatar: 'MJ',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Freelance Writer',
    content: 'The week view with hour slots is perfect for managing my writing schedule.',
    avatar: 'ER',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Sun className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Dayflow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/demo">
              <Button variant="ghost">Try Demo</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Your day, your flow
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text">
              Schedule smarter.
              <br />
              <span className="text-primary">Live better.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              The modern calendar app that adapts to your life. Drag, drop, and flow through your days with effortless elegance.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2 text-lg px-8 h-14 rounded-xl shadow-calendar-lg">
                  Start for Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-14 rounded-xl">
                  <CalendarDays className="h-5 w-5" />
                  Try Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-card rounded-2xl shadow-calendar-lg border border-border overflow-hidden">
              <div className="bg-secondary/50 px-6 py-4 border-b border-border flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-event-amber/60" />
                <div className="w-3 h-3 rounded-full bg-event-emerald/60" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.01 }}
                      className="aspect-square rounded-lg bg-secondary/30 p-2 text-sm"
                    >
                      <span className="text-muted-foreground">{(i % 31) + 1}</span>
                      {i === 10 && (
                        <div className="mt-1 text-xs bg-event-teal text-white rounded px-1 truncate">
                          Meeting
                        </div>
                      )}
                      {i === 15 && (
                        <div className="mt-1 text-xs bg-event-coral text-white rounded px-1 truncate">
                          Launch
                        </div>
                      )}
                      {i === 18 && (
                        <div className="mt-1 text-xs bg-event-violet text-white rounded px-1 truncate">
                          Review
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make scheduling effortless and enjoyable.
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
                whileHover={{ y: -4 }}
                className="bg-card rounded-2xl p-6 border border-border shadow-calendar transition-shadow hover:shadow-calendar-lg"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Loved by productive people</h2>
            <p className="text-xl text-muted-foreground">
              See what our users have to say about Dayflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border"
              >
                <p className="text-lg mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you need more.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border border-border"
            >
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-muted-foreground font-normal">/month</span></div>
              <p className="text-muted-foreground mb-6">Perfect for personal use</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited events', 'All calendar views', 'Drag & drop', 'Real-time sync'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-event-emerald" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border-2 border-primary relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-4">$9<span className="text-lg text-muted-foreground font-normal">/month</span></div>
              <p className="text-muted-foreground mb-6">For power users</p>
              <ul className="space-y-3 mb-8">
                {['Everything in Free', 'Calendar sharing', 'Recurring events', 'Priority support', 'Custom themes'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-event-emerald" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full">Start Free Trial</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to flow?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of productive people who've transformed their scheduling.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2 text-lg px-8 h-14 rounded-xl shadow-calendar-lg">
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sun className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Dayflow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Dayflow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
