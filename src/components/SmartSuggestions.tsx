import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, X, ChevronRight, Loader2, CheckCircle2, 
  AlertTriangle, Play, RotateCcw, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SmartSuggestion, SuggestionCategory } from '@/hooks/useSmartSuggestions';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  isOpen: boolean;
  onClose: () => void;
  onExecute: (id: string) => void;
  onRunAll: () => void;
  onDismiss: (id: string) => void;
  pendingCount: number;
}

const categoryConfig: Record<SuggestionCategory, { label: string; color: string; bgColor: string }> = {
  prep: { label: 'Prep', color: 'text-event-violet', bgColor: 'bg-event-violet/10' },
  optimize: { label: 'Optimize', color: 'text-event-amber', bgColor: 'bg-event-amber/10' },
  followup: { label: 'Follow-up', color: 'text-event-teal', bgColor: 'bg-event-teal/10' },
  autopilot: { label: 'Autopilot', color: 'text-event-coral', bgColor: 'bg-event-coral/10' },
  quick: { label: 'Quick', color: 'text-event-emerald', bgColor: 'bg-event-emerald/10' },
};

const priorityBorder: Record<string, string> = {
  urgent: 'border-l-event-coral',
  high: 'border-l-event-amber',
  medium: 'border-l-event-teal',
  low: 'border-l-border',
};

export function SmartSuggestions({
  suggestions,
  isOpen,
  onClose,
  onExecute,
  onRunAll,
  onDismiss,
  pendingCount,
}: SmartSuggestionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const grouped = suggestions.reduce<Record<SuggestionCategory, SmartSuggestion[]>>(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {} as any
  );

  const categoryOrder: SuggestionCategory[] = ['prep', 'followup', 'optimize', 'autopilot', 'quick'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 z-[56] w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-event-amber to-event-coral flex items-center justify-center shadow-md">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Smart Suggestions</h2>
                  <p className="text-xs text-muted-foreground">
                    {pendingCount > 0 ? `${pendingCount} actions available` : 'All caught up!'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 1 && (
                  <Button
                    size="sm"
                    onClick={onRunAll}
                    className="h-8 text-xs bg-gradient-to-r from-event-amber to-event-coral text-white hover:opacity-90 gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Run All
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {suggestions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No suggestions right now</p>
                    <p className="text-xs mt-1">Add some events to your calendar and AI will find ways to help!</p>
                  </motion.div>
                )}

                {categoryOrder.map((cat) => {
                  const items = grouped[cat];
                  if (!items?.length) return null;
                  const config = categoryConfig[cat];

                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <span className={cn("text-[11px] font-bold uppercase tracking-wider", config.color)}>
                          {config.label}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[11px] text-muted-foreground">{items.length}</span>
                      </div>

                      <div className="space-y-2">
                        {items.map((suggestion, i) => (
                          <SuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            index={i}
                            isExpanded={expandedId === suggestion.id}
                            onToggle={() => setExpandedId(prev => prev === suggestion.id ? null : suggestion.id)}
                            onExecute={() => onExecute(suggestion.id)}
                            onDismiss={() => onDismiss(suggestion.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <p className="text-[11px] text-muted-foreground text-center">
                Suggestions refresh as your calendar changes
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SuggestionCard({
  suggestion,
  index,
  isExpanded,
  onToggle,
  onExecute,
  onDismiss,
}: {
  suggestion: SmartSuggestion;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onExecute: () => void;
  onDismiss: () => void;
}) {
  const config = categoryConfig[suggestion.category];
  const isDone = suggestion.status === 'done';
  const isFailed = suggestion.status === 'failed';
  const isRunning = suggestion.status === 'running';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "rounded-xl border border-l-[3px] overflow-hidden transition-colors",
        priorityBorder[suggestion.priority],
        isDone ? "bg-event-emerald/5 border-event-emerald/20" :
        isFailed ? "bg-destructive/5 border-destructive/20" :
        "bg-card hover:bg-muted/40"
      )}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-3 py-3 cursor-pointer"
        onClick={onToggle}
      >
        <span className="text-lg shrink-0">{suggestion.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isDone && "line-through opacity-60")}>
            {suggestion.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{suggestion.description}</p>
        </div>

        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin text-event-amber shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="h-4 w-4 text-event-emerald shrink-0" />
        ) : isFailed ? (
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        ) : (
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onExecute(); }}
            className={cn(
              "h-7 text-[11px] px-3 shrink-0 gap-1",
              "bg-gradient-to-r from-event-amber/90 to-event-coral/90 text-white hover:opacity-90"
            )}
          >
            <Play className="h-3 w-3" />
            {suggestion.actionLabel}
          </Button>
        )}
      </div>

      {/* Expanded result / retry */}
      <AnimatePresence>
        {isExpanded && (isDone || isFailed) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-border/50">
              {suggestion.result && (
                <div className="prose prose-sm dark:prose-invert max-w-none mt-3 text-xs leading-relaxed">
                  <ReactMarkdown>{suggestion.result}</ReactMarkdown>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                {isFailed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); onExecute(); }}
                    className="h-7 text-[11px] gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                  className="h-7 text-[11px] text-muted-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SmartSuggestions;
