import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent } from '@/types/calendar';

export interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EventDeliverable {
  id: string;
  event_id: string;
  user_id: string;
  title: string;
  type: string;
  content: string | null;
  metadata: Record<string, any>;
  agent_type: string | null;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export function useEventWorkspace(event: CalendarEvent | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [deliverables, setDeliverables] = useState<EventDeliverable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Get the real event ID (strip recurrence suffix)
  const getActualId = (id: string) => {
    return id.includes('-') && id.split('-').length > 5
      ? id.split('-').slice(0, 5).join('-')
      : id;
  };

  const eventId = event ? getActualId(event.id) : null;

  // Fetch messages and deliverables
  const fetchData = useCallback(async () => {
    if (!user || !eventId) return;
    setIsLoading(true);

    const [msgRes, delRes] = await Promise.all([
      supabase
        .from('event_messages')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('event_deliverables')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (msgRes.data) setMessages(msgRes.data as EventMessage[]);
    if (delRes.data) setDeliverables(delRes.data as EventDeliverable[]);
    setIsLoading(false);
  }, [user, eventId]);

  useEffect(() => {
    if (eventId) fetchData();
    else {
      setMessages([]);
      setDeliverables([]);
    }
  }, [eventId, fetchData]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!user || !eventId) return;

    const channel = supabase
      .channel(`event-messages-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_messages',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        const newMsg = payload.new as EventMessage;
        if (newMsg.user_id === user.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, eventId]);

  // Send a message and get AI response
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !eventId || !event) return;
    setIsSending(true);

    // Save user message to DB
    const { data: userMsg, error: insertErr } = await supabase
      .from('event_messages')
      .insert({ event_id: eventId, user_id: user.id, role: 'user' as const, content })
      .select()
      .single();

    if (insertErr) {
      toast({ title: 'Error', description: insertErr.message, variant: 'destructive' });
      setIsSending(false);
      return;
    }

    // Add to local state immediately
    if (userMsg) {
      setMessages(prev => [...prev.filter(m => m.id !== userMsg.id), userMsg as EventMessage]);
    }

    // Build conversation history for AI
    const history = [...messages, { role: 'user' as const, content }].map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Add event context as first user message
    const eventContext = `[Event Context]
Title: ${event.title}
Date: ${event.event_date}
Time: ${event.start_time || 'All day'}${event.end_time ? ` - ${event.end_time}` : ''}
Description: ${event.description || 'No description provided'}

The user is chatting with you about this specific calendar event. Help them prepare, plan, or complete work related to this event. If you need more information to help them, ask specific questions. When you produce deliverables (documents, emails, agendas, etc.), clearly label them so they can be saved.`;

    // Stream response
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      abortRef.current = new AbortController();

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: eventContext }, ...history],
          action: 'chat',
          events: [event],
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      // Parse SSE stream
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let tempId = `temp-${Date.now()}`;

      // Add placeholder assistant message
      setMessages(prev => [...prev, {
        id: tempId,
        event_id: eventId,
        user_id: user.id,
        role: 'assistant' as const,
        content: '',
        metadata: {},
        created_at: new Date().toISOString(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, content: assistantContent } : m
              ));
            }
          } catch { /* partial JSON, skip */ }
        }
      }

      // Save assistant message to DB
      if (assistantContent) {
        const { data: savedMsg } = await supabase
          .from('event_messages')
          .insert({ event_id: eventId, user_id: user.id, role: 'assistant' as const, content: assistantContent })
          .select()
          .single();

        if (savedMsg) {
          setMessages(prev => prev.map(m =>
            m.id === tempId ? (savedMsg as EventMessage) : m
          ));
        }

        // Auto-detect deliverables in AI response
        await detectAndSaveDeliverables(assistantContent, eventId, user.id);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
      }
    } finally {
      setIsSending(false);
    }
  }, [user, eventId, event, messages, toast]);

  // Auto-detect deliverables from AI responses
  const detectAndSaveDeliverables = async (content: string, evtId: string, userId: string) => {
    const deliverablePatterns = [
      { regex: /#{1,3}\s*(agenda|meeting agenda)/i, type: 'agenda', title: 'Meeting Agenda' },
      { regex: /#{1,3}\s*(follow[- ]?up|email draft)/i, type: 'email', title: 'Follow-up Email' },
      { regex: /#{1,3}\s*(action items|tasks|to[- ]?do)/i, type: 'action_items', title: 'Action Items' },
      { regex: /#{1,3}\s*(research|brief|analysis)/i, type: 'research', title: 'Research Brief' },
      { regex: /#{1,3}\s*(notes|summary|minutes)/i, type: 'document', title: 'Meeting Notes' },
      { regex: /#{1,3}\s*(checklist|preparation)/i, type: 'checklist', title: 'Preparation Checklist' },
    ];

    for (const pattern of deliverablePatterns) {
      if (pattern.regex.test(content)) {
        await supabase.from('event_deliverables').insert({
          event_id: evtId,
          user_id: userId,
          title: pattern.title,
          type: pattern.type,
          content: content,
          agent_type: 'assistant',
          status: 'completed',
        });
        // Refresh deliverables
        const { data } = await supabase
          .from('event_deliverables')
          .select('*')
          .eq('event_id', evtId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (data) setDeliverables(data as EventDeliverable[]);
        break; // Only save one deliverable per message
      }
    }
  };

  const deleteDeliverable = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('event_deliverables').delete().eq('id', id).eq('user_id', user.id);
    setDeliverables(prev => prev.filter(d => d.id !== id));
  }, [user]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsSending(false);
  }, []);

  return {
    messages,
    deliverables,
    isLoading,
    isSending,
    sendMessage,
    deleteDeliverable,
    cancelStream,
    refetch: fetchData,
  };
}
