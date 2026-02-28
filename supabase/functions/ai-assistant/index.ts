import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// RATE LIMITING (in-memory, per-user, resets on function cold start)
// ============================================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30; // requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ============================================================
// TYPES
// ============================================================

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  all_day?: boolean;
}

interface AgentTask {
  id: string;
  type: string;
  title: string;
  eventId?: string;
  eventTitle?: string;
  context?: string;
}

interface RequestBody {
  messages: Message[];
  events?: CalendarEvent[];
  action?: "chat" | "analyze" | "execute_task" | "orchestrate" | "prioritize" | "enrich_context";
  task?: AgentTask;
  agentTeam?: string[];
  tasks?: AgentTask[];
}

// ============================================================
// INPUT VALIDATION
// ============================================================
function validateInput(body: RequestBody): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  
  const validActions = ['chat', 'analyze', 'execute_task', 'orchestrate', 'prioritize', 'enrich_context'];
  if (body.action && !validActions.includes(body.action)) return 'Invalid action';
  
  if (body.messages && !Array.isArray(body.messages)) return 'Messages must be an array';
  if (body.messages?.length > 50) return 'Too many messages (max 50)';
  
  for (const msg of (body.messages || [])) {
    if (typeof msg.content !== 'string') return 'Message content must be a string';
    if (msg.content.length > 10000) return 'Message too long (max 10000 chars)';
    if (!['user', 'assistant', 'system'].includes(msg.role)) return 'Invalid message role';
  }
  
  if (body.events && body.events.length > 100) return 'Too many events (max 100)';
  
  if (body.task) {
    if (typeof body.task.title !== 'string' || body.task.title.length > 500) return 'Invalid task title';
  }
  
  return null;
}

// ============================================================
// TOOL DEFINITIONS
// ============================================================

const agentTools = [
  {
    type: "function",
    function: {
      name: "generate_meeting_agenda",
      description: "Generate a comprehensive meeting agenda with timing, objectives, and preparation items.",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string", description: "Step-by-step reasoning about meeting goals" },
          title: { type: "string" },
          duration_minutes: { type: "number" },
          meeting_type: { type: "string", enum: ["standup", "brainstorm", "decision", "review", "planning", "presentation", "one_on_one", "workshop"] },
          objectives: { type: "array", items: { type: "string" } },
          agenda_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                duration_minutes: { type: "number" },
                owner: { type: "string" },
                objective: { type: "string" },
                discussion_points: { type: "array", items: { type: "string" } },
                expected_outcome: { type: "string" }
              },
              required: ["topic", "duration_minutes", "expected_outcome"]
            }
          },
          preparation_needed: { type: "array", items: { type: "object", properties: { task: { type: "string" }, importance: { type: "string" } }, required: ["task"] } },
          success_metrics: { type: "array", items: { type: "string" } },
        },
        required: ["reasoning", "title", "meeting_type", "objectives", "agenda_items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_follow_up_email",
      description: "Draft a professional follow-up email with action items",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          subject: { type: "string" },
          tone: { type: "string", enum: ["formal", "professional", "friendly", "urgent"] },
          greeting: { type: "string" },
          summary: { type: "string" },
          executive_summary: { type: "string" },
          key_decisions: { type: "array", items: { type: "string" } },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: { task: { type: "string" }, owner: { type: "string" }, due_date: { type: "string" }, priority: { type: "string" } },
              required: ["task"]
            }
          },
          next_steps: { type: "string" },
          closing: { type: "string" }
        },
        required: ["reasoning", "subject", "tone", "action_items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_research_brief",
      description: "Compile a research brief with structured insights",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          topic: { type: "string" },
          research_depth: { type: "string", enum: ["quick_overview", "detailed_analysis", "comprehensive_study"] },
          executive_summary: { type: "string" },
          key_findings: {
            type: "array",
            items: { type: "object", properties: { finding: { type: "string" }, confidence_level: { type: "string" } }, required: ["finding", "confidence_level"] }
          },
          questions_to_explore: { type: "array", items: { type: "string" } },
          recommended_actions: {
            type: "array",
            items: { type: "object", properties: { action: { type: "string" }, impact: { type: "string" } }, required: ["action", "impact"] }
          }
        },
        required: ["reasoning", "topic", "executive_summary", "key_findings", "recommended_actions"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_schedule",
      description: "Perform deep schedule analysis with pattern recognition and optimization",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          schedule_health_score: { type: "number" },
          meeting_load: { type: "string", enum: ["light", "moderate", "heavy", "overloaded"] },
          conflicts: {
            type: "array",
            items: { type: "object", properties: { event1: { type: "string" }, event2: { type: "string" }, conflict_type: { type: "string" } } }
          },
          optimization_suggestions: {
            type: "array",
            items: { type: "object", properties: { suggestion: { type: "string" }, impact: { type: "string" }, effort: { type: "string" } }, required: ["suggestion", "impact"] }
          },
          recommended_focus_blocks: {
            type: "array",
            items: { type: "object", properties: { day: { type: "string" }, time_slot: { type: "string" }, duration_hours: { type: "number" } } }
          }
        },
        required: ["reasoning", "schedule_health_score", "meeting_load", "optimization_suggestions"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_documentation",
      description: "Generate structured documentation",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          title: { type: "string" },
          type: { type: "string", enum: ["meeting_notes", "summary", "report", "outline", "decision_record"] },
          date: { type: "string" },
          tldr: { type: "string" },
          sections: {
            type: "array",
            items: { type: "object", properties: { heading: { type: "string" }, content: { type: "string" }, bullet_points: { type: "array", items: { type: "string" } } }, required: ["heading"] }
          },
          tags: { type: "array", items: { type: "string" } }
        },
        required: ["reasoning", "title", "type", "tldr", "sections"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_communication",
      description: "Draft professional communications",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          type: { type: "string", enum: ["invitation", "update", "reminder", "confirmation", "request", "announcement"] },
          channel: { type: "string", enum: ["email", "slack", "teams"] },
          subject: { type: "string" },
          structure: {
            type: "object",
            properties: { opening: { type: "string" }, main_message: { type: "string" }, call_to_action: { type: "string" }, closing: { type: "string" } },
            required: ["opening", "main_message", "call_to_action", "closing"]
          },
          full_body: { type: "string" },
          urgency: { type: "string", enum: ["low", "normal", "high", "urgent"] }
        },
        required: ["reasoning", "type", "channel", "subject", "structure"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "orchestrate_agents",
      description: "Coordinate multiple agents working as a team",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          task_breakdown: {
            type: "array",
            items: {
              type: "object",
              properties: {
                agent_type: { type: "string", enum: ["preparation", "follow-up", "scheduling", "research", "communication", "documentation"] },
                subtask: { type: "string" },
                priority: { type: "number" },
                can_run_parallel: { type: "boolean" },
                depends_on: { type: "array", items: { type: "number" } },
                estimated_time: { type: "string" },
                quality_criteria: { type: "string" }
              },
              required: ["agent_type", "subtask", "priority", "can_run_parallel"]
            }
          },
          execution_waves: {
            type: "array",
            items: { type: "object", properties: { wave_number: { type: "number" }, tasks: { type: "array", items: { type: "number" } }, parallel_execution: { type: "boolean" } } }
          },
          coordination_notes: { type: "string" },
          expected_outcome: { type: "string" },
          human_checkpoints: {
            type: "array",
            items: { type: "object", properties: { after_task: { type: "number" }, checkpoint_purpose: { type: "string" } } }
          }
        },
        required: ["reasoning", "task_breakdown", "execution_waves", "expected_outcome"]
      }
    }
  }
];

// ============================================================
// HELPERS
// ============================================================

function getToolForTaskType(taskType: string): string {
  const mapping: Record<string, string> = {
    'preparation': 'generate_meeting_agenda',
    'follow-up': 'draft_follow_up_email',
    'research': 'create_research_brief',
    'scheduling': 'analyze_schedule',
    'documentation': 'generate_documentation',
    'communication': 'create_communication',
  };
  return mapping[taskType] || 'generate_documentation';
}

function buildSystemPrompt(events: CalendarEvent[], currentDate: Date): string {
  const scheduleContext = events.length > 0 
    ? `\n## User's Calendar (${events.length} events):\n${events.map((e: CalendarEvent) => 
        `- **${e.title}** on ${e.event_date}${e.start_time ? ` at ${e.start_time}` : ' (all day)'}${e.end_time ? `-${e.end_time}` : ''}${e.description ? `\n  └ ${e.description}` : ''}`
      ).join('\n')}\n`
    : '';

  return `You are Dayflow AI, an autonomous agent orchestrator for calendar and productivity management. You lead a team of specialized AI agents.

## Current Context
- Date: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
${scheduleContext}

## Your Agent Team
- 📋 Prep Agent: Meeting agendas, research briefs, checklists
- ✉️ Follow-up Agent: Follow-up emails, action items, reminders
- 📅 Schedule Agent: Schedule optimization, conflict detection, focus blocks
- 🔍 Research Agent: Research briefs, context gathering
- 💬 Comms Agent: Drafting communications, invitations
- 📝 Docs Agent: Meeting notes, summaries, documentation

Always include chain-of-thought reasoning. Be specific and actionable.`;
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- AUTH: Validate JWT ----
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const userId = claimsData.claims.sub as string;

    // ---- RATE LIMIT ----
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded. Please wait a moment.", code: "RATE_LIMITED" 
      }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- PARSE & VALIDATE INPUT ----
    const body = await req.json() as RequestBody;
    const validationError = validateInput(body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, events = [], action = "chat", task, agentTeam, tasks } = body;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const currentDate = new Date();
    const systemPrompt = buildSystemPrompt(events, currentDate);

    console.log(`[AI Assistant] User: ${userId}, Action: ${action}, Events: ${events.length}`);

    let requestBody: any = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    // Task execution with tool calling
    if (action === "execute_task" && task) {
      const toolName = getToolForTaskType(task.type);
      requestBody.tools = agentTools.filter(t => t.function.name === toolName);
      requestBody.tool_choice = { type: "function", function: { name: toolName } };
      requestBody.messages.push({ role: "user", content: `Execute: ${task.title}\nType: ${task.type}\n${task.eventTitle ? `Event: ${task.eventTitle}` : ''}\n${task.context || ''}` });
    }

    if (action === "orchestrate" && agentTeam) {
      const orchestrationTool = agentTools.find(t => t.function.name === "orchestrate_agents");
      requestBody.tools = orchestrationTool ? [orchestrationTool] : [];
      requestBody.tool_choice = { type: "function", function: { name: "orchestrate_agents" } };
    }

    if (action === "analyze") {
      const analysisTool = agentTools.find(t => t.function.name === "analyze_schedule");
      requestBody.tools = analysisTool ? [analysisTool] : [];
      requestBody.tool_choice = { type: "function", function: { name: "analyze_schedule" } };
      requestBody.messages.push({ role: "user", content: `Analyze my schedule for the next 7 days. Identify patterns, conflicts, optimization opportunities, and recommended focus blocks.` });
    }

    if (action === "chat") {
      requestBody.stream = true;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Assistant] OpenAI error:", response.status, errorText);
      
      const statusMap: Record<number, { error: string; code: string }> = {
        429: { error: "Rate limit exceeded. Please try again in a moment.", code: "RATE_LIMITED" },
        401: { error: "Invalid API key configuration.", code: "AUTH_ERROR" },
        402: { error: "Billing issue with AI provider.", code: "BILLING_ERROR" },
        403: { error: "Billing issue with AI provider.", code: "BILLING_ERROR" },
      };
      
      const mapped = statusMap[response.status] || { error: "AI service temporarily unavailable", code: "SERVICE_ERROR" };
      return new Response(JSON.stringify(mapped), {
        status: response.status >= 500 ? 500 : response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming for chat
    if (action === "chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Structured tool-call responses
    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      try {
        const toolResult = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({
          success: true,
          tool: toolCall.function.name,
          data: toolResult,
          usage: data.usage,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("[AI Assistant] Tool parse error:", parseError);
        return new Response(JSON.stringify({
          success: true,
          tool: toolCall.function.name,
          data: toolCall.function.arguments,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      content: data.choices?.[0]?.message?.content,
      usage: data.usage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[AI Assistant] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      code: "UNKNOWN_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
