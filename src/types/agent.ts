export type AgentType = 
  | 'preparation' 
  | 'follow-up' 
  | 'scheduling' 
  | 'research' 
  | 'communication'
  | 'documentation';

export type AgentStatus = 'idle' | 'analyzing' | 'working' | 'completed' | 'requires-human';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AutomationTask {
  id: string;
  eventId?: string;
  eventTitle?: string;
  type: AgentType;
  title: string;
  description: string;
  automatable: boolean;
  humanRequired: boolean;
  humanReason?: string;
  priority: TaskPriority;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  estimatedTime?: string;
  dueDate?: string;
  output?: string;
  createdAt: Date;
}

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  status: AgentStatus;
  currentTask?: AutomationTask;
  completedTasks: number;
  capabilities: string[];
}

export interface ScheduleAnalysis {
  totalEvents: number;
  automatableTasks: AutomationTask[];
  humanRequiredTasks: AutomationTask[];
  insights: ScheduleInsight[];
  recommendedAgents: Agent[];
  workloadScore: number; // 0-100
  automationPotential: number; // percentage
}

export interface ScheduleInsight {
  type: 'pattern' | 'optimization' | 'warning' | 'opportunity';
  title: string;
  description: string;
  actionable: boolean;
  suggestedAction?: string;
}

export const AGENT_DEFINITIONS: Omit<Agent, 'id' | 'status' | 'currentTask' | 'completedTasks'>[] = [
  {
    type: 'preparation',
    name: 'Prep Agent',
    description: 'Prepares agendas, research briefs, and checklists before meetings',
    icon: '📋',
    capabilities: [
      'Generate meeting agendas',
      'Research attendee backgrounds',
      'Create talking points',
      'Prepare presentation notes',
      'Compile relevant documents',
    ],
  },
  {
    type: 'follow-up',
    name: 'Follow-up Agent',
    description: 'Drafts follow-up emails and action items after events',
    icon: '✉️',
    capabilities: [
      'Draft follow-up emails',
      'Summarize meeting outcomes',
      'Extract action items',
      'Send reminders',
      'Track completion status',
    ],
  },
  {
    type: 'scheduling',
    name: 'Schedule Agent',
    description: 'Optimizes calendar and finds best times for tasks',
    icon: '📅',
    capabilities: [
      'Find optimal meeting times',
      'Identify focus blocks',
      'Prevent double-booking',
      'Suggest rescheduling',
      'Balance workload',
    ],
  },
  {
    type: 'research',
    name: 'Research Agent',
    description: 'Gathers information and context for upcoming events',
    icon: '🔍',
    capabilities: [
      'Research topics',
      'Compile background info',
      'Find relevant resources',
      'Summarize documents',
      'Prepare Q&A lists',
    ],
  },
  {
    type: 'communication',
    name: 'Comms Agent',
    description: 'Handles routine communications and updates',
    icon: '💬',
    capabilities: [
      'Draft status updates',
      'Compose invitations',
      'Send confirmations',
      'Request availability',
      'Share meeting notes',
    ],
  },
  {
    type: 'documentation',
    name: 'Docs Agent',
    description: 'Creates and maintains documentation from events',
    icon: '📝',
    capabilities: [
      'Generate meeting notes',
      'Create summaries',
      'Update wikis',
      'Maintain records',
      'Archive decisions',
    ],
  },
];
