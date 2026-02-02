import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Mic, Sparkles, Bell, Plus } from 'lucide-react';

const mockEvents = [
  { time: '9:00 AM', title: 'Team Standup', color: 'bg-[hsl(var(--event-teal))]', duration: 1 },
  { time: '10:30 AM', title: 'Design Review', color: 'bg-[hsl(var(--event-violet))]', duration: 2 },
  { time: '2:00 PM', title: 'Client Call', color: 'bg-[hsl(var(--event-coral))]', duration: 1.5 },
  { time: '4:30 PM', title: 'Focus Time', color: 'bg-[hsl(var(--event-emerald))]', duration: 2 },
];

const miniCalendarDays = [
  [28, 29, 30, 31, 1, 2, 3],
  [4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30, 1],
];

export const HeroCalendarPreview = forwardRef<HTMLDivElement>(function HeroCalendarPreview(_, ref) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
      style={{ perspective: '1000px' }}
    >
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-[hsl(var(--event-violet)/0.2)] via-[hsl(var(--event-teal)/0.1)] to-[hsl(var(--event-coral)/0.2)] rounded-[2.5rem] blur-3xl opacity-60" />
      
      {/* Main container */}
      <div className="relative bg-card border border-border rounded-2xl shadow-clean-xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--event-rose))]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--event-amber))]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--event-emerald))]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1 bg-background rounded-md text-xs text-muted-foreground">
              <span className="hidden sm:inline">dayflow.app</span>
              <span className="sm:hidden">dayflow</span>
            </div>
          </div>
          <div className="w-10" />
        </div>

        {/* App header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="font-semibold text-sm">Dayflow</span>
          </div>
          <div className="flex items-center gap-1">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
              className="h-7 w-7 rounded-lg bg-[hsl(var(--event-violet)/0.1)] flex items-center justify-center"
            >
              <Mic className="h-3.5 w-3.5 text-[hsl(var(--event-violet))]" />
            </motion.div>
            <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden sm:block w-48 border-r border-border bg-background p-3">
            {/* Add event button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full flex items-center gap-2 px-3 py-2 mb-4 bg-foreground text-background rounded-lg text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              New Event
            </motion.button>

            {/* Mini calendar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">February 2026</span>
                <div className="flex gap-1">
                  <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-[10px]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-muted-foreground py-1">{day}</div>
                ))}
                {miniCalendarDays.flat().map((day, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.01 }}
                    className={`text-center py-1 rounded ${
                      day === 15 
                        ? 'bg-foreground text-background font-semibold' 
                        : i < 4 || i > 30 
                          ? 'text-muted-foreground/40' 
                          : 'text-foreground'
                    }`}
                  >
                    {day}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI suggestion card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="p-3 rounded-lg bg-gradient-to-br from-[hsl(var(--event-violet)/0.1)] to-[hsl(var(--event-teal)/0.1)] border border-[hsl(var(--event-violet)/0.2)]"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3 w-3 text-[hsl(var(--event-violet))]" />
                <span className="text-[10px] font-medium">AI Suggestion</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Move Focus Time earlier for better productivity
              </p>
            </motion.div>
          </div>

          {/* Main calendar area */}
          <div className="flex-1 p-3 bg-background min-h-[280px] sm:min-h-[320px]">
            {/* Day header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-semibold">Sunday, Feb 15</div>
                <div className="text-xs text-muted-foreground">4 events today</div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <button className="px-2 py-1 rounded bg-secondary text-muted-foreground">Day</button>
                <button className="px-2 py-1 rounded text-muted-foreground hover:bg-secondary">Week</button>
                <button className="px-2 py-1 rounded text-muted-foreground hover:bg-secondary">Month</button>
              </div>
            </div>

            {/* Events list */}
            <div className="space-y-2">
              {mockEvents.map((event, index) => (
                <motion.div
                  key={event.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-3 group cursor-pointer"
                >
                  <div className="text-[10px] text-muted-foreground w-14 pt-1.5 text-right shrink-0">
                    {event.time}
                  </div>
                  <div 
                    className={`flex-1 ${event.color} rounded-lg p-2.5 text-white group-hover:shadow-md transition-shadow`}
                    style={{ opacity: 0.9 }}
                  >
                    <div className="text-xs font-medium">{event.title}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      {event.duration === 1 ? '1 hour' : `${event.duration} hours`}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Floating voice indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6, type: 'spring' }}
              className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-0 bg-[hsl(var(--event-violet))] rounded-full opacity-20"
                />
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[hsl(var(--event-violet))] flex items-center justify-center shadow-lg">
                  <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8 }}
        className="absolute -top-6 -right-6 hidden lg:block"
      >
        <div className="bg-card border border-border rounded-xl p-3 shadow-clean-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--event-emerald))]" />
            <span className="text-[10px] font-medium">Voice Command</span>
          </div>
          <p className="text-[10px] text-muted-foreground italic">"Schedule team lunch tomorrow at noon"</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="absolute -bottom-4 -left-4 hidden lg:block"
      >
        <div className="bg-card border border-border rounded-xl p-3 shadow-clean-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-[hsl(var(--event-amber))]" />
            <div>
              <span className="text-[10px] font-medium">Client Call in 15 min</span>
              <p className="text-[10px] text-muted-foreground">Prepare your notes</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
