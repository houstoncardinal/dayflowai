import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus, Crown, Shield, User, Mail, Trash2, Settings, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: string;
  max_seats: number;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  invited_email: string | null;
  invite_status: string;
}

interface SharedCalendar {
  id: string;
  team_id: string;
  name: string;
  color: string;
  visibility: string;
}

export default function TeamWorkspace({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [calendarName, setCalendarName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen && user) fetchTeams();
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedTeam) {
      fetchMembers();
      fetchCalendars();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*');
    const teamsData = (data as Team[]) || [];
    setTeams(teamsData);
    if (teamsData.length > 0 && !selectedTeam) setSelectedTeam(teamsData[0]);
  };

  const fetchMembers = async () => {
    if (!selectedTeam) return;
    const { data } = await supabase.from('team_members').select('*').eq('team_id', selectedTeam.id);
    setMembers((data as TeamMember[]) || []);
  };

  const fetchCalendars = async () => {
    if (!selectedTeam) return;
    const { data } = await supabase.from('shared_calendars').select('*').eq('team_id', selectedTeam.id);
    setCalendars((data as SharedCalendar[]) || []);
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const { data, error } = await supabase.from('teams').insert({
      name: teamName.trim(),
      slug: slug + '-' + Math.random().toString(36).substring(2, 6),
      owner_id: user!.id,
    }).select().single();

    if (!error && data) {
      // Add owner as team member
      await supabase.from('team_members').insert({
        team_id: data.id,
        user_id: user!.id,
        role: 'owner',
      });
      toast.success('Team created!');
      setTeamName('');
      setShowCreateTeam(false);
      fetchTeams();
      setSelectedTeam(data as Team);
    } else {
      toast.error('Failed to create team');
    }
    setCreating(false);
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !selectedTeam) return;
    
    const { error } = await supabase.from('team_members').insert({
      team_id: selectedTeam.id,
      user_id: user!.id, // placeholder - in production would look up user by email
      invited_email: inviteEmail.trim(),
      invite_status: 'pending',
      role: 'member',
    });

    if (!error) {
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      fetchMembers();
    } else {
      toast.error('Failed to send invite');
    }
  };

  const createSharedCalendar = async () => {
    if (!calendarName.trim() || !selectedTeam) return;
    
    const { error } = await supabase.from('shared_calendars').insert({
      team_id: selectedTeam.id,
      name: calendarName.trim(),
      created_by: user!.id,
    });

    if (!error) {
      toast.success('Shared calendar created!');
      setCalendarName('');
      fetchCalendars();
    }
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('team_members').delete().eq('id', memberId);
    toast.success('Member removed');
    fetchMembers();
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3.5 w-3.5 text-amber-500" />;
      case 'admin': return <Shield className="h-3.5 w-3.5 text-blue-500" />;
      default: return <User className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workspace
          </DialogTitle>
        </DialogHeader>

        {teams.length === 0 && !showCreateTeam ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Create a team to share calendars and collaborate</p>
            <Button onClick={() => setShowCreateTeam(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Team
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Team selector */}
            <div className="flex items-center gap-2">
              <Select value={selectedTeam?.id || ''} onValueChange={(id) => setSelectedTeam(teams.find(t => t.id === id) || null)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setShowCreateTeam(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showCreateTeam && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-secondary/50 rounded-xl p-4 space-y-3">
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name" />
                <div className="flex gap-2">
                  <Button onClick={createTeam} disabled={creating || !teamName.trim()} className="flex-1">
                    {creating ? 'Creating...' : 'Create Team'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreateTeam(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}

            {selectedTeam && (
              <Tabs defaultValue="members">
                <TabsList className="w-full">
                  <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
                  <TabsTrigger value="calendars" className="flex-1">Shared Calendars</TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-3 mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Invite by email"
                      type="email"
                    />
                    <Button onClick={inviteMember} disabled={!inviteEmail.trim()} className="gap-1">
                      <Mail className="h-4 w-4" /> Invite
                    </Button>
                  </div>

                  <AnimatePresence>
                    {members.map((member) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-3 bg-card border border-border rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          {roleIcon(member.role)}
                          <div>
                            <span className="text-sm font-medium">
                              {member.invited_email || member.user_id.substring(0, 8)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                              {member.invite_status === 'pending' && (
                                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {member.role !== 'owner' && selectedTeam.owner_id === user?.id && (
                          <Button variant="ghost" size="sm" onClick={() => removeMember(member.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {members.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No members yet. Invite your team!</p>
                  )}
                </TabsContent>

                <TabsContent value="calendars" className="space-y-3 mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={calendarName}
                      onChange={(e) => setCalendarName(e.target.value)}
                      placeholder="Calendar name"
                    />
                    <Button onClick={createSharedCalendar} disabled={!calendarName.trim()} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>

                  <AnimatePresence>
                    {calendars.map((cal) => (
                      <motion.div
                        key={cal.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                      >
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{cal.name}</span>
                          <span className="text-xs text-muted-foreground ml-2 capitalize">{cal.visibility}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {calendars.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No shared calendars yet</p>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium">Team Name</label>
                      <p className="text-lg font-semibold">{selectedTeam.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Plan</label>
                      <p className="text-sm text-muted-foreground capitalize">{selectedTeam.plan}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Members</label>
                      <p className="text-sm text-muted-foreground">{members.length} / {selectedTeam.max_seats} seats</p>
                    </div>
                    {selectedTeam.owner_id === user?.id && (
                      <Button variant="destructive" size="sm" className="mt-4" onClick={async () => {
                        await supabase.from('teams').delete().eq('id', selectedTeam.id);
                        toast.success('Team deleted');
                        setSelectedTeam(null);
                        fetchTeams();
                      }}>
                        Delete Team
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
