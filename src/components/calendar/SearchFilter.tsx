import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EventColor } from '@/types/calendar';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedColors: EventColor[];
  onColorFilterChange: (colors: EventColor[]) => void;
}

const COLORS: { value: EventColor; label: string; className: string }[] = [
  { value: 'coral', label: 'Coral', className: 'bg-event-coral' },
  { value: 'teal', label: 'Teal', className: 'bg-event-teal' },
  { value: 'amber', label: 'Amber', className: 'bg-event-amber' },
  { value: 'violet', label: 'Violet', className: 'bg-event-violet' },
  { value: 'emerald', label: 'Emerald', className: 'bg-event-emerald' },
  { value: 'rose', label: 'Rose', className: 'bg-event-rose' },
];

export function SearchFilter({
  searchQuery,
  onSearchChange,
  selectedColors,
  onColorFilterChange,
}: SearchFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleColor = (color: EventColor) => {
    if (selectedColors.includes(color)) {
      onColorFilterChange(selectedColors.filter((c) => c !== color));
    } else {
      onColorFilterChange([...selectedColors, color]);
    }
  };

  const clearFilters = () => {
    onSearchChange('');
    onColorFilterChange([]);
  };

  const hasActiveFilters = searchQuery || selectedColors.length > 0;

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8 w-48 md:w-64"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(true)}
              className="relative"
            >
              <Search className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Filter className="h-4 w-4" />
            {selectedColors.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {selectedColors.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filter by color</span>
              {selectedColors.length > 0 && (
                <button
                  onClick={() => onColorFilterChange([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => toggleColor(c.value)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    c.className,
                    selectedColors.includes(c.value) 
                      ? 'ring-2 ring-offset-2 ring-foreground scale-110' 
                      : 'opacity-60 hover:opacity-100'
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsExpanded(false);
            if (!hasActiveFilters) clearFilters();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {hasActiveFilters && !isExpanded && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
          Clear filters
        </Button>
      )}
    </div>
  );
}
