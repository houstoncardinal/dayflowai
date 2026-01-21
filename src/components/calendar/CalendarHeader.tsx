import { ChevronLeft, ChevronRight, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CalendarView, EventColor } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { SearchFilter } from './SearchFilter';

interface CalendarHeaderProps {
  monthLabel: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  colorFilter?: EventColor[];
  onColorFilterChange?: (colors: EventColor[]) => void;
}

const views: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'M' },
  { value: 'week', label: 'W' },
  { value: 'day', label: 'D' },
];

const viewsFull: { value: CalendarView; label: string }[] = [
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
  searchQuery = '',
  onSearchChange,
  colorFilter = [],
  onColorFilterChange,
}: CalendarHeaderProps) {
  const location = useLocation();
  const isDemo = location.pathname === '/demo';
  const isMobile = useIsMobile();
  
  // Only use auth when not in demo mode
  const auth = useAuth();
  const signOut = isDemo ? undefined : auth.signOut;
  const profile = isDemo ? null : auth.profile;

  const currentViews = isMobile ? views : viewsFull;

  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-border gap-2"
    >
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <motion.h1 
          key={monthLabel}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg md:text-2xl font-semibold tracking-tight truncate md:min-w-[280px]"
        >
          {monthLabel}
        </motion.h1>
        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="text-xs md:text-sm font-medium h-7 md:h-8 px-2 md:px-3 hidden sm:inline-flex"
        >
          Today
        </Button>
        
        <div className="flex items-center bg-secondary rounded-lg p-0.5 md:p-1 ml-1 md:ml-4 shrink-0">
          {currentViews.map((v) => (
            <button
              key={v.value}
              onClick={() => onViewChange(v.value)}
              className={cn(
                'px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-md transition-all',
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
      
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {onSearchChange && onColorFilterChange && (
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            selectedColors={colorFilter}
            onColorFilterChange={onColorFilterChange}
          />
        )}
        {!isDemo && profile?.display_name && (
          <span className="text-sm text-muted-foreground hidden lg:block">
            Hi, {profile.display_name}
          </span>
        )}
        <Button onClick={onAddEvent} className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-4 text-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Event</span>
        </Button>
        {!isDemo && (
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="hidden md:inline-flex">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.header>
  );
}
