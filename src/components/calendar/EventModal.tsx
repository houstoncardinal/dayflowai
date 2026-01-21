import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
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
import { Trash2, Calendar, Clock, Repeat } from 'lucide-react';

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CalendarEvent>) => void;
  onDelete: (id: string) => void;
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

export function EventModal({ event, isOpen, onClose, onUpdate, onDelete }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<EventColor>('teal');
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setEventDate(event.event_date);
      setStartTime(event.start_time || '09:00');
      setEndTime(event.end_time || '10:00');
      setDescription(event.description || '');
      setColor(event.color);
      setAllDay(event.all_day || false);
      setRecurrence((event.recurrence_rule as RecurrenceRule) || 'none');
      setRecurrenceEndDate(event.recurrence_end_date || '');
      setIsEditing(false);
    }
  }, [event]);

  const handleSave = () => {
    if (!event || !title.trim()) return;

    onUpdate(event.id, {
      title: title.trim(),
      event_date: eventDate,
      start_time: allDay ? null : startTime,
      end_time: allDay ? null : endTime,
      description: description.trim() || null,
      color,
      all_day: allDay,
      recurrence_rule: recurrence === 'none' ? null : recurrence,
      recurrence_end_date: recurrence !== 'none' && recurrenceEndDate ? recurrenceEndDate : null,
    });

    setIsEditing(false);
    onClose();
  };

  const handleDelete = () => {
    if (!event) return;
    onDelete(event.id);
    onClose();
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-semibold flex items-center justify-between">
            <span>{isEditing ? 'Edit Event' : 'Event Details'}</span>
            <div className={cn('h-3 w-3 rounded-full', `bg-event-${color}`)} />
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-3 md:space-y-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="edit-title" className="text-sm">Event Title</Label>
              <Input
                id="edit-title"
                placeholder="What's happening?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="text-base md:text-sm"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="edit-date" className="text-sm">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-allDay">All day event</Label>
              <Switch
                id="edit-allDay"
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
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
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
                <Label htmlFor="edit-recurrenceEnd" className="text-sm">Repeat until (optional)</Label>
                <Input
                  id="edit-recurrenceEnd"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  min={eventDate}
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
              <Label htmlFor="edit-description" className="text-sm">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-base md:text-sm"
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button 
                type="button" 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="text-sm">
                  Cancel
                </Button>
                <Button type="submit" disabled={!title.trim()} className="text-sm">
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{event.title}</h3>
              {event.description && (
                <p className="text-muted-foreground mt-1">{event.description}</p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(parseISO(event.event_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              
              {!event.all_day && event.start_time && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {event.start_time}
                    {event.end_time && ` - ${event.end_time}`}
                  </span>
                </div>
              )}
              
              {event.all_day && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>All day</span>
                </div>
              )}

              {event.recurrence_rule && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Repeat className="h-4 w-4" />
                  <span className="capitalize">{event.recurrence_rule}</span>
                  {event.recurrence_end_date && (
                    <span>until {format(parseISO(event.recurrence_end_date), 'MMM d, yyyy')}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Edit Event
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
