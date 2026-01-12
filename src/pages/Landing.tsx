import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight,
  Check,
  X,
  Calendar,
  Mic,
  Brain,
  Bell,
  Sparkles,
  ChevronRight,
  Star,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import heroIllustration from '@/assets/hero-illustration.png';

const features = [
  {
    icon: Calendar,
    title: 'Intuitive Scheduling',
    description: 'Drag and drop events across month, week, and day views with effortless precision.',
  },
  {
    icon: Mic,
    title: 'Voice Commands',
    description: 'Create events hands-free. Just speak naturally and let AI handle the rest.',
  },
  {
    icon: Brain,
    title: 'Smart Assistant',
    description: 'Get intelligent suggestions and let AI optimize your schedule automatically.',
  },
  {
    icon: Bell,
    title: 'Proactive Alerts',
    description: 'Never miss a deadline with smart notifications that know what matters.',
  },
];

const testimonials = [
  {
    quote: "The cleanest calendar app I've ever used. It just works.",
    author: 'Sarah Chen',
    role: 'Product Lead at Stripe',
  },
  {
    quote: 'Voice commands changed how I schedule. Absolute game-changer.',
    author: 'Marcus Johnson',
    role: 'Founder, Velocity',
  },
  {
    quote: 'Finally, a calendar that feels like it was designed in 2026.',
    author: 'Elena Rodriguez',
    role: 'Creative Director',
  },
];

// Comparison table data
const comparisonFeatures = [
  { name: 'Unlimited events', free: true, pro: true },
  { name: 'All calendar views', free: true, pro: true },
  { name: 'Drag & drop scheduling', free: true, pro: true },
  { name: 'Real-time sync', free: true, pro: true },
  { name: 'Voice commands', free: false, pro: true },
  { name: 'AI assistant', free: 'Basic', pro: 'Advanced' },
  { name: 'Proactive alerts', free: false, pro: true },
  { name: 'Analytics dashboard', free: false, pro: true },
  { name: 'Calendar integrations', free: false, pro: true },
  { name: 'Priority support', free: false, pro: true },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <Calendar className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold text-lg">Dayflow</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Reviews
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/demo">
              <Button variant="ghost" size="sm">Demo</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Get Started
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Illustration */}
      <section className="pt-32 pb-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm mb-8"
              >
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Now with Voice AI</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight mb-6 leading-[1.1]"
              >
                Your calendar,
                <br />
                <span className="text-muted-foreground">simplified.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
              >
                A beautifully minimal calendar with voice control, AI intelligence, and proactive scheduling that adapts to how you work.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center gap-4"
              >
                <Link to="/auth">
                  <Button size="lg" className="h-12 px-6 rounded-xl">
                    Start Free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button size="lg" variant="outline" className="h-12 px-6 rounded-xl">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Demo
                  </Button>
                </Link>
              </motion.div>

              {/* Social Proof */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-6 mt-12 pt-8 border-t border-border"
              >
                <div className="flex -space-x-2">
                  {['SC', 'MJ', 'ER', 'AK'].map((initials, i) => (
                    <div 
                      key={i}
                      className="h-8 w-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-foreground font-medium">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    4.9/5
                  </div>
                  <span className="text-muted-foreground">from 2,000+ reviews</span>
                </div>
              </motion.div>
            </div>

            {/* Right Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative lg:pl-8"
            >
              <div className="relative">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-event-violet/5 rounded-3xl blur-3xl" />
                <img 
                  src={heroIllustration} 
                  alt="Dayflow calendar interface" 
                  className="relative w-full max-w-lg mx-auto lg:max-w-none drop-shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-xl mb-16"
          >
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Features</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4 mb-4">
              Everything you need.
              <br />
              Nothing you don't.
            </h2>
            <p className="text-muted-foreground">
              Powerful features designed with simplicity in mind.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-8 border border-border hover-lift"
              >
                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-6">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reviews</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4">
              Loved by thousands
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-8 border border-border"
              >
                <div className="flex gap-0.5 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section with Comparison Table */}
      <section id="pricing" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start free and upgrade when you're ready for more power.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
            {/* Free Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="bg-card rounded-2xl p-8 border border-border"
            >
              <h3 className="text-xl font-semibold mb-1">Free</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Perfect for getting started</p>
              <Link to="/auth">
                <Button variant="outline" className="w-full h-11 rounded-xl">
                  Get Started
                </Button>
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-foreground text-background rounded-2xl p-8 relative"
            >
              <div className="absolute top-4 right-4 text-xs font-medium bg-background text-foreground px-2 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-1">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-background/60">/month</span>
              </div>
              <p className="text-sm text-background/60 mb-6">For power users</p>
              <Link to="/auth">
                <Button className="w-full h-11 rounded-xl bg-background text-foreground hover:bg-background/90">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-2xl border border-border overflow-hidden max-w-3xl mx-auto"
          >
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Compare plans</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Feature</th>
                    <th className="text-center py-4 px-6 text-sm font-medium w-32">Free</th>
                    <th className="text-center py-4 px-6 text-sm font-medium w-32 bg-secondary/50">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <motion.tr 
                      key={feature.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-4 px-6 text-sm">{feature.name}</td>
                      <td className="py-4 px-6 text-center">
                        {feature.free === true ? (
                          <Check className="h-4 w-4 text-event-emerald mx-auto" />
                        ) : feature.free === false ? (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{feature.free}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center bg-secondary/50">
                        {feature.pro === true ? (
                          <Check className="h-4 w-4 text-event-emerald mx-auto" />
                        ) : feature.pro === false ? (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-xs font-medium">{feature.pro}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-display text-3xl md:text-5xl mb-6">
            Ready to simplify
            <br />
            your schedule?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of professionals who've upgraded their productivity.
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-12 px-8 rounded-xl">
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="font-semibold">Dayflow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Dayflow
          </p>
        </div>
      </footer>
    </div>
  );
}
