import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Webhook, Plus, Copy, Trash2, Eye, EyeOff, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  failure_count: number;
  last_triggered_at: string | null;
}

export default function APIWebhooks({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchApiKeys();
      fetchWebhooks();
    }
  }, [isOpen, user]);

  const fetchApiKeys = async () => {
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setApiKeys((data as ApiKey[]) || []);
  };

  const fetchWebhooks = async () => {
    const { data } = await supabase.from('webhooks').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setWebhooks((data as WebhookConfig[]) || []);
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) return;
    const key = 'dfk_' + crypto.randomUUID().replace(/-/g, '');
    const prefix = key.substring(0, 8);
    // Simple hash for storage (in production use proper hashing)
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { error } = await supabase.from('api_keys').insert({
      user_id: user!.id,
      name: newKeyName.trim(),
      key_hash: keyHash,
      key_prefix: prefix,
      scopes: ['read:events', 'write:events'],
    });

    if (!error) {
      setGeneratedKey(key);
      setNewKeyName('');
      fetchApiKeys();
      toast.success('API key created! Copy it now — it won\'t be shown again.');
    }
  };

  const deleteApiKey = async (id: string) => {
    await supabase.from('api_keys').delete().eq('id', id);
    toast.success('API key deleted');
    fetchApiKeys();
  };

  const createWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    const secret = 'whsec_' + crypto.randomUUID().replace(/-/g, '');

    const { error } = await supabase.from('webhooks').insert({
      user_id: user!.id,
      url: newWebhookUrl.trim(),
      secret,
      events: ['event.created', 'event.updated', 'event.deleted'],
    });

    if (!error) {
      toast.success('Webhook created!');
      setNewWebhookUrl('');
      fetchWebhooks();
    }
  };

  const toggleWebhook = async (id: string, isActive: boolean) => {
    await supabase.from('webhooks').update({ is_active: !isActive }).eq('id', id);
    fetchWebhooks();
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from('webhooks').delete().eq('id', id);
    toast.success('Webhook deleted');
    fetchWebhooks();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> API & Webhooks
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="keys">
          <TabsList className="w-full">
            <TabsTrigger value="keys" className="flex-1 gap-1"><Key className="h-3.5 w-3.5" /> API Keys</TabsTrigger>
            <TabsTrigger value="webhooks" className="flex-1 gap-1"><Webhook className="h-3.5 w-3.5" /> Webhooks</TabsTrigger>
            <TabsTrigger value="docs" className="flex-1 gap-1"><Globe className="h-3.5 w-3.5" /> Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4 mt-4">
            {generatedKey && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">⚠️ Copy your key now. It won't be shown again!</p>
                <div className="flex gap-2">
                  <code className="text-xs bg-background p-2 rounded-lg flex-1 break-all">{generatedKey}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedKey); toast.success('Copied!'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => setGeneratedKey(null)}>Dismiss</Button>
              </motion.div>
            )}

            <div className="flex gap-2">
              <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key name (e.g. Production)" />
              <Button onClick={generateApiKey} disabled={!newKeyName.trim()} className="gap-1">
                <Plus className="h-4 w-4" /> Generate
              </Button>
            </div>

            <AnimatePresence>
              {apiKeys.map((key) => (
                <motion.div key={key.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-xl"
                >
                  <div>
                    <span className="text-sm font-medium">{key.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-muted-foreground">{key.key_prefix}...****</code>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${key.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteApiKey(key.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>

            {apiKeys.length === 0 && !generatedKey && (
              <p className="text-center text-sm text-muted-foreground py-8">No API keys yet. Generate one to get started.</p>
            )}
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} placeholder="https://your-app.com/webhook" />
              <Button onClick={createWebhook} disabled={!newWebhookUrl.trim()} className="gap-1">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            <AnimatePresence>
              {webhooks.map((wh) => (
                <motion.div key={wh.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-3 bg-card border border-border rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs truncate block">{wh.url}</code>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{wh.events.length} events</span>
                        {wh.failure_count > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                            {wh.failure_count} failures
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={wh.is_active} onCheckedChange={() => toggleWebhook(wh.id, wh.is_active)} />
                      <Button variant="ghost" size="sm" onClick={() => deleteWebhook(wh.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {webhooks.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No webhooks configured yet.</p>
            )}
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <div className="bg-secondary/50 rounded-xl p-4 space-y-4 text-sm">
              <h3 className="font-semibold">API Reference</h3>
              <div className="space-y-3">
                <div>
                  <code className="text-xs bg-background px-2 py-1 rounded">GET /api/v1/events</code>
                  <p className="text-muted-foreground mt-1">List all events for the authenticated user</p>
                </div>
                <div>
                  <code className="text-xs bg-background px-2 py-1 rounded">POST /api/v1/events</code>
                  <p className="text-muted-foreground mt-1">Create a new event</p>
                </div>
                <div>
                  <code className="text-xs bg-background px-2 py-1 rounded">PUT /api/v1/events/:id</code>
                  <p className="text-muted-foreground mt-1">Update an existing event</p>
                </div>
                <div>
                  <code className="text-xs bg-background px-2 py-1 rounded">DELETE /api/v1/events/:id</code>
                  <p className="text-muted-foreground mt-1">Delete an event</p>
                </div>
              </div>
              <h3 className="font-semibold pt-4">Authentication</h3>
              <p className="text-muted-foreground">Include your API key in the Authorization header:</p>
              <code className="text-xs bg-background block p-3 rounded-lg">Authorization: Bearer dfk_your_api_key</code>
              
              <h3 className="font-semibold pt-4">Webhook Events</h3>
              <ul className="text-muted-foreground space-y-1">
                <li>• <code className="text-xs">event.created</code> — New event created</li>
                <li>• <code className="text-xs">event.updated</code> — Event modified</li>
                <li>• <code className="text-xs">event.deleted</code> — Event removed</li>
                <li>• <code className="text-xs">booking.created</code> — New booking via scheduling link</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
