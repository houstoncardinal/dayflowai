import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Bell, Globe, Shield, CalendarDays, ArrowLeft, Save, Loader2, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Asia/Karachi', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland',
];

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const { plan, isPro } = useSubscription();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationMinutes, setNotificationMinutes] = useState(15);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile) {
      setDisplayName(profile.display_name || '');
      setTimezone(profile.timezone || 'UTC');
      setNotificationsEnabled(profile.notification_enabled ?? true);
      setNotificationMinutes(profile.notification_minutes_before ?? 15);
    }
  }, [user, profile, navigate]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        timezone,
        notification_enabled: notificationsEnabled,
        notification_minutes_before: notificationMinutes,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved');
    }
    setSaving(false);
  };

  if (!user) return null;

  const planColors: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    pro: 'bg-event-amber/20 text-event-amber',
    team: 'bg-event-violet/20 text-event-violet',
    business: 'bg-event-teal/20 text-event-teal',
    enterprise: 'bg-gradient-to-r from-event-amber to-event-coral text-white',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account & preferences</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-6">
          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Your current plan and billing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={planColors[plan] || planColors.free}>
                    {plan.toUpperCase()} Plan
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isPro ? 'Full access to all features' : 'Upgrade to unlock all features'}
                  </p>
                </div>
                {!isPro && (
                  <Button onClick={() => navigate('/pricing')} variant="outline">
                    Upgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>Customize your calendar experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>How you receive reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable notifications</Label>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
              {notificationsEnabled && (
                <div className="space-y-2">
                  <Label>Remind me before events</Label>
                  <Select value={String(notificationMinutes)} onValueChange={(v) => setNotificationMinutes(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save & Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="destructive" onClick={() => signOut()}>
              Sign Out
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
