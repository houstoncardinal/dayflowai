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
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  weeklyTrend: {
    day: string;
    completed: number;
    timeSaved: number;
  }[];
}

interface AgentPerformanceAnalyticsProps {
  agents: Agent[];
  tasks: AutomationTask[];
}

// Estimated time savings per task type (in minutes)
const TIME_SAVINGS_MAP: Record<string, number> = {
  preparation: 15,
  'follow-up': 10,
  research: 20,
  documentation: 12,
  communication: 8,
  scheduling: 5,
};

export function AgentPerformanceAnalytics({ agents, tasks }: AgentPerformanceAnalyticsProps) {
  // Calculate metrics
  const metrics = calculateMetrics(agents, tasks);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-event-emerald/20 to-event-teal/10 rounded-xl p-4 border border-event-emerald/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-event-emerald/20 flex items-center justify-center">
              <Timer className="h-4 w-4 text-event-emerald" />
            </div>
          </div>
          <p className="text-2xl font-bold text-event-emerald">
            {formatTimeSaved(metrics.totalTimeSavedMinutes)}
          </p>
          <p className="text-xs text-muted-foreground">Time Saved</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-primary">
            {metrics.totalTasksCompleted}
          </p>
          <p className="text-xs text-muted-foreground">Tasks Completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-event-amber/20 to-event-coral/10 rounded-xl p-4 border border-event-amber/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-event-amber/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-event-amber" />
            </div>
          </div>
          <p className="text-2xl font-bold text-event-amber">
            {metrics.completionRate}%
          </p>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-event-violet/20 to-event-rose/10 rounded-xl p-4 border border-event-violet/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-event-violet/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-event-violet" />
            </div>
          </div>
          <p className="text-2xl font-bold text-event-violet">
            {metrics.averageTaskDuration}s
          </p>
          <p className="text-xs text-muted-foreground">Avg. AI Processing</p>
        </motion.div>
      </div>

      {/* Task Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-secondary/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Tasks by Type</h4>
        </div>
        <div className="space-y-2">
          {Object.entries(metrics.tasksByType).map(([type, count], i) => {
            const total = Object.values(metrics.tasksByType).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="text-xs text-muted-foreground w-24 capitalize truncate">
                  {type}
                </span>
                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>
                <span className="text-xs font-medium w-12 text-right">{count}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-secondary/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Task Status</h4>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-event-emerald" />
            <span className="text-xs">Completed</span>
            <Badge variant="secondary" className="ml-auto">
              {metrics.tasksByStatus.completed}
            </Badge>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-event-amber" />
            <span className="text-xs">Pending</span>
            <Badge variant="secondary" className="ml-auto">
              {metrics.tasksByStatus.pending}
            </Badge>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-xs">Failed</span>
            <Badge variant="secondary" className="ml-auto">
              {metrics.tasksByStatus.failed}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Agent Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-secondary/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-event-amber" />
          <h4 className="text-sm font-medium">Agent Performance</h4>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs">Agent</TableHead>
              <TableHead className="h-8 text-xs text-center">Tasks</TableHead>
              <TableHead className="h-8 text-xs text-center">Time Saved</TableHead>
              <TableHead className="h-8 text-xs text-right">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.agentMetrics.map((am, i) => (
              <TableRow key={am.agent.id}>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{am.agent.icon}</span>
                    <span className="text-xs font-medium">{am.agent.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2 text-center">
                  <Badge variant="outline" className="text-xs">
                    {am.tasksCompleted}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 text-center">
                  <span className="text-xs text-event-emerald font-medium">
                    {am.timeSavedMinutes}m
                  </span>
                </TableCell>
                <TableCell className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Progress 
                      value={am.successRate} 
                      className="h-1.5 w-12" 
                    />
                    <span className="text-xs text-muted-foreground w-8">
                      {am.successRate}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Productivity Insight */}
      {metrics.totalTimeSavedMinutes > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-event-emerald/10 via-event-teal/10 to-primary/10 rounded-xl p-4 border border-event-emerald/20"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-event-emerald/20 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-event-emerald" />
            </div>
            <div>
              <p className="text-sm font-medium">Productivity Boost</p>
              <p className="text-xs text-muted-foreground mt-1">
                AI agents have saved you <span className="text-event-emerald font-semibold">{formatTimeSaved(metrics.totalTimeSavedMinutes)}</span> this session. 
                That's equivalent to <span className="text-primary font-semibold">{getProductivityEquivalent(metrics.totalTimeSavedMinutes)}</span>!
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
  
  // Calculate total time saved based on task types
  const totalTimeSavedMinutes = completedTasks.reduce((total, task) => {
    return total + (TIME_SAVINGS_MAP[task.type] || 10);
  }, 0);

  // Calculate tasks by type
  const tasksByType: Record<string, number> = {};
  tasks.forEach(task => {
    tasksByType[task.type] = (tasksByType[task.type] || 0) + 1;
  });

  // Calculate completion rate
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks.length / totalTasks) * 100) 
    : 0;

  // Calculate agent-specific metrics
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

  // Add agents with completed tasks but no tasks in current analysis
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

  // Sort by tasks completed
  agentMetrics.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

  return {
    totalTasksCompleted: completedTasks.length + agents.reduce((sum, a) => sum + a.completedTasks, 0),
    totalTimeSavedMinutes: totalTimeSavedMinutes + agents.reduce((sum, a) => sum + a.completedTasks * (TIME_SAVINGS_MAP[a.type] || 10), 0),
    completionRate,
    averageTaskDuration: 30, // AI typically takes ~30 seconds
    tasksByType,
    tasksByStatus: {
      completed: completedTasks.length,
      pending: pendingTasks.length,
      failed: failedTasks.length,
    },
    agentMetrics,
    weeklyTrend: [], // Would need historical data
  };
}

function formatTimeSaved(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getProductivityEquivalent(minutes: number): string {
  if (minutes < 15) return 'a quick coffee break';
  if (minutes < 30) return 'a focused power session';
  if (minutes < 60) return 'a deep work block';
  if (minutes < 120) return 'an extra meeting';
  if (minutes < 240) return 'half a workday';
  return 'almost a full workday';
}
