import { ChevronLeft, ChevronRight, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CalendarView } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface CalendarHeaderProps {
  monthLabel: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
}

const views: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

export function CalendarHeader({
  monthLabel,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onAddEvent,
}: CalendarHeaderProps) {
  const location = useLocation();
  const isDemo = location.pathname === '/demo';
  
  // Only use auth when not in demo mode
  const auth = useAuth();
  const signOut = isDemo ? undefined : auth.signOut;
  const profile = isDemo ? null : auth.profile;

  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-6 py-4 border-b border-border"
    >
      <div className="flex items-center gap-4">
        <motion.h1 
          key={monthLabel}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-semibold tracking-tight min-w-[280px]"
        >
          {monthLabel}
        </motion.h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            className="h-8 w-8 rounded-full hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-8 w-8 rounded-full hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="text-sm font-medium"
        >
          Today
        </Button>
        
        <div className="flex items-center bg-secondary rounded-lg p-1 ml-4">
          {views.map((v) => (
            <button
              key={v.value}
              onClick={() => onViewChange(v.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                view === v.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!isDemo && profile?.display_name && (
          <span className="text-sm text-muted-foreground">
            Hi, {profile.display_name}
          </span>
        )}
        <Button onClick={onAddEvent} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
        {!isDemo && (
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.header>
  );
}
