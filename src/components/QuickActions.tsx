import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Mic, 
  Calendar, 
  BarChart3, 
  RefreshCw, 
  Bot,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';

interface QuickActionsProps {
  onAddEvent: () => void;
  onOpenVoice: () => void;
  onOpenAnalytics: () => void;
  onOpenCalendarSync: () => void;
  onOpenAI: () => void;
  isVoiceActive?: boolean;
}

export function QuickActions({
  onAddEvent,
  onOpenVoice,
  onOpenAnalytics,
  onOpenCalendarSync,
  onOpenAI,
  isVoiceActive = false,
}: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: Plus,
      label: 'New Event',
      onClick: onAddEvent,
      color: 'bg-gradient-gold hover:opacity-90 text-white shadow-gold',
      primary: true,
    },
    {
      icon: Mic,
      label: 'Voice Command',
      onClick: onOpenVoice,
      color: isVoiceActive 
        ? 'bg-event-emerald text-white' 
        : 'bg-secondary hover:bg-secondary/80',
      pulse: isVoiceActive,
    },
    {
      icon: Bot,
      label: 'AI Assistant',
      onClick: onOpenAI,
      color: 'bg-secondary hover:bg-secondary/80',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      onClick: onOpenAnalytics,
      color: 'bg-secondary hover:bg-secondary/80',
    },
    {
      icon: RefreshCw,
      label: 'Calendar Sync',
      onClick: onOpenCalendarSync,
      color: 'bg-secondary hover:bg-secondary/80',
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 items-end mb-3"
            >
              {actions.slice(1).reverse().map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm font-medium text-foreground bg-card px-3 py-1.5 rounded-lg shadow-md border border-border whitespace-nowrap">
                    {action.label}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={action.onClick}
                        size="icon"
                        className={`h-12 w-12 rounded-full shadow-lg transition-all ${action.color} ${action.pulse ? 'animate-pulse-soft' : ''}`}
                      >
                        <action.icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{action.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          {/* Main FAB - Always visible */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onAddEvent}
                  size="lg"
                  className="h-14 w-14 rounded-full bg-gradient-gold hover:opacity-90 text-white shadow-gold"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Create new event (Ctrl+N)</p>
            </TooltipContent>
          </Tooltip>

          {/* Expand toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="outline"
                size="icon"
                className={`h-10 w-10 rounded-full border-2 transition-all ${isExpanded ? 'bg-secondary' : ''}`}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronUp className="h-4 w-4" />
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isExpanded ? 'Collapse' : 'More actions'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Keyboard shortcut hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute -top-8 right-0 text-xs text-muted-foreground flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          <span>Press "V" for voice</span>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
