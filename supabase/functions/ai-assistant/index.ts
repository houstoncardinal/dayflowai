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
  action?: "chat" | "analyze" | "execute_task" | "orchestrate" | "prioritize" | "enrich_context";
  task?: AgentTask;
  agentTeam?: string[];
  tasks?: AgentTask[];
}

// ============================================================
// ADVANCED AGENT TOOL DEFINITIONS WITH CHAIN-OF-THOUGHT
// ============================================================

const agentTools = [
  {
    type: "function",
    function: {
      name: "generate_meeting_agenda",
      description: "Generate a comprehensive meeting agenda with timing, objectives, and preparation items. Use chain-of-thought reasoning to analyze the meeting context.",
      parameters: {
        type: "object",
        properties: {
          reasoning: { 
            type: "string", 
            description: "Your step-by-step reasoning about the meeting goals, attendee needs, and optimal structure" 
          },
          title: { type: "string", description: "Meeting title" },
          duration_minutes: { type: "number", description: "Total meeting duration" },
          meeting_type: { 
            type: "string", 
            enum: ["standup", "brainstorm", "decision", "review", "planning", "presentation", "one_on_one", "workshop"],
            description: "Type of meeting to optimize agenda structure"
          },
          objectives: {
            type: "array",
            items: { type: "string" },
            description: "Clear, measurable meeting objectives"
          },
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
          preparation_needed: {
            type: "array",
            items: { 
              type: "object",
              properties: {
                task: { type: "string" },
                assignee: { type: "string" },
                deadline: { type: "string" },
                importance: { type: "string", enum: ["critical", "important", "nice_to_have"] }
              },
              required: ["task", "importance"]
            }
          },
          success_metrics: {
            type: "array",
            items: { type: "string" },
            description: "How to measure if the meeting was successful"
          },
          potential_challenges: {
            type: "array",
            items: { type: "string" },
            description: "Anticipated challenges and how to address them"
          }
        },
        required: ["reasoning", "title", "meeting_type", "objectives", "agenda_items", "success_metrics"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_follow_up_email",
      description: "Draft a professional, actionable follow-up email with clear action items and accountability",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Analysis of meeting context, key outcomes, and what follow-up approach will be most effective"
          },
          subject: { type: "string" },
          tone: { 
            type: "string", 
            enum: ["formal", "professional", "friendly", "urgent"],
            description: "Appropriate tone based on context"
          },
          greeting: { type: "string" },
          executive_summary: { 
            type: "string", 
            description: "2-3 sentence summary of the meeting for quick scanning" 
          },
          key_decisions: {
            type: "array",
            items: { 
              type: "object",
              properties: {
                decision: { type: "string" },
                rationale: { type: "string" },
                impact: { type: "string" }
              },
              required: ["decision"]
            }
          },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task: { type: "string" },
                owner: { type: "string" },
                due_date: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                dependencies: { type: "array", items: { type: "string" } },
                success_criteria: { type: "string" }
              },
              required: ["task", "priority"]
            }
          },
          open_questions: {
            type: "array",
            items: { type: "string" },
            description: "Questions that still need resolution"
          },
          next_meeting: {
            type: "object",
            properties: {
              suggested_date: { type: "string" },
              purpose: { type: "string" },
              required_attendees: { type: "array", items: { type: "string" } }
            }
          },
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
      description: "Compile a comprehensive research brief with structured insights and actionable recommendations",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Your analysis approach: what's most important to research, why, and how it connects to the user's goals"
          },
          topic: { type: "string" },
          research_depth: { 
            type: "string", 
            enum: ["quick_overview", "detailed_analysis", "comprehensive_study"],
            description: "Level of detail based on time and importance"
          },
          executive_summary: { type: "string" },
          key_findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                finding: { type: "string" },
                evidence: { type: "string" },
                confidence_level: { type: "string", enum: ["high", "medium", "low"] },
                implications: { type: "array", items: { type: "string" } }
              },
              required: ["finding", "confidence_level"]
            }
          },
          stakeholder_perspectives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stakeholder: { type: "string" },
                perspective: { type: "string" },
                concerns: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } }
              }
            }
          },
          competitive_landscape: {
            type: "object",
            properties: {
              overview: { type: "string" },
              key_players: { type: "array", items: { type: "string" } },
              differentiation_opportunities: { type: "array", items: { type: "string" } }
            }
          },
          questions_to_explore: {
            type: "array",
            items: { type: "string" }
          },
          recommended_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                rationale: { type: "string" },
                effort: { type: "string", enum: ["low", "medium", "high"] },
                impact: { type: "string", enum: ["low", "medium", "high"] },
                timeline: { type: "string" }
              },
              required: ["action", "impact"]
            }
          }
        },
        required: ["reasoning", "topic", "research_depth", "executive_summary", "key_findings", "recommended_actions"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_schedule",
      description: "Perform deep schedule analysis with pattern recognition, workload optimization, and predictive insights",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Your analysis of the schedule patterns, bottlenecks, and optimization opportunities"
          },
          schedule_health_score: { 
            type: "number", 
            description: "Overall schedule health 0-100 based on multiple factors" 
          },
          health_breakdown: {
            type: "object",
            properties: {
              focus_time_score: { type: "number" },
              meeting_load_score: { type: "number" },
              balance_score: { type: "number" },
              buffer_time_score: { type: "number" }
            }
          },
          focus_time_analysis: {
            type: "object",
            properties: {
              total_hours_available: { type: "number" },
              largest_block_hours: { type: "number" },
              fragmentation_level: { type: "string", enum: ["low", "moderate", "high", "critical"] },
              optimal_focus_periods: { type: "array", items: { type: "string" } }
            }
          },
          meeting_load: {
            type: "string",
            enum: ["light", "moderate", "heavy", "overloaded"]
          },
          meeting_patterns: {
            type: "object",
            properties: {
              peak_meeting_days: { type: "array", items: { type: "string" } },
              average_meeting_duration: { type: "number" },
              back_to_back_frequency: { type: "string" },
              recurring_vs_adhoc_ratio: { type: "string" }
            }
          },
          energy_optimization: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time_slot: { type: "string" },
                recommended_activity: { type: "string" },
                reason: { type: "string" }
              }
            },
            description: "Recommendations for matching task types to energy levels"
          },
          conflicts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event1: { type: "string" },
                event2: { type: "string" },
                conflict_type: { type: "string", enum: ["overlap", "insufficient_buffer", "context_switch", "energy_mismatch"] },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                resolution_suggestion: { type: "string" }
              }
            }
          },
          optimization_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                suggestion: { type: "string" },
                category: { type: "string", enum: ["focus_time", "meeting_efficiency", "workload_balance", "energy_management", "buffer_time"] },
                impact: { type: "string", enum: ["high", "medium", "low"] },
                effort: { type: "string", enum: ["easy", "moderate", "hard"] },
                time_saved_estimate: { type: "string" },
                implementation_steps: { type: "array", items: { type: "string" } }
              },
              required: ["suggestion", "category", "impact"]
            }
          },
          recommended_focus_blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                time_slot: { type: "string" },
                duration_hours: { type: "number" },
                recommended_task_type: { type: "string" }
              }
            }
          },
          weekly_rhythm_assessment: {
            type: "object",
            properties: {
              strengths: { type: "array", items: { type: "string" } },
              areas_for_improvement: { type: "array", items: { type: "string" } },
              suggested_weekly_template: { type: "string" }
            }
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
      description: "Generate structured, comprehensive documentation with clear organization and actionable content",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Analysis of documentation needs, audience, and optimal structure"
          },
          title: { type: "string" },
          type: { 
            type: "string", 
            enum: ["meeting_notes", "summary", "report", "outline", "decision_record", "retrospective", "project_update"] 
          },
          audience: {
            type: "array",
            items: { type: "string" },
            description: "Who will read this document"
          },
          date: { type: "string" },
          tldr: {
            type: "string",
            description: "One-paragraph summary for quick reading"
          },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                content: { type: "string" },
                bullet_points: { type: "array", items: { type: "string" } },
                callouts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["info", "warning", "success", "action"] },
                      content: { type: "string" }
                    }
                  }
                }
              },
              required: ["heading"]
            }
          },
          decisions_made: {
            type: "array",
            items: {
              type: "object",
              properties: {
                decision: { type: "string" },
                context: { type: "string" },
                alternatives_considered: { type: "array", items: { type: "string" } },
                rationale: { type: "string" }
              },
              required: ["decision", "rationale"]
            }
          },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                owner: { type: "string" },
                due: { type: "string" },
                status: { type: "string", enum: ["todo", "in_progress", "done", "blocked"] }
              }
            }
          },
          tags: { type: "array", items: { type: "string" } },
          related_documents: { type: "array", items: { type: "string" } }
        },
        required: ["reasoning", "title", "type", "tldr", "sections"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_communication",
      description: "Draft professional communications with appropriate tone, structure, and call-to-action",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Analysis of communication context, recipient needs, and optimal approach"
          },
          type: { 
            type: "string", 
            enum: ["invitation", "update", "reminder", "confirmation", "request", "announcement", "thank_you", "escalation"] 
          },
          channel: {
            type: "string",
            enum: ["email", "slack", "teams", "sms", "formal_letter"],
            description: "Recommended communication channel"
          },
          subject: { type: "string" },
          recipient_analysis: {
            type: "object",
            properties: {
              relationship: { type: "string" },
              communication_style_preference: { type: "string" },
              key_concerns: { type: "array", items: { type: "string" } }
            }
          },
          structure: {
            type: "object",
            properties: {
              opening: { type: "string" },
              context: { type: "string" },
              main_message: { type: "string" },
              supporting_points: { type: "array", items: { type: "string" } },
              call_to_action: { type: "string" },
              closing: { type: "string" }
            },
            required: ["opening", "main_message", "call_to_action", "closing"]
          },
          full_body: { type: "string" },
          attachments_needed: { type: "array", items: { type: "string" } },
          urgency: { type: "string", enum: ["low", "normal", "high", "urgent"] },
          suggested_send_time: { type: "string" },
          follow_up_plan: {
            type: "object",
            properties: {
              if_no_response_by: { type: "string" },
              follow_up_action: { type: "string" }
            }
          }
        },
        required: ["reasoning", "type", "channel", "subject", "structure", "full_body"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "orchestrate_agents",
      description: "Coordinate multiple agents working as a team with dependency management and parallel execution planning",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Your analysis of the task breakdown, optimal agent assignments, and coordination strategy"
          },
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
                subtask_details: { type: "string" },
                priority: { type: "number", description: "Execution order 1-N" },
                can_run_parallel: { type: "boolean" },
                depends_on: { 
                  type: "array", 
                  items: { type: "number" },
                  description: "Indices of subtasks this depends on"
                },
                estimated_time: { type: "string" },
                inputs_needed: { type: "array", items: { type: "string" } },
                outputs_produced: { type: "array", items: { type: "string" } },
                quality_criteria: { type: "string" }
              },
              required: ["agent_type", "subtask", "priority", "can_run_parallel"]
            }
          },
          execution_waves: {
            type: "array",
            items: {
              type: "object",
              properties: {
                wave_number: { type: "number" },
                tasks: { type: "array", items: { type: "number" } },
                parallel_execution: { type: "boolean" }
              }
            },
            description: "Groups of tasks that can be executed together"
          },
          coordination_notes: { type: "string" },
          expected_outcome: { type: "string" },
          total_estimated_time: { type: "string" },
          human_checkpoints: {
            type: "array",
            items: { 
              type: "object",
              properties: {
                after_task: { type: "number" },
                checkpoint_purpose: { type: "string" },
                decision_needed: { type: "string" }
              }
            },
            description: "Points where human review is recommended"
          },
          risk_mitigation: {
            type: "array",
            items: {
              type: "object",
              properties: {
                risk: { type: "string" },
                mitigation: { type: "string" }
              }
            }
          }
        },
        required: ["reasoning", "task_breakdown", "execution_waves", "expected_outcome"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "prioritize_tasks",
      description: "Intelligently prioritize tasks using multiple factors including urgency, impact, dependencies, and context",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Your analysis of prioritization factors and trade-offs"
          },
          prioritization_framework: {
            type: "string",
            enum: ["eisenhower", "impact_effort", "weighted_scoring", "dependency_based"],
            description: "Framework used for prioritization"
          },
          prioritized_tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task_id: { type: "string" },
                original_priority: { type: "string" },
                recommended_priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                priority_score: { type: "number", description: "0-100 score" },
                urgency_score: { type: "number" },
                impact_score: { type: "number" },
                effort_score: { type: "number" },
                dependency_score: { type: "number" },
                context_factors: { type: "array", items: { type: "string" } },
                recommended_execution_time: { type: "string" },
                rationale: { type: "string" }
              },
              required: ["task_id", "recommended_priority", "priority_score", "rationale"]
            }
          },
          execution_order: {
            type: "array",
            items: { type: "string" },
            description: "Optimal order to execute tasks"
          },
          quick_wins: {
            type: "array",
            items: { type: "string" },
            description: "High-impact, low-effort tasks to tackle first"
          },
          time_blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time_slot: { type: "string" },
                tasks: { type: "array", items: { type: "string" } },
                theme: { type: "string" }
              }
            }
          },
          delegation_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task_id: { type: "string" },
                suggestion: { type: "string" },
                reason: { type: "string" }
              }
            }
          }
        },
        required: ["reasoning", "prioritization_framework", "prioritized_tasks", "execution_order"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "enrich_context",
      description: "Gather and synthesize rich context for a task or event from historical patterns and related information",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Your analysis of what context is most relevant and why"
          },
          event_context: {
            type: "object",
            properties: {
              event_type_analysis: { type: "string" },
              historical_pattern: { type: "string" },
              typical_outcomes: { type: "array", items: { type: "string" } },
              common_challenges: { type: "array", items: { type: "string" } }
            }
          },
          stakeholder_context: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string" },
                likely_priorities: { type: "array", items: { type: "string" } },
                communication_preferences: { type: "string" },
                decision_making_style: { type: "string" }
              }
            }
          },
          preparation_insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                insight: { type: "string" },
                source: { type: "string" },
                relevance: { type: "string" }
              }
            }
          },
          related_events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event_title: { type: "string" },
                relationship: { type: "string" },
                key_takeaway: { type: "string" }
              }
            }
          },
          success_factors: {
            type: "array",
            items: { type: "string" }
          },
          potential_pitfalls: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pitfall: { type: "string" },
                prevention: { type: "string" }
              }
            }
          },
          recommended_talking_points: {
            type: "array",
            items: { type: "string" }
          },
          questions_to_ask: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["reasoning", "event_context", "success_factors", "recommended_talking_points"]
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

// Advanced system prompt with chain-of-thought and reasoning
function buildSystemPrompt(events: CalendarEvent[], currentDate: Date): string {
  const scheduleContext = events.length > 0 
    ? `\n## User's Calendar (${events.length} events):\n${events.map((e: CalendarEvent) => 
        `- **${e.title}** on ${e.event_date}${e.start_time ? ` at ${e.start_time}` : ' (all day)'}${e.end_time ? `-${e.end_time}` : ''}${e.description ? `\n  └ ${e.description}` : ''}`
      ).join('\n')}\n`
    : '';

  return `You are Dayflow AI, an elite autonomous agent orchestrator for calendar and productivity management. You lead a team of specialized AI agents and use advanced reasoning to deliver exceptional results.

## REASONING FRAMEWORK

For every task, you MUST:
1. **Analyze Context**: What's the deeper purpose? What are the stakes?
2. **Consider Stakeholders**: Who's involved? What are their needs and communication styles?
3. **Identify Patterns**: What similar situations have worked well? What pitfalls exist?
4. **Plan Strategically**: What's the optimal approach? What dependencies exist?
5. **Ensure Quality**: How will success be measured? What could go wrong?

Always include your chain-of-thought reasoning in the "reasoning" field.

## Current Context
- Date: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
${scheduleContext}

## Your Agent Team & Capabilities

### 📋 Prep Agent
**Specialization**: Pre-event optimization
- Generate comprehensive meeting agendas with time allocation
- Research attendee backgrounds and talking points
- Create pre-meeting checklists and preparation notes
- Identify potential challenges and mitigation strategies

### ✉️ Follow-up Agent
**Specialization**: Post-event action & accountability
- Draft professional follow-up emails with clear action items
- Extract and track decisions and commitments
- Create accountability frameworks
- Plan next steps and follow-up sequences

### 📅 Schedule Agent
**Specialization**: Time optimization & workload balance
- Analyze schedule health and identify optimization opportunities
- Find optimal focus blocks and meeting times
- Detect conflicts and energy mismatches
- Recommend weekly rhythm improvements

### 🔍 Research Agent
**Specialization**: Intelligence gathering & synthesis
- Compile comprehensive research briefs
- Analyze stakeholder perspectives
- Identify opportunities and risks
- Recommend evidence-based actions

### 💬 Comms Agent
**Specialization**: Strategic communication
- Draft context-appropriate communications
- Manage multi-channel messaging
- Create escalation paths
- Plan follow-up sequences

### 📝 Docs Agent
**Specialization**: Knowledge capture & organization
- Generate structured meeting notes
- Create decision records
- Build project updates
- Maintain institutional knowledge

## Agent Collaboration Protocols

### Handoff Patterns:
1. **Research → Prep**: Research gathers context → Prep creates informed agenda
2. **Docs → Follow-up**: Docs captures notes → Follow-up extracts and assigns action items
3. **Schedule → Comms**: Schedule finds times → Comms sends invitations
4. **Research → Docs**: Research compiles info → Docs structures for sharing

### Parallel Execution:
- Independent tasks should run simultaneously
- Dependent tasks respect the dependency chain
- Human checkpoints pause for review when needed

## Quality Standards

1. **Specificity**: Include actual dates, times, names, and details
2. **Actionability**: Every output should be immediately usable
3. **Context-Awareness**: Adapt tone and depth to the situation
4. **Forward-Thinking**: Anticipate next steps and potential issues
5. **Human-Centered**: Mark decisions requiring judgment with ⚠️

## Human Judgment Triggers
Mark with ⚠️ REQUIRES HUMAN when:
- Personal relationship dynamics are involved
- Financial, legal, or ethical implications exist
- Physical presence is required
- Sensitive or confidential matters
- Creative direction needs human input
- Context is ambiguous or high-stakes`;
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

    const { messages, events = [], action = "chat", task, agentTeam, tasks } = await req.json() as RequestBody;

    const currentDate = new Date();
    const systemPrompt = buildSystemPrompt(events, currentDate);

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
      
      const taskContext = `
Execute this automation task using the ${toolName} function. Apply chain-of-thought reasoning.

**Task**: ${task.title}
**Type**: ${task.type}
${task.eventTitle ? `**For Event**: ${task.eventTitle}` : ''}
${task.context ? `**Additional Context**: ${task.context}` : ''}

Before executing:
1. Analyze the context and stakeholders
2. Consider what would make this truly valuable
3. Identify potential challenges
4. Plan for success

Provide comprehensive, ready-to-use output with specific details and clear next steps.`;
      
      requestBody.messages.push({ role: "user", content: taskContext });
    }

    // For task prioritization
    if (action === "prioritize" && tasks) {
      const prioritizeTool = agentTools.find(t => t.function.name === "prioritize_tasks");
      requestBody.tools = prioritizeTool ? [prioritizeTool] : [];
      requestBody.tool_choice = { type: "function", function: { name: "prioritize_tasks" } };
      
      const tasksContext = `
Analyze and prioritize these tasks using intelligent scoring:

${JSON.stringify(tasks, null, 2)}

Consider:
1. Urgency based on due dates and dependencies
2. Impact on user's goals and schedule
3. Effort required vs value delivered
4. Optimal execution timing
5. Opportunities for batching similar tasks`;
      
      requestBody.messages.push({ role: "user", content: tasksContext });
    }

    // For context enrichment
    if (action === "enrich_context" && task) {
      const enrichTool = agentTools.find(t => t.function.name === "enrich_context");
      requestBody.tools = enrichTool ? [enrichTool] : [];
      requestBody.tool_choice = { type: "function", function: { name: "enrich_context" } };
      
      const contextRequest = `
Enrich the context for this event/task:

**Event**: ${task.eventTitle || task.title}
**Type**: ${task.type}
${task.context ? `**Current Context**: ${task.context}` : ''}

Analyze:
1. What type of event is this and what patterns apply?
2. Who might be involved and what are their likely priorities?
3. What preparation would be most valuable?
4. What questions should be asked?
5. What are the success factors and potential pitfalls?`;
      
      requestBody.messages.push({ role: "user", content: contextRequest });
    }

    // For agent orchestration
    if (action === "orchestrate" && agentTeam) {
      const orchestrationTool = agentTools.find(t => t.function.name === "orchestrate_agents");
      requestBody.tools = orchestrationTool ? [orchestrationTool] : [];
      requestBody.tool_choice = { type: "function", function: { name: "orchestrate_agents" } };
    }

    // For schedule analysis
    if (action === "analyze") {
      const analysisTool = agentTools.find(t => t.function.name === "analyze_schedule");
      requestBody.tools = analysisTool ? [analysisTool] : [];
      requestBody.tool_choice = { type: "function", function: { name: "analyze_schedule" } };
      requestBody.messages.push({ 
        role: "user", 
        content: `Perform a comprehensive analysis of my schedule for the next 7 days. 

Apply your advanced reasoning to:
1. Assess overall schedule health across multiple dimensions
2. Identify patterns in meeting load and focus time
3. Detect conflicts and energy mismatches
4. Find optimization opportunities with implementation steps
5. Recommend specific focus blocks with task type suggestions
6. Evaluate weekly rhythm and suggest improvements

Be specific and actionable in your recommendations.`
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
    console.log("[AI Assistant] Response received:", JSON.stringify(data).slice(0, 500));

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
          usage: data.usage,
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
