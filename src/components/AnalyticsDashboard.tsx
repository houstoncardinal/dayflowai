import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Clock, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  X, 
  Calendar,
  Sparkles,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAnalytics, WeeklyAnalytics } from '@/hooks/useAnalytics';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsDashboardProps {
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
}

const colorMap: Record<string, string> = {
  coral: 'hsl(var(--chart-1))',
  teal: 'hsl(var(--chart-2))',
  amber: 'hsl(var(--chart-3))',
  violet: 'hsl(var(--chart-4))',
  emerald: 'hsl(var(--chart-5))',
  rose: 'hsl(351, 73%, 54%)',
};

const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export function AnalyticsDashboard({ events, isOpen, onClose }: AnalyticsDashboardProps) {
  const analytics = useAnalytics(events);
  
  if (!isOpen) return null;
  
  const weekRange = `${format(analytics.weekStart, 'MMM d')} - ${format(analytics.weekEnd, 'MMM d, yyyy')}`;
  
  // Total working minutes in a week for percentage calculation
  const totalWorkMinutes = 480 * 5; // 8 hours * 5 days
  const focusPercentage = Math.min(100, (analytics.focusTimeMinutes / totalWorkMinutes) * 100);
  const meetingPercentage = Math.min(100, (analytics.meetingMinutes / totalWorkMinutes) * 100);
  
  const chartConfig = {
    meetings: { label: 'Meetings', color: 'hsl(var(--chart-1))' },
    focusTime: { label: 'Focus Time', color: 'hsl(var(--chart-2))' },
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Weekly Analytics</h2>
                <p className="text-sm text-muted-foreground">{weekRange}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Meetings */}
              <Card className="bg-gradient-to-br from-chart-1/10 to-transparent border-chart-1/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Meetings</span>
                  </div>
                  <div className="text-2xl font-bold">{analytics.totalMeetings}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatMinutes(analytics.meetingMinutes)}
                  </div>
                  {analytics.comparisonToPreviousWeek.meetingsChange !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      analytics.comparisonToPreviousWeek.meetingsChange > 0 
                        ? 'text-destructive' 
                        : 'text-emerald-500'
                    }`}>
                      {analytics.comparisonToPreviousWeek.meetingsChange > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatMinutes(Math.abs(analytics.comparisonToPreviousWeek.meetingsChange))} vs last week
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Focus Time */}
              <Card className="bg-gradient-to-br from-chart-2/10 to-transparent border-chart-2/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Focus Time</span>
                  </div>
                  <div className="text-2xl font-bold">{formatMinutes(analytics.focusTimeMinutes)}</div>
                  <div className="text-sm text-muted-foreground">
                    {focusPercentage.toFixed(0)}% of work week
                  </div>
                  {analytics.comparisonToPreviousWeek.focusTimeChange !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      analytics.comparisonToPreviousWeek.focusTimeChange > 0 
                        ? 'text-emerald-500' 
                        : 'text-destructive'
                    }`}>
                      {analytics.comparisonToPreviousWeek.focusTimeChange > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatMinutes(Math.abs(analytics.comparisonToPreviousWeek.focusTimeChange))} vs last week
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Automation Savings */}
              <Card className="bg-gradient-to-br from-chart-3/10 to-transparent border-chart-3/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Time Saved</span>
                  </div>
                  <div className="text-2xl font-bold">{formatMinutes(analytics.automationSavingsMinutes)}</div>
                  <div className="text-sm text-muted-foreground">
                    via AI automation
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500">
                    <Sparkles className="h-3 w-3" />
                    {analytics.automatedTasksCount} automated tasks
                  </div>
                </CardContent>
              </Card>
              
              {/* Voice Commands */}
              <Card className="bg-gradient-to-br from-chart-4/10 to-transparent border-chart-4/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Mic className="h-4 w-4" />
                    <span className="text-sm">Voice Commands</span>
                  </div>
                  <div className="text-2xl font-bold">{analytics.voiceCommandsUsed}</div>
                  <div className="text-sm text-muted-foreground">
                    commands this week
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                    <Clock className="h-3 w-3" />
                    {formatMinutes(analytics.voiceCommandsUsed * 2)} saved
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Daily Breakdown Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daily Time Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <BarChart data={analytics.eventsByDay}>
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.floor(v / 60)}h`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="meetings" 
                        name="Meetings"
                        fill="hsl(var(--chart-1))" 
                        radius={[4, 4, 0, 0]} 
                        stackId="a"
                      />
                      <Bar 
                        dataKey="focusTime" 
                        name="Focus Time"
                        fill="hsl(var(--chart-2))" 
                        radius={[4, 4, 0, 0]} 
                        stackId="a"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              
              {/* Category Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Events by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.eventsByColor.length > 0 ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.eventsByColor}
                            dataKey="count"
                            nameKey="color"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {analytics.eventsByColor.map((entry, index) => (
                              <Cell key={entry.color} fill={colorMap[entry.color] || 'hsl(var(--muted))'} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No events this week
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 justify-center mt-2">
                    {analytics.eventsByColor.map(({ color, count }) => (
                      <div key={color} className="flex items-center gap-1.5">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: colorMap[color] || 'hsl(var(--muted))' }}
                        />
                        <span className="text-xs capitalize">{color} ({count})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Progress Bars */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Weekly Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Meeting Load</span>
                    <span className="text-muted-foreground">{meetingPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={meetingPercentage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Focus Time</span>
                    <span className="text-muted-foreground">{focusPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={focusPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
