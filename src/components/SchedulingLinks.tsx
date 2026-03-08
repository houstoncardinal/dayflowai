import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link2, Plus, Copy, ExternalLink, Trash2, ToggleLeft, ToggleRight, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SchedulingLink {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  color: string;
  is_active: boolean;
  created_at: string;
}

export default function SchedulingLinks({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [links, setLinks] = useState<SchedulingLink[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen && user) fetchLinks();
  }, [isOpen, user]);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from('scheduling_links')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setLinks((data as SchedulingLink[]) || []);
  };

  const createLink = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6);
    
    const { error } = await supabase.from('scheduling_links').insert({
      user_id: user!.id,
      slug,
      title: title.trim(),
      duration_minutes: parseInt(duration),
    });

    setCreating(false);
    if (error) {
      toast.error('Failed to create link');
    } else {
      toast.success('Scheduling link created!');
      setTitle('');
      setShowCreate(false);
      fetchLinks();
    }
  };

  const toggleLink = async (id: string, isActive: boolean) => {
    await supabase.from('scheduling_links').update({ is_active: !isActive }).eq('id', id);
    fetchLinks();
  };

  const deleteLink = async (id: string) => {
    await supabase.from('scheduling_links').delete().eq('id', id);
    toast.success('Link deleted');
    fetchLinks();
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Scheduling Links
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showCreate ? (
            <Button onClick={() => setShowCreate(true)} variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" /> Create New Link
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting title (e.g. Quick Chat)"
              />
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={createLink} disabled={creating || !title.trim()} className="flex-1">
                  {creating ? 'Creating...' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {links.map((link) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{link.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {link.duration_minutes} min
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full ${link.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={link.is_active}
                    onCheckedChange={() => toggleLink(link.id, link.is_active)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => copyLink(link.slug)} className="gap-1 flex-1">
                    <Copy className="h-3 w-3" /> Copy Link
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/book/${link.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteLink(link.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {links.length === 0 && !showCreate && (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No scheduling links yet</p>
              <p className="text-xs">Create one to let people book time with you</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
