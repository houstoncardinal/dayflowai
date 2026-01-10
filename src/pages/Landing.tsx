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
  Sun,
  Star,
  Heart,
  Rocket,
  Bell,
  Target,
  Coffee,
  PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: Layers,
    title: 'Multiple Views',
    description: 'Switch seamlessly between month, week, and day views to plan at any scale.',
    color: 'from-event-coral to-event-rose',
    bgColor: 'bg-event-coral/10',
  },
  {
    icon: GripVertical,
    title: 'Drag & Drop',
    description: 'Effortlessly reschedule events by dragging them to new dates or times.',
    color: 'from-event-teal to-event-emerald',
    bgColor: 'bg-event-teal/10',
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Your events sync instantly across all devices, always up to date.',
    color: 'from-event-amber to-event-coral',
    bgColor: 'bg-event-amber/10',
  },
  {
    icon: Sparkles,
    title: 'Beautiful Design',
    description: 'A clean, modern interface that makes scheduling feel delightful.',
    color: 'from-event-violet to-primary',
    bgColor: 'bg-event-violet/10',
  },
  {
    icon: Clock,
    title: 'Hour-by-Hour',
    description: 'Detailed time slots for precise scheduling down to the minute.',
    color: 'from-event-emerald to-event-teal',
    bgColor: 'bg-event-emerald/10',
  },
  {
    icon: Users,
    title: 'Personal Calendars',
    description: 'Your private calendar, secured with authentication.',
    color: 'from-event-rose to-event-violet',
    bgColor: 'bg-event-rose/10',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Designer',
    content: 'Dayflow transformed how I organize my week. The drag-and-drop is incredibly intuitive.',
    avatar: 'SC',
    color: 'bg-gradient-to-br from-event-coral to-event-rose',
  },
  {
    name: 'Marcus Johnson',
    role: 'Startup Founder',
    content: 'Finally, a calendar that looks as good as it works. My team loves it.',
    avatar: 'MJ',
    color: 'bg-gradient-to-br from-event-teal to-event-emerald',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Freelance Writer',
    content: 'The week view with hour slots is perfect for managing my writing schedule.',
    avatar: 'ER',
    color: 'bg-gradient-to-br from-event-violet to-primary',
  },
];

const floatingIcons = [
  { icon: Star, color: 'text-event-amber', delay: 0, x: '10%', y: '20%' },
  { icon: Heart, color: 'text-event-rose', delay: 0.5, x: '85%', y: '15%' },
  { icon: Rocket, color: 'text-event-violet', delay: 1, x: '75%', y: '70%' },
  { icon: Bell, color: 'text-event-teal', delay: 1.5, x: '15%', y: '75%' },
  { icon: Coffee, color: 'text-event-coral', delay: 2, x: '90%', y: '45%' },
  { icon: Target, color: 'text-event-emerald', delay: 2.5, x: '5%', y: '50%' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-event-coral/20 to-event-rose/10 blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-event-violet/20 to-primary/10 blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-event-teal/20 to-event-emerald/10 blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -50, 0],
            y: [0, 60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-event-amber/15 to-event-coral/10 blur-3xl"
        />
      </div>

      {/* Floating Icons */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
            y: [0, -20, 0],
          }}
          transition={{ 
            duration: 4,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="fixed pointer-events-none z-0"
          style={{ left: item.x, top: item.y }}
        >
          <item.icon className={`h-8 w-8 ${item.color}`} />
        </motion.div>
      ))}

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-event-coral via-event-violet to-primary flex items-center justify-center shadow-lg"
            >
              <Sun className="h-5 w-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl bg-gradient-to-r from-event-coral via-event-violet to-primary bg-clip-text text-transparent">
              Dayflow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/demo">
              <Button variant="ghost" className="hover:bg-event-violet/10">Try Demo</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-event-coral via-event-violet to-primary hover:opacity-90 shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 z-10">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-event-coral/20 via-event-violet/20 to-primary/20 text-foreground text-sm font-medium mb-6 border border-event-violet/30"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <PartyPopper className="h-4 w-4 text-event-coral" />
              </motion.div>
              Your day, your flow
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-event-violet" />
              </motion.div>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-event-coral via-event-rose to-event-violet bg-clip-text text-transparent">
                Schedule smarter.
              </span>
              <br />
              <span className="bg-gradient-to-r from-event-violet via-primary to-event-teal bg-clip-text text-transparent">
                Live better.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              The modern calendar app that adapts to your life. Drag, drop, and flow through your days with 
              <span className="text-event-coral font-medium"> effortless </span>
              <span className="text-event-violet font-medium">elegance</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="gap-2 text-lg px-8 h-14 rounded-xl shadow-xl bg-gradient-to-r from-event-coral via-event-violet to-primary hover:opacity-90">
                    Start for Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/demo">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-14 rounded-xl border-2 border-event-violet/30 hover:bg-event-violet/10 hover:border-event-violet">
                    <CalendarDays className="h-5 w-5 text-event-violet" />
                    Try Demo
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Hero Calendar Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-event-coral/10 via-event-violet/10 to-event-teal/10 px-6 py-4 border-b border-border/50 flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.2 }} className="w-3 h-3 rounded-full bg-event-coral cursor-pointer" />
                <motion.div whileHover={{ scale: 1.2 }} className="w-3 h-3 rounded-full bg-event-amber cursor-pointer" />
                <motion.div whileHover={{ scale: 1.2 }} className="w-3 h-3 rounded-full bg-event-emerald cursor-pointer" />
                <span className="ml-4 text-sm font-medium text-muted-foreground">January 2026</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={day} className={`text-center text-sm font-semibold py-2 ${i === 0 || i === 6 ? 'text-event-rose' : 'text-foreground'}`}>
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.01 }}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      className={`aspect-square rounded-xl p-2 text-sm transition-all cursor-pointer
                        ${i === 9 ? 'bg-gradient-to-br from-event-teal/20 to-event-emerald/20 ring-2 ring-event-teal' : ''}
                        ${i === 14 ? 'bg-gradient-to-br from-event-coral/20 to-event-rose/20 ring-2 ring-event-coral' : ''}
                        ${i === 17 ? 'bg-gradient-to-br from-event-violet/20 to-primary/20 ring-2 ring-event-violet' : ''}
                        ${i === 22 ? 'bg-gradient-to-br from-event-amber/20 to-event-coral/20 ring-2 ring-event-amber' : ''}
                        ${![9, 14, 17, 22].includes(i) ? 'bg-secondary/30 hover:bg-secondary/60' : ''}
                      `}
                    >
                      <span className={`font-medium ${i === 9 ? 'text-event-teal' : i === 14 ? 'text-event-coral' : i === 17 ? 'text-event-violet' : i === 22 ? 'text-event-amber' : 'text-muted-foreground'}`}>
                        {(i % 31) + 1}
                      </span>
                      {i === 9 && (
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="mt-1 text-xs bg-gradient-to-r from-event-teal to-event-emerald text-white rounded-md px-1.5 py-0.5 truncate font-medium shadow-sm"
                        >
                          🎯 Team Sync
                        </motion.div>
                      )}
                      {i === 14 && (
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.9 }}
                          className="mt-1 text-xs bg-gradient-to-r from-event-coral to-event-rose text-white rounded-md px-1.5 py-0.5 truncate font-medium shadow-sm"
                        >
                          🚀 Launch!
                        </motion.div>
                      )}
                      {i === 17 && (
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="mt-1 text-xs bg-gradient-to-r from-event-violet to-primary text-white rounded-md px-1.5 py-0.5 truncate font-medium shadow-sm"
                        >
                          ✨ Review
                        </motion.div>
                      )}
                      {i === 22 && (
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.1 }}
                          className="mt-1 text-xs bg-gradient-to-r from-event-amber to-event-coral text-white rounded-md px-1.5 py-0.5 truncate font-medium shadow-sm"
                        >
                          ☕ Coffee
                        </motion.div>
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
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Sparkles className="h-10 w-10 text-event-violet" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-event-coral via-event-violet to-event-teal bg-clip-text text-transparent">
              Everything you need
            </h2>
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
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg transition-all hover:shadow-2xl group"
              >
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className={`h-14 w-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`h-7 w-7 bg-gradient-to-br ${feature.color} bg-clip-text`} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' }} />
                </motion.div>
                <h3 className={`text-xl font-bold mb-2 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Heart className="h-10 w-10 text-event-rose" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-event-rose via-event-coral to-event-amber bg-clip-text text-transparent">
              Loved by productive people
            </h2>
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
                whileHover={{ y: -4 }}
                className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg"
              >
                <div className="flex mb-4 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <Star className="h-5 w-5 fill-event-amber text-event-amber" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-lg mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full ${testimonial.color} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Rocket className="h-10 w-10 text-event-violet" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-event-violet via-primary to-event-teal bg-clip-text text-transparent">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you need more.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="bg-card/80 backdrop-blur-sm rounded-3xl p-8 border border-border/50 shadow-lg"
            >
              <h3 className="text-2xl font-bold mb-2 text-foreground">Free</h3>
              <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-event-teal to-event-emerald bg-clip-text text-transparent">
                $0<span className="text-lg text-muted-foreground font-normal">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">Perfect for personal use</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited events', 'All calendar views', 'Drag & drop', 'Real-time sync'].map((item, i) => (
                  <motion.li 
                    key={item} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-6 w-6 rounded-full bg-event-emerald/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-event-emerald" />
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="w-full h-12 text-lg rounded-xl border-2 hover:bg-event-teal/10 hover:border-event-teal">
                  Get Started
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-event-violet/10 via-primary/10 to-event-coral/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-event-violet/50 relative shadow-xl"
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-event-coral via-event-violet to-primary text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg"
              >
                ✨ Popular
              </motion.div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">Pro</h3>
              <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-event-violet via-primary to-event-coral bg-clip-text text-transparent">
                $9<span className="text-lg text-muted-foreground font-normal">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">For power users</p>
              <ul className="space-y-3 mb-8">
                {['Everything in Free', 'Calendar sharing', 'Recurring events', 'Priority support', 'Custom themes'].map((item, i) => (
                  <motion.li 
                    key={item} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-6 w-6 rounded-full bg-event-violet/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-event-violet" />
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full h-12 text-lg rounded-xl bg-gradient-to-r from-event-coral via-event-violet to-primary hover:opacity-90 shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <Sun className="h-16 w-16 text-event-amber" />
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-event-amber via-event-coral to-event-rose bg-clip-text text-transparent">
            Ready to flow?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of productive people who've transformed their scheduling.
          </p>
          <Link to="/auth">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Button size="lg" className="gap-2 text-lg px-10 h-16 rounded-2xl shadow-2xl bg-gradient-to-r from-event-coral via-event-violet to-primary hover:opacity-90">
                Get Started for Free
                <ArrowRight className="h-6 w-6" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-event-coral via-event-violet to-primary flex items-center justify-center shadow-lg">
              <Sun className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-event-coral via-event-violet to-primary bg-clip-text text-transparent">
              Dayflow
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Dayflow. Made with 💜 for productivity lovers.
          </p>
        </div>
      </footer>
    </div>
  );
}