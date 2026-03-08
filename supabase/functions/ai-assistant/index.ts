import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Rate Limiting ──────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

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

// ── Types ──────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant" | "system"; content: string; }
interface CalendarEvent {
  id: string; title: string; event_date: string;
  start_time?: string; end_time?: string; description?: string; all_day?: boolean;
}
interface AgentTask {
  id: string; type: string; title: string;
  eventId?: string; eventTitle?: string; context?: string;
}
interface RequestBody {
  messages: Message[]; events?: CalendarEvent[];
  action?: "chat" | "analyze" | "execute_task" | "orchestrate" | "prioritize" | "enrich_context";
  task?: AgentTask; agentTeam?: string[]; tasks?: AgentTask[];
}

// ── Validation ─────────────────────────────────────────────────────
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
  if (body.task && (typeof body.task.title !== 'string' || body.task.title.length > 500)) return 'Invalid task title';
  return null;
}

// ── Tool Definitions ───────────────────────────────────────────────
const agentTools = [
  {
    type: "function",
    function: {
      name: "generate_meeting_agenda",
      description: "Generate a comprehensive meeting agenda with timing, objectives, and preparation items. Include chain-of-thought reasoning about meeting goals, attendee needs, and optimal structure.",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string", description: "Step-by-step reasoning about meeting goals, context, and optimal structure" },
          title: { type: "string" },
          duration_minutes: { type: "number" },
          meeting_type: { type: "string", enum: ["standup", "brainstorm", "decision", "review", "planning", "presentation", "one_on_one", "workshop", "retrospective", "kickoff"] },
          objectives: { type: "array", items: { type: "string" }, description: "3-5 specific, measurable objectives" },
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
                expected_outcome: { type: "string" },
                decision_needed: { type: "boolean" }
              },
              required: ["topic", "duration_minutes", "expected_outcome"]
            }
          },
          preparation_needed: {
            type: "array",
            items: {
              type: "object",
              properties: { task: { type: "string" }, importance: { type: "string", enum: ["critical", "recommended", "optional"] }, estimated_minutes: { type: "number" } },
              required: ["task", "importance"]
            }
          },
          success_metrics: { type: "array", items: { type: "string" } },
          energy_level: { type: "string", enum: ["high_energy", "moderate", "low_energy"], description: "Recommended energy level for this meeting based on type and time" },
        },
        required: ["reasoning", "title", "meeting_type", "objectives", "agenda_items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_follow_up_email",
      description: "Draft a professional follow-up email with structured action items, clear ownership, and next steps",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          subject: { type: "string" },
          tone: { type: "string", enum: ["formal", "professional", "friendly", "urgent"] },
          greeting: { type: "string" },
          executive_summary: { type: "string", description: "2-3 sentence summary of what was discussed/decided" },
          key_decisions: { type: "array", items: { type: "string" } },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task: { type: "string" },
                owner: { type: "string" },
                due_date: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                depends_on: { type: "string" }
              },
              required: ["task", "priority"]
            }
          },
          blockers: { type: "array", items: { type: "string" } },
          next_meeting: { type: "string" },
          closing: { type: "string" }
        },
        required: ["reasoning", "subject", "tone", "executive_summary", "action_items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_research_brief",
      description: "Compile a research brief with structured insights and actionable recommendations",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          topic: { type: "string" },
          research_depth: { type: "string", enum: ["quick_overview", "detailed_analysis", "comprehensive_study"] },
          executive_summary: { type: "string" },
          key_findings: {
            type: "array",
            items: { type: "object", properties: { finding: { type: "string" }, confidence_level: { type: "string", enum: ["high", "medium", "low"] }, source_type: { type: "string" } }, required: ["finding", "confidence_level"] }
          },
          questions_to_explore: { type: "array", items: { type: "string" } },
          recommended_actions: {
            type: "array",
            items: { type: "object", properties: { action: { type: "string" }, impact: { type: "string", enum: ["high", "medium", "low"] }, effort: { type: "string", enum: ["low", "medium", "high"] } }, required: ["action", "impact"] }
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
      description: "Deep schedule analysis with pattern recognition, burnout detection, focus-time optimization, and context-switching cost analysis",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string", description: "Detailed analysis of schedule patterns, energy flow, and optimization opportunities" },
          schedule_health_score: { type: "number", description: "0-100 composite score accounting for focus time, fragmentation, and meeting load" },
          meeting_load: { type: "string", enum: ["light", "moderate", "heavy", "overloaded"] },
          burnout_risk: { type: "string", enum: ["low", "moderate", "high", "critical"] },
          focus_fragmentation_score: { type: "number", description: "0-100 how fragmented the free time is" },
          context_switching_cost: { type: "string", description: "Estimated productivity loss from frequent task switching" },
          conflicts: {
            type: "array",
            items: { type: "object", properties: { event1: { type: "string" }, event2: { type: "string" }, conflict_type: { type: "string", enum: ["overlap", "insufficient_gap", "energy_mismatch"] }, resolution: { type: "string" } } }
          },
          optimization_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                suggestion: { type: "string" },
                impact: { type: "string", enum: ["high", "medium", "low"] },
                effort: { type: "string", enum: ["easy", "moderate", "hard"] },
                category: { type: "string", enum: ["focus_time", "meeting_batching", "energy_management", "conflict_resolution", "break_management"] }
              },
              required: ["suggestion", "impact", "category"]
            }
          },
          recommended_focus_blocks: {
            type: "array",
            items: { type: "object", properties: { day: { type: "string" }, time_slot: { type: "string" }, duration_hours: { type: "number" }, optimal_for: { type: "string" } } }
          },
          energy_flow: { type: "string", description: "Analysis of how energy levels likely flow through the week based on meeting patterns" }
        },
        required: ["reasoning", "schedule_health_score", "meeting_load", "burnout_risk", "optimization_suggestions"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_documentation",
      description: "Generate structured documentation with clear sections",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          title: { type: "string" },
          type: { type: "string", enum: ["meeting_notes", "summary", "report", "outline", "decision_record", "weekly_report"] },
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
      description: "Draft professional communications optimized for clarity and action",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          type: { type: "string", enum: ["invitation", "update", "reminder", "confirmation", "request", "announcement", "reschedule"] },
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
      description: "Coordinate multiple agents working as a team on complex tasks",
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

// ── Helpers ────────────────────────────────────────────────────────
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
  // Pre-compute schedule intelligence for richer context
  const todayStr = currentDate.toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.event_date === todayStr);
  const meetings = todayEvents.filter(e => {
    const lower = e.title.toLowerCase();
    return ['meeting', 'call', 'sync', 'standup', '1:1', 'review', 'interview', 'demo', 'presentation'].some(k => lower.includes(k));
  });

  // Compute gaps for focus-block suggestions
  const timedEvents = todayEvents
    .filter(e => e.start_time && e.end_time)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  let gapInfo = '';
  if (timedEvents.length > 0) {
    const gaps: string[] = [];
    let cursor = '09:00';
    for (const e of timedEvents) {
      if (e.start_time! > cursor) gaps.push(`${cursor}–${e.start_time}`);
      if (e.end_time! > cursor) cursor = e.end_time!;
    }
    if (cursor < '17:00') gaps.push(`${cursor}–17:00`);
    if (gaps.length > 0) gapInfo = `\n## Free Slots Today: ${gaps.join(', ')}`;
  }

  const scheduleContext = events.length > 0
    ? `\n## User's Calendar (${events.length} events):\n${events.map(e =>
        `- **${e.title}** on ${e.event_date}${e.start_time ? ` at ${e.start_time}` : ' (all day)'}${e.end_time ? `–${e.end_time}` : ''}${e.description ? `\n  └ ${e.description}` : ''}`
      ).join('\n')}\n`
    : '';

  return `You are Dayflow AI, an elite autonomous agent orchestrator for calendar and productivity management. You think deeply, reason step-by-step, and provide actionable, specific outputs.

## Current Context
- Date: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
- Today: ${todayEvents.length} events (${meetings.length} meetings)
${gapInfo}
${scheduleContext}

## Your Agent Team
- 📋 Prep Agent: Meeting agendas, research briefs, checklists
- ✉️ Follow-up Agent: Follow-up emails, action items, reminders
- 📅 Schedule Agent: Schedule optimization, conflict detection, focus blocks, burnout prevention
- 🔍 Research Agent: Research briefs, context gathering
- 💬 Comms Agent: Drafting communications, invitations
- 📝 Docs Agent: Meeting notes, summaries, documentation

## Quality Standards
1. Always include detailed chain-of-thought reasoning
2. Be specific — use real event names, times, and context from the calendar
3. Provide actionable outputs that can be used immediately
4. Consider energy levels: schedule demanding tasks during peak hours
5. Flag burnout risks when meeting load is heavy
6. Suggest meeting batching to reduce context switching`;
}

// ── Main Handler ───────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
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

    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Please wait a moment.", code: "RATE_LIMITED"
      }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as RequestBody;
    const validationError = validateInput(body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, events = [], action = "chat", task, agentTeam } = body;

    // ── Use Lovable AI Gateway ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured.");
    }

    const currentDate = new Date();
    const systemPrompt = buildSystemPrompt(events, currentDate);

    console.log(`[AI Assistant] User: ${userId}, Action: ${action}, Events: ${events.length}`);

    let requestBody: any = {
      model: "google/gemini-3-flash-preview",
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
      requestBody.messages.push({
        role: "user",
        content: `Execute this task with maximum quality and specificity:\n\n**Task:** ${task.title}\n**Type:** ${task.type}\n${task.eventTitle ? `**Event:** ${task.eventTitle}` : ''}\n${task.context || ''}\n\nProvide detailed, actionable output. Reference specific events, times, and context from the calendar.`
      });
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
      requestBody.messages.push({
        role: "user",
        content: `Perform a comprehensive schedule analysis for the next 7 days. Include:
1. Pattern recognition — recurring meeting patterns, busiest times, quietest periods
2. Conflict detection — overlapping events and insufficient gaps
3. Burnout risk assessment — back-to-back meetings, total meeting load
4. Focus time optimization — best slots for deep work
5. Context-switching cost — how fragmented the schedule is
6. Energy flow analysis — how energy likely fluctuates through the week
7. Specific, actionable optimization suggestions with effort/impact ratings`
      });
    }

    if (action === "chat") {
      requestBody.stream = true;
    }

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Assistant] Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later.", code: "RATE_LIMITED" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings → Workspace → Usage.", code: "PAYMENT_REQUIRED" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service temporarily unavailable", code: "SERVICE_ERROR" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
