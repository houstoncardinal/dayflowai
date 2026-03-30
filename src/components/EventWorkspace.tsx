import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarEvent, EventColor } from '@/types/calendar';
import { useEventWorkspace, EventMessage, EventDeliverable } from '@/hooks/useEventWorkspace';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Send,
  Bot,
  User,
  FileText,
  Trash2,
  Sparkles,
  Loader2,
  PackageOpen,
  MessageSquare,
  Pencil,
  X,
  StopCircle,
  Copy,
  Check,
} from 'lucide-react';

interface EventWorkspaceProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CalendarEvent>) => void;
  onDelete: (id: string) => void;
}

const colorMap: Record<EventColor, string> = {
  coral: 'bg-event-coral',
  teal: 'bg-event-teal',
  amber: 'bg-event-amber',
  violet: 'bg-event-violet',
  emerald: 'bg-event-emerald',
  rose: 'bg-event-rose',
};

const MessageBubble = memo(({ msg }: { msg: EventMessage }) => {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2.5 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div className={cn(
        'flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs',
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
      )}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={cn(
        'relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-md'
          : 'bg-muted text-foreground rounded-tl-md'
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
        {!isUser && msg.content && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-md p-1"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
          </button>
        )}
      </div>
    </motion.div>
  );
});
MessageBubble.displayName = 'MessageBubble';

const DeliverableCard = memo(({ d, onDelete }: { d: EventDeliverable; onDelete: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const typeIcons: Record<string, string> = {
    agenda: '📋',
    email: '✉️',
    action_items: '✅',
    research: '🔍',
    document: '📝',
    checklist: '☑️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border border-border rounded-xl p-3 bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{typeIcons[d.type] || '📄'}</span>
          <div className="min-w-0">
            <h4 className="font-medium text-sm truncate">{d.title}</h4>
            <p className="text-xs text-muted-foreground">
              {format(new Date(d.created_at), 'MMM d, h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && d.content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto">
              <ReactMarkdown>{d.content}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
DeliverableCard.displayName = 'DeliverableCard';

const QUICK_PROMPTS = [
  { label: '📋 Prep agenda', prompt: 'Create a detailed meeting agenda for this event with objectives, timing, and discussion points.' },
  { label: '✉️ Draft follow-up', prompt: 'Draft a professional follow-up email for this event with action items and next steps.' },
  { label: '🔍 Research brief', prompt: 'Create a research brief with key context I need to prepare for this event.' },
  { label: '✅ Action items', prompt: 'Generate a checklist of action items and preparation tasks for this event.' },
];

export function EventWorkspace({ event, isOpen, onClose, onUpdate, onDelete }: EventWorkspaceProps) {
  const { messages, deliverables, isLoading, isSending, sendMessage, deleteDeliverable, cancelStream } = useEventWorkspace(event);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat tab opens
  useEffect(() => {
    if (activeTab === 'chat' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [activeTab, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleDelete = () => {
    if (!event) return;
    onDelete(event.id);
    onClose();
  };

  if (!event) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col gap-0 [&>button]:hidden"
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-border bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={cn('h-3 w-3 rounded-full mt-1.5 flex-shrink-0', colorMap[event.color])} />
              <div className="min-w-0">
                <SheetHeader className="p-0 space-y-0">
                  <SheetTitle className="text-lg font-semibold truncate text-left">{event.title}</SheetTitle>
                </SheetHeader>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(event.event_date), 'EEE, MMM d')}
                  </span>
                  {event.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}
                    </span>
                  )}
                  {event.all_day && (
                    <Badge variant="secondary" className="text-[10px] h-4">All day</Badge>
                  )}
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 mb-0 grid grid-cols-3 h-9">
            <TabsTrigger value="chat" className="text-xs gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="text-xs gap-1.5 relative">
              <PackageOpen className="h-3.5 w-3.5" />
              Assets
              {deliverables.length > 0 && (
                <span className="ml-1 h-4 min-w-[16px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {deliverables.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Details
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 m-0 mt-2">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-4 pb-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-base mb-1">AI Workspace</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mb-5">
                    Tell me what you need for this event. I'll help you prepare, create documents, draft emails, or plan — and save everything here.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                    {QUICK_PROMPTS.map((qp) => (
                      <button
                        key={qp.label}
                        onClick={() => handleQuickPrompt(qp.prompt)}
                        className="text-left text-xs px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
              )}
              {isSending && messages[messages.length - 1]?.role !== 'assistant' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-md px-3.5 py-2.5">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell the AI what you need for this event..."
                  className="min-h-[40px] max-h-[120px] resize-none text-sm rounded-xl"
                  rows={1}
                />
                {isSending ? (
                  <Button size="icon" variant="outline" className="h-10 w-10 flex-shrink-0 rounded-xl" onClick={cancelStream}>
                    <StopCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                    onClick={handleSend}
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="flex-1 overflow-y-auto m-0 mt-2 px-4 pb-4">
            {deliverables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PackageOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-medium text-sm mb-1">No assets yet</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Chat with the AI to generate agendas, emails, research briefs, and more. They'll appear here as your "virtual pocket" for this event.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {deliverables.map((d) => (
                  <DeliverableCard key={d.id} d={d} onDelete={() => deleteDeliverable(d.id)} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 overflow-y-auto m-0 mt-2 px-4 pb-4">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                <p className="text-sm font-medium">{event.title}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                <p className="text-sm">{format(parseISO(event.event_date), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              {event.start_time && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
                  <p className="text-sm">{event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}</p>
                </div>
              )}
              {event.description && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              <div className="pt-4 flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Event
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default EventWorkspace;
