import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarEvent, EventColor, RecurrenceRule } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  selectedDate: Date | null;
}

const COLORS: { value: EventColor; label: string; className: string }[] = [
  { value: 'coral', label: 'Coral', className: 'bg-event-coral' },
  { value: 'teal', label: 'Teal', className: 'bg-event-teal' },
  { value: 'amber', label: 'Amber', className: 'bg-event-amber' },
  { value: 'violet', label: 'Violet', className: 'bg-event-violet' },
  { value: 'emerald', label: 'Emerald', className: 'bg-event-emerald' },
  { value: 'rose', label: 'Rose', className: 'bg-event-rose' },
];

const RECURRENCE_OPTIONS: { value: RecurrenceRule; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function AddEventModal({ isOpen, onClose, onAdd, selectedDate }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<EventColor>('teal');
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDate) return;

    onAdd({
      title: title.trim(),
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: allDay ? null : startTime,
      end_time: allDay ? null : endTime,
      description: description.trim() || null,
      color,
      all_day: allDay,
      recurrence_rule: recurrence === 'none' ? null : recurrence,
      recurrence_end_date: recurrence !== 'none' && recurrenceEndDate ? recurrenceEndDate : null,
    });

    // Reset form
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setDescription('');
    setColor('teal');
    setAllDay(false);
    setRecurrence('none');
    setRecurrenceEndDate('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-semibold">New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="title" className="text-sm">Event Title</Label>
            <Input
              id="title"
              placeholder="What's happening?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-base md:text-sm"
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-sm">Date</Label>
            <div className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium">
              {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : 'Select a date'}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allDay">All day event</Label>
            <Switch
              id="allDay"
              checked={allDay}
              onCheckedChange={setAllDay}
            />
          </div>

          {!allDay && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-sm">Repeat</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceRule)}>
              <SelectTrigger>
                <SelectValue placeholder="Does not repeat" />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {recurrence !== 'none' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1.5 md:space-y-2"
            >
              <Label htmlFor="recurrenceEnd" className="text-sm">Repeat until (optional)</Label>
              <Input
                id="recurrenceEnd"
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                min={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
              />
            </motion.div>
          )}

          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-sm">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <motion.button
                  key={c.value}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'h-7 w-7 md:h-8 md:w-8 rounded-full transition-all',
                    c.className,
                    color === c.value && 'ring-2 ring-offset-2 ring-foreground'
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="description" className="text-sm">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-base md:text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !selectedDate} className="text-sm">
              Add Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
