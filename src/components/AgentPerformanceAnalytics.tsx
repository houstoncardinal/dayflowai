import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Zap,
  BarChart3,
  Timer,
  Award,
  Activity,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Agent, AutomationTask } from '@/types/agent';

interface AgentPerformanceMetrics {
  totalTasksCompleted: number;
  totalTimeSavedMinutes: number;
  completionRate: number;
  averageTaskDuration: number;
  tasksByType: Record<string, number>;
  tasksByStatus: {
    completed: number;
    pending: number;
    failed: number;
  };
  agentMetrics: {
    agent: Agent;
    tasksCompleted: number;
    timeSavedMinutes: number;
    successRate: number;
  }[];
}

interface AgentPerformanceAnalyticsProps {
  agents: Agent[];
  tasks: AutomationTask[];
}

const TIME_SAVINGS_MAP: Record<string, number> = {
  preparation: 15,
  'follow-up': 10,
  research: 20,
  documentation: 12,
  communication: 8,
  scheduling: 5,
};

export function AgentPerformanceAnalytics({ agents, tasks }: AgentPerformanceAnalyticsProps) {
  const metrics = calculateMetrics(agents, tasks);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-event-emerald/10 flex items-center justify-center">
              <Timer className="h-3.5 w-3.5 text-event-emerald" />
            </div>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-event-emerald">
            {formatTimeSaved(metrics.totalTimeSavedMinutes)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Time Saved</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-semibold tracking-tight">
            {metrics.totalTasksCompleted}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-event-amber/10 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-event-amber" />
            </div>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-event-amber">
            {metrics.completionRate}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Success Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-event-violet/10 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-event-violet" />
            </div>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-event-violet">
            {metrics.averageTaskDuration}s
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Avg. Process</p>
        </motion.div>
      </div>

      {/* Task Distribution */}
      {Object.keys(metrics.tasksByType).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-medium">Distribution</h4>
          </div>
          <div className="space-y-2.5">
            {Object.entries(metrics.tasksByType).map(([type, count], i) => {
              const total = Object.values(metrics.tasksByType).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground w-20 capitalize truncate">
                    {type}
                  </span>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                  <span className="text-[11px] font-medium w-6 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl border border-border bg-card"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-medium">Status</h4>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-event-emerald" />
            <span className="text-[11px] text-muted-foreground">Done</span>
            <span className="text-[11px] font-medium">{metrics.tasksByStatus.completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-event-amber" />
            <span className="text-[11px] text-muted-foreground">Pending</span>
            <span className="text-[11px] font-medium">{metrics.tasksByStatus.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-[11px] text-muted-foreground">Failed</span>
            <span className="text-[11px] font-medium">{metrics.tasksByStatus.failed}</span>
          </div>
        </div>
      </motion.div>

      {/* Agent Leaderboard */}
      {metrics.agentMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-3.5 w-3.5 text-event-amber" />
            <h4 className="text-xs font-medium">Agent Performance</h4>
          </div>
          <div className="space-y-2">
            {metrics.agentMetrics.slice(0, 4).map((am, i) => (
              <div 
                key={am.agent.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
              >
                <span className="text-base">{am.agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{am.agent.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {am.timeSavedMinutes}m saved
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-5">
                    {am.tasksCompleted}
                  </Badge>
                  <div className="w-10 text-right">
                    <span className="text-[10px] text-event-emerald font-medium">
                      {am.successRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Productivity Summary */}
      {metrics.totalTimeSavedMinutes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl border border-event-emerald/20 bg-event-emerald/5"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-event-emerald/20 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-event-emerald" />
            </div>
            <div>
              <p className="text-xs font-medium">Productivity Boost</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                AI agents saved you <span className="text-event-emerald font-semibold">{formatTimeSaved(metrics.totalTimeSavedMinutes)}</span> — 
                that's <span className="font-medium">{getProductivityEquivalent(metrics.totalTimeSavedMinutes)}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function calculateMetrics(agents: Agent[], tasks: AutomationTask[]): AgentPerformanceMetrics {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const failedTasks = tasks.filter(t => t.status === 'blocked');
  
  const totalTimeSavedMinutes = completedTasks.reduce((total, task) => {
    return total + (TIME_SAVINGS_MAP[task.type] || 10);
  }, 0);

  const tasksByType: Record<string, number> = {};
  tasks.forEach(task => {
    tasksByType[task.type] = (tasksByType[task.type] || 0) + 1;
  });

  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks.length / totalTasks) * 100) 
    : 0;

  const agentMetrics = agents.map(agent => {
    const agentTasks = tasks.filter(t => t.type === agent.type);
    const agentCompleted = agentTasks.filter(t => t.status === 'completed');
    const timeSaved = agentCompleted.length * (TIME_SAVINGS_MAP[agent.type] || 10);
    const successRate = agentTasks.length > 0 
      ? Math.round((agentCompleted.length / agentTasks.length) * 100)
      : 100;

    return {
      agent,
      tasksCompleted: agentCompleted.length,
      timeSavedMinutes: timeSaved,
      successRate,
    };
  }).filter(am => am.tasksCompleted > 0 || agents.find(a => a.id === am.agent.id)?.completedTasks! > 0);

  agents.forEach(agent => {
    if (agent.completedTasks > 0 && !agentMetrics.find(am => am.agent.id === agent.id)) {
      agentMetrics.push({
        agent,
        tasksCompleted: agent.completedTasks,
        timeSavedMinutes: agent.completedTasks * (TIME_SAVINGS_MAP[agent.type] || 10),
        successRate: 100,
      });
    }
  });

  agentMetrics.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

  return {
    totalTasksCompleted: completedTasks.length + agents.reduce((sum, a) => sum + a.completedTasks, 0),
    totalTimeSavedMinutes: totalTimeSavedMinutes + agents.reduce((sum, a) => sum + a.completedTasks * (TIME_SAVINGS_MAP[a.type] || 10), 0),
    completionRate,
    averageTaskDuration: 30,
    tasksByType,
    tasksByStatus: {
      completed: completedTasks.length,
      pending: pendingTasks.length,
      failed: failedTasks.length,
    },
    agentMetrics,
  };
}

function formatTimeSaved(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getProductivityEquivalent(minutes: number): string {
  if (minutes < 15) return 'a quick break';
  if (minutes < 30) return 'a focus session';
  if (minutes < 60) return 'a deep work block';
  if (minutes < 120) return 'an extra meeting';
  return 'half a workday';
}
