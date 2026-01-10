import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  events?: any[];
  action?: "chat" | "analyze" | "prepare" | "automate";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { messages, events = [], action = "chat" } = await req.json() as RequestBody;

    // Build context about the user's schedule
    let scheduleContext = "";
    if (events.length > 0) {
      scheduleContext = `
Current user's schedule (events from their calendar):
${events.map((e: any) => `- ${e.title} on ${e.event_date} ${e.start_time ? `at ${e.start_time}` : '(all day)'}${e.description ? `: ${e.description}` : ''}`).join('\n')}
`;
    }

    // Enhanced system prompt for full automation
    const systemPrompt = `You are Dayflow AI, an intelligent calendar assistant with automation capabilities. You help users manage their schedule, prepare for events, and automate tasks.

${scheduleContext}

Your capabilities:
1. **Schedule Analysis**: Analyze the user's calendar to identify busy periods, conflicts, and optimization opportunities
2. **Event Preparation**: Generate meeting agendas, talking points, research briefs, and preparation checklists
3. **Smart Suggestions**: Recommend optimal times for tasks, breaks, and focus work
4. **Automation Tasks**: Help draft emails, create summaries, and prepare documents
5. **Proactive Insights**: Identify patterns and suggest improvements to productivity

When responding:
- Be concise but thorough
- Use emojis to make responses engaging (🎯 ✅ 📋 🚀 💡)
- Format with markdown for readability
- If asked to prepare for an event, provide actionable items
- If analyzing schedule, provide specific insights with data
- Always offer follow-up actions the user can take

Current date: ${new Date().toISOString().split('T')[0]}
Current time: ${new Date().toLocaleTimeString()}`;

    console.log("AI Assistant request:", { action, messageCount: messages.length, eventCount: events.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
