import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfWeek, isBefore, isToday, addMinutes, parse } from 'date-fns';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, User, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SchedulingLink {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  color: string;
  availability: Record<string, { start: string; end: string }>;
  buffer_minutes: number;
  max_bookings_per_day: number;
  is_active: boolean;
}

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [link, setLink] = useState<SchedulingLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirmed'>('date');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) fetchLink();
  }, [slug]);

  useEffect(() => {
    if (link && selectedDate) fetchBookingsForDate();
  }, [selectedDate, link]);

  const fetchLink = async () => {
    const { data } = await supabase
      .from('scheduling_links')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    setLink(data as SchedulingLink | null);
    setLoading(false);
  };

  const fetchBookingsForDate = async () => {
    if (!link || !selectedDate) return;
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('scheduling_link_id', link.id)
      .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
      .eq('status', 'confirmed');
    setExistingBookings(data || []);
  };

  const getAvailableSlots = (): string[] => {
    if (!link || !selectedDate) return [];
    const dayName = dayNames[selectedDate.getDay()];
    const avail = (link.availability as Record<string, { start: string; end: string }>)?.[dayName];
    if (!avail) return [];

    const slots: string[] = [];
    let current = parse(avail.start, 'HH:mm', selectedDate);
    const end = parse(avail.end, 'HH:mm', selectedDate);

    while (isBefore(addMinutes(current, link.duration_minutes), end) || 
           format(addMinutes(current, link.duration_minutes), 'HH:mm') === avail.end) {
      const timeStr = format(current, 'HH:mm');
      const endStr = format(addMinutes(current, link.duration_minutes), 'HH:mm');
      
      // Check conflicts with existing bookings
      const hasConflict = existingBookings.some(b => {
        const bStart = b.start_time.substring(0, 5);
        const bEnd = b.end_time.substring(0, 5);
        return (timeStr < bEnd && endStr > bStart);
      });

      if (!hasConflict) slots.push(timeStr);
      current = addMinutes(current, link.duration_minutes + link.buffer_minutes);
      if (isBefore(end, current) && format(current, 'HH:mm') !== avail.end) break;
    }

    return slots.slice(0, link.max_bookings_per_day);
  };

  const handleBook = async () => {
    if (!link || !selectedDate || !selectedTime) return;
    setSubmitting(true);

    const endTime = format(
      addMinutes(parse(selectedTime, 'HH:mm', new Date()), link.duration_minutes),
      'HH:mm'
    );

    const { error } = await supabase.from('bookings').insert({
      scheduling_link_id: link.id,
      host_user_id: link.user_id,
      guest_name: guestName,
      guest_email: guestEmail,
      booking_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime,
      end_time: endTime,
      notes: notes || null,
    });

    setSubmitting(false);
    if (error) {
      toast.error('Failed to book. Please try again.');
    } else {
      setStep('confirmed');
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const isDayAvailable = (date: Date) => {
    if (!link) return false;
    if (isBefore(date, new Date()) && !isToday(date)) return false;
    const dayName = dayNames[date.getDay()];
    return !!(link.availability as Record<string, any>)?.[dayName];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link not found</h1>
          <p className="text-muted-foreground">This scheduling link doesn't exist or is inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{link.title}</h1>
              {link.description && (
                <p className="text-sm text-muted-foreground">{link.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {link.duration_minutes} min
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'confirmed' ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-muted-foreground mb-4">
                {format(selectedDate!, 'EEEE, MMMM d, yyyy')} at {selectedTime}
              </p>
              <p className="text-sm text-muted-foreground">
                A confirmation has been sent to {guestEmail}
              </p>
            </motion.div>
          ) : (
            <div className="p-6">
              {/* Step indicators */}
              <div className="flex items-center gap-2 mb-6">
                {['date', 'time', 'details'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      step === s ? 'bg-primary' : 
                      ['date', 'time', 'details'].indexOf(step) > i ? 'bg-primary/50' : 'bg-muted'
                    }`} />
                    {i < 2 && <div className="w-8 h-px bg-border" />}
                  </div>
                ))}
              </div>

              {step === 'date' && (
                <motion.div key="date" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <h2 className="text-lg font-semibold mb-4">Select a Date</h2>
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const available = isDayAvailable(day);
                      const selected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => available && setSelectedDate(day)}
                          disabled={!available}
                          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                            selected ? 'bg-primary text-primary-foreground' :
                            available ? 'hover:bg-secondary cursor-pointer' :
                            'opacity-30 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-xs text-muted-foreground mb-1">{format(day, 'EEE')}</span>
                          <span className="text-lg font-semibold">{format(day, 'd')}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    className="w-full mt-6"
                    disabled={!selectedDate}
                    onClick={() => setStep('time')}
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {step === 'time' && (
                <motion.div key="time" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setStep('date')}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <h2 className="text-lg font-semibold">
                      {selectedDate && format(selectedDate, 'EEEE, MMM d')}
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {getAvailableSlots().map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all ${
                          selectedTime === slot
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  {getAvailableSlots().length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No available slots for this day.</p>
                  )}
                  <Button
                    className="w-full mt-6"
                    disabled={!selectedTime}
                    onClick={() => setStep('details')}
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {step === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setStep('time')}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <h2 className="text-lg font-semibold">Your Details</h2>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                    <div className="text-sm font-medium">
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedTime} – {link.duration_minutes} min
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Your name"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Anything you'd like to share..."
                          className="pl-10 min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-6"
                    disabled={!guestName || !guestEmail || submitting}
                    onClick={handleBook}
                  >
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        <div className="p-4 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold">Dayflow</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
