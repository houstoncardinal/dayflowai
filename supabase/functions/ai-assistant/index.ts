import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  action?: "chat" | "analyze" | "execute_task" | "orchestrate";
  task?: AgentTask;
  agentTeam?: string[];
}

// Agent tool definitions for structured output
const agentTools = [
  {
    type: "function",
    function: {
      name: "generate_meeting_agenda",
      description: "Generate a comprehensive meeting agenda with timing and topics",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Meeting title" },
          duration_minutes: { type: "number", description: "Total meeting duration" },
          objectives: {
            type: "array",
            items: { type: "string" },
            description: "Meeting objectives"
          },
          agenda_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                duration_minutes: { type: "number" },
                owner: { type: "string" },
                notes: { type: "string" }
              },
              required: ["topic", "duration_minutes"]
            }
          },
          preparation_needed: {
            type: "array",
            items: { type: "string" },
            description: "Things attendees should prepare"
          }
        },
        required: ["title", "agenda_items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_follow_up_email",
      description: "Draft a professional follow-up email after a meeting",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string" },
          greeting: { type: "string" },
          summary: { type: "string", description: "Brief meeting summary" },
          key_decisions: {
            type: "array",
            items: { type: "string" }
          },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task: { type: "string" },
                owner: { type: "string" },
                due_date: { type: "string" }
              },
              required: ["task"]
            }
          },
          next_steps: { type: "string" },
          closing: { type: "string" }
        },
        required: ["subject", "summary", "action_items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_research_brief",
      description: "Compile a research brief with background information",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string" },
          executive_summary: { type: "string" },
          key_points: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                content: { type: "string" },
                importance: { type: "string", enum: ["high", "medium", "low"] }
              },
              required: ["heading", "content"]
            }
          },
          questions_to_explore: {
            type: "array",
            items: { type: "string" }
          },
          recommended_resources: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["topic", "executive_summary", "key_points"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_schedule",
      description: "Analyze the user's schedule and provide optimization insights",
      parameters: {
        type: "object",
        properties: {
          schedule_health_score: { 
            type: "number", 
            description: "Overall schedule health 0-100" 
          },
          focus_time_hours: { 
            type: "number", 
            description: "Available focus time in hours" 
          },
          meeting_load: {
            type: "string",
            enum: ["light", "moderate", "heavy", "overloaded"]
          },
          conflicts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event1: { type: "string" },
                event2: { type: "string" },
                conflict_type: { type: "string" }
              }
            }
          },
          optimization_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                suggestion: { type: "string" },
                impact: { type: "string", enum: ["high", "medium", "low"] },
                effort: { type: "string", enum: ["easy", "moderate", "hard"] }
              },
              required: ["suggestion", "impact"]
            }
          },
          recommended_focus_blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                time_slot: { type: "string" },
                duration_hours: { type: "number" }
              }
            }
          }
        },
        required: ["schedule_health_score", "meeting_load", "optimization_suggestions"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_documentation",
      description: "Generate structured documentation or meeting notes",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          type: { type: "string", enum: ["meeting_notes", "summary", "report", "outline"] },
          date: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                content: { type: "string" },
                bullet_points: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["heading"]
            }
          },
          tags: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["title", "type", "sections"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_communication",
      description: "Draft professional communications like invites or updates",
      parameters: {
        type: "object",
        properties: {
          type: { 
            type: "string", 
            enum: ["invitation", "update", "reminder", "confirmation", "request"] 
          },
          subject: { type: "string" },
          recipients_context: { type: "string" },
          body: { type: "string" },
          call_to_action: { type: "string" },
          urgency: { type: "string", enum: ["low", "normal", "high", "urgent"] },
          suggested_send_time: { type: "string" }
        },
        required: ["type", "subject", "body"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "orchestrate_agents",
      description: "Coordinate multiple agents working as a team on a complex task",
      parameters: {
        type: "object",
        properties: {
          task_breakdown: {
            type: "array",
            items: {
              type: "object",
              properties: {
                agent_type: { 
                  type: "string", 
                  enum: ["preparation", "follow-up", "scheduling", "research", "communication", "documentation"] 
                },
                subtask: { type: "string" },
                priority: { type: "number", description: "Execution order 1-N" },
                depends_on: { 
                  type: "array", 
                  items: { type: "number" },
                  description: "Indices of subtasks this depends on"
                },
                estimated_time: { type: "string" }
              },
              required: ["agent_type", "subtask", "priority"]
            }
          },
          coordination_notes: { type: "string" },
          expected_outcome: { type: "string" },
          human_checkpoints: {
            type: "array",
            items: { type: "string" },
            description: "Points where human review is recommended"
          }
        },
        required: ["task_breakdown", "expected_outcome"]
      }
    }
  }
];

// Map task types to appropriate tools
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured. Add it in your project secrets.");
    }

    const { messages, events = [], action = "chat", task, agentTeam } = await req.json() as RequestBody;

    // Build context about the user's schedule
    const scheduleContext = events.length > 0 
      ? `\n## User's Calendar (${events.length} events):\n${events.map((e: CalendarEvent) => 
          `- **${e.title}** on ${e.event_date}${e.start_time ? ` at ${e.start_time}` : ' (all day)'}${e.end_time ? `-${e.end_time}` : ''}${e.description ? `\n  └ ${e.description}` : ''}`
        ).join('\n')}\n`
      : '';

    const currentDate = new Date();
    const systemPrompt = `You are Dayflow AI, an advanced autonomous agent orchestrator for calendar and productivity management. You coordinate a team of specialized AI agents to automate tasks while knowing when to request human input.

## Current Context
- Date: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
${scheduleContext}

## Your Agent Team

### 📋 Prep Agent
Specializes in meeting preparation: agendas, talking points, pre-meeting checklists, attendee research.

### ✉️ Follow-up Agent  
Handles post-meeting tasks: follow-up emails, action item extraction, meeting summaries, accountability tracking.

### 📅 Schedule Agent
Optimizes time management: finding focus blocks, conflict detection, workload balancing, optimal scheduling.

### 🔍 Research Agent
Gathers intelligence: topic research, background compilation, resource discovery, Q&A preparation.

### 💬 Comms Agent
Manages communications: status updates, invitations, confirmations, availability requests.

### 📝 Docs Agent
Creates documentation: meeting notes, summaries, reports, decision archives.

## Agent Collaboration Protocol

When agents work together:
1. **Prep + Research**: Research gathers context → Prep creates informed agenda
2. **Docs + Follow-up**: Docs captures notes → Follow-up extracts action items
3. **Schedule + Comms**: Schedule finds times → Comms sends invitations
4. **Research + Docs**: Research compiles info → Docs structures it

## Execution Guidelines

1. **Use structured outputs** - Always use the appropriate tool function for your output
2. **Be specific** - Include actual dates, times, and details from the calendar
3. **Think ahead** - Anticipate what the user will need next
4. **Flag human needs** - Mark decisions requiring human judgment with ⚠️
5. **Quality over speed** - Provide thorough, actionable outputs

## Human Judgment Triggers
Mark with ⚠️ REQUIRES HUMAN when:
- Decisions involve personal relationships
- Financial or legal implications exist  
- The task requires physical presence
- Sensitive or confidential matters
- Creative direction is needed
- The context is ambiguous`;

    console.log(`[AI Assistant] Action: ${action}, Events: ${events.length}, Task: ${task?.type || 'none'}`);

    // Build the request based on action type
    let requestBody: any = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    // For task execution, use tool calling for structured output
    if (action === "execute_task" && task) {
      const toolName = getToolForTaskType(task.type);
      const relevantTools = agentTools.filter(t => t.function.name === toolName);
      
      requestBody.tools = relevantTools;
      requestBody.tool_choice = { type: "function", function: { name: toolName } };
      
      // Add task-specific context to the last message
      const taskContext = `
Execute this automation task using the ${toolName} function:

**Task**: ${task.title}
**Type**: ${task.type}
${task.eventTitle ? `**For Event**: ${task.eventTitle}` : ''}
${task.context ? `**Additional Context**: ${task.context}` : ''}

Provide comprehensive, ready-to-use output with specific details.`;
      
      requestBody.messages.push({ role: "user", content: taskContext });
    }

    // For agent orchestration, use the orchestration tool
    if (action === "orchestrate" && agentTeam) {
      const orchestrationTool = agentTools.find(t => t.function.name === "orchestrate_agents");
      requestBody.tools = orchestrationTool ? [orchestrationTool] : [];
      requestBody.tool_choice = { type: "function", function: { name: "orchestrate_agents" } };
    }

    // For schedule analysis, use the analysis tool
    if (action === "analyze") {
      const analysisTool = agentTools.find(t => t.function.name === "analyze_schedule");
      requestBody.tools = analysisTool ? [analysisTool] : [];
      requestBody.tool_choice = { type: "function", function: { name: "analyze_schedule" } };
      requestBody.messages.push({ 
        role: "user", 
        content: "Analyze my schedule for the next 7 days and provide optimization insights using the analyze_schedule function." 
      });
    }

    // For chat, enable streaming
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
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again in a moment.",
          code: "RATE_LIMITED"
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ 
          error: "Invalid OpenAI API key. Please check your configuration.",
          code: "AUTH_ERROR"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402 || response.status === 403) {
        return new Response(JSON.stringify({ 
          error: "OpenAI billing issue. Please check your OpenAI account.",
          code: "BILLING_ERROR"
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "AI service temporarily unavailable",
        code: "SERVICE_ERROR"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For streaming responses (chat), pass through
    if (action === "chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // For tool calling responses, parse and return structured data
    const data = await response.json();
    console.log("[AI Assistant] Response received:", JSON.stringify(data).slice(0, 200));

    // Extract tool call result if present
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      try {
        const toolResult = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({
          success: true,
          tool: toolCall.function.name,
          data: toolResult,
          raw_content: data.choices?.[0]?.message?.content,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("[AI Assistant] Tool result parse error:", parseError);
        return new Response(JSON.stringify({
          success: true,
          tool: toolCall.function.name,
          data: toolCall.function.arguments,
          raw_content: data.choices?.[0]?.message?.content,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Return the raw response if no tool call
    return new Response(JSON.stringify({
      success: true,
      content: data.choices?.[0]?.message?.content,
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
