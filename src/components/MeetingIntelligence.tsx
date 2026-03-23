import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimit } from '@/hooks/useRateLimit';
import { CalendarEvent } from '@/types/calendar';
import { Brain, FileText, ListChecks, Mail, Loader2, Sparkles, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, isToday, isTomorrow, parseISO, addDays, isBefore } from 'date-fns';

interface MeetingNote {
  id: string;
  event_id: string;
  ai_summary: string | null;
  ai_action_items: any[];
  ai_agenda: any[];
  ai_follow_up_draft: string | null;
  manual_notes: string | null;
}

export default function MeetingIntelligence({ 
  event: externalEvent, 
  isOpen, 
  onClose 
}: { 
  event: CalendarEvent | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<MeetingNote | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const { checkLimit } = useRateLimit('meeting-intel');

  const event = externalEvent || selectedEvent;

  // Load user events when opened without an event
  useEffect(() => {
    if (isOpen && !externalEvent && user) {
      setLoadingEvents(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_date', today)
        .lte('event_date', nextWeek)
        .order('event_date', { ascending: true })
        .then(({ data }) => {
          setUserEvents((data as CalendarEvent[]) || []);
          setLoadingEvents(false);
        });
    }
  }, [isOpen, externalEvent, user]);

  const loadNotes = async () => {
    if (!event || !user || loaded) return;
    const { data } = await supabase
      .from('meeting_notes')
      .select('*')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setNotes(data as unknown as MeetingNote);
      setManualNotes(data.manual_notes || '');
    }
    setLoaded(true);
  };

  if (isOpen && event && !loaded) loadNotes();

  const generateAI = async (type: 'agenda' | 'summary' | 'action_items' | 'follow_up') => {
    if (!event || !user) return;
    
    // Rate limit check
    if (!checkLimit()) return;
    
    setGenerating(type);

    try {
      const prompts: Record<string, string> = {
        agenda: `Generate a structured meeting agenda for: "${event.title}". ${event.description || ''}. Include 4-6 agenda items with time allocations for a ${event.start_time && event.end_time ? 'meeting' : '30-minute meeting'}. Return as JSON array of {item: string, minutes: number}.`,
        summary: `Generate a professional meeting summary for: "${event.title}". ${event.description || ''}. ${manualNotes ? `Notes: ${manualNotes}` : ''}. Include key decisions, discussion points, and outcomes.`,
        action_items: `Extract action items from this meeting: "${event.title}". ${event.description || ''}. ${manualNotes ? `Notes: ${manualNotes}` : ''}. Return as JSON array of {task: string, assignee: string, due: string}.`,
        follow_up: `Draft a professional follow-up email for the meeting: "${event.title}". ${event.description || ''}. ${manualNotes ? `Notes: ${manualNotes}` : ''}. Include thank you, key takeaways, action items, and next steps.`,
      };

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: prompts[type],
          context: { eventTitle: event.title, eventDate: event.event_date },
        },
      });

      if (error) throw error;

      const aiResponse = data?.response || data?.message || '';
      
      const updateData: any = { updated_at: new Date().toISOString() };
      if (type === 'agenda') {
        try { updateData.ai_agenda = JSON.parse(aiResponse); } catch { updateData.ai_agenda = [{ item: aiResponse, minutes: 30 }]; }
      } else if (type === 'summary') {
        updateData.ai_summary = aiResponse;
      } else if (type === 'action_items') {
        try { updateData.ai_action_items = JSON.parse(aiResponse); } catch { updateData.ai_action_items = [{ task: aiResponse, assignee: 'TBD', due: 'TBD' }]; }
      } else if (type === 'follow_up') {
        updateData.ai_follow_up_draft = aiResponse;
      }

      if (notes) {
        await supabase.from('meeting_notes').update(updateData).eq('id', notes.id);
      } else {
        const { data: newNote } = await supabase.from('meeting_notes').insert({
          event_id: event.id,
          user_id: user.id,
          ...updateData,
        }).select().single();
        if (newNote) setNotes(newNote as unknown as MeetingNote);
      }

      setNotes(prev => prev ? { ...prev, ...updateData } : null);
      toast.success(`${type.replace('_', ' ')} generated!`);
    } catch (err) {
      toast.error('Failed to generate. Try again.');
    }
    setGenerating(null);
  };

  const saveManualNotes = async () => {
    if (!event || !user) return;
    if (notes) {
      await supabase.from('meeting_notes').update({ manual_notes: manualNotes }).eq('id', notes.id);
    } else {
      const { data } = await supabase.from('meeting_notes').insert({
        event_id: event.id,
        user_id: user.id,
        manual_notes: manualNotes,
      }).select().single();
      if (data) setNotes(data as unknown as MeetingNote);
    }
    toast.success('Notes saved');
  };

  const handleClose = () => {
    onClose();
    setLoaded(false);
    setNotes(null);
    setSelectedEvent(null);
    setUserEvents([]);
  };

  // Event picker when no event is provided
  if (!event) {
    return (
      <Dialog open={isOpen} onOpenChange={() => handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Meeting Intelligence
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Select an upcoming event to generate AI notes, agendas, and follow-ups.
          </p>
          {loadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : userEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming events this week</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-2">
                {userEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedEvent(ev); setLoaded(false); }}
                    className="w-full text-left p-3 rounded-xl border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full bg-event-${ev.color}`} />
                      <span className="font-medium text-sm">{ev.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(ev.event_date), 'EEE, MMM d')}
                      {ev.start_time && ` at ${ev.start_time}`}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Meeting Intelligence: {event.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="notes">
          <TabsList className="w-full">
            <TabsTrigger value="notes" className="flex-1 gap-1"><FileText className="h-3.5 w-3.5" /> Notes</TabsTrigger>
            <TabsTrigger value="agenda" className="flex-1 gap-1"><ListChecks className="h-3.5 w-3.5" /> Agenda</TabsTrigger>
            <TabsTrigger value="actions" className="flex-1 gap-1"><Sparkles className="h-3.5 w-3.5" /> Actions</TabsTrigger>
            <TabsTrigger value="followup" className="flex-1 gap-1"><Mail className="h-3.5 w-3.5" /> Follow-up</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <Textarea
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Type your meeting notes here..."
              className="min-h-[200px]"
            />
            <div className="flex gap-2">
              <Button onClick={saveManualNotes} variant="outline" className="flex-1">Save Notes</Button>
              <Button onClick={() => generateAI('summary')} disabled={generating === 'summary'} className="flex-1 gap-1">
                {generating === 'summary' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                AI Summary
              </Button>
            </div>
            {notes?.ai_summary && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI Summary
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes.ai_summary}</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="agenda" className="space-y-4 mt-4">
            <Button onClick={() => generateAI('agenda')} disabled={generating === 'agenda'} className="w-full gap-2">
              {generating === 'agenda' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {notes?.ai_agenda?.length ? 'Regenerate Agenda' : 'Generate AI Agenda'}
            </Button>
            {notes?.ai_agenda?.map((item: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-xl"
              >
                <span className="text-sm">{item.item || item}</span>
                {item.minutes && <span className="text-xs text-muted-foreground">{item.minutes} min</span>}
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 mt-4">
            <Button onClick={() => generateAI('action_items')} disabled={generating === 'action_items'} className="w-full gap-2">
              {generating === 'action_items' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
              {notes?.ai_action_items?.length ? 'Regenerate Actions' : 'Extract Action Items'}
            </Button>
            {notes?.ai_action_items?.map((item: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-3 bg-card border border-border rounded-xl"
              >
                <p className="text-sm font-medium">{item.task || item}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  {item.assignee && <span>👤 {item.assignee}</span>}
                  {item.due && <span>📅 {item.due}</span>}
                </div>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="followup" className="space-y-4 mt-4">
            <Button onClick={() => generateAI('follow_up')} disabled={generating === 'follow_up'} className="w-full gap-2">
              {generating === 'follow_up' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {notes?.ai_follow_up_draft ? 'Regenerate Draft' : 'Generate Follow-up Email'}
            </Button>
            {notes?.ai_follow_up_draft && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-secondary/50 rounded-xl p-4"
              >
                <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">{notes.ai_follow_up_draft}</pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    navigator.clipboard.writeText(notes.ai_follow_up_draft!);
                    toast.success('Copied to clipboard');
                  }}
                >
                  Copy Draft
                </Button>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
