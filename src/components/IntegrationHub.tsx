import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Check, ChevronRight, ExternalLink, Zap, MessageSquare, Calendar, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface IntegrationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  status: 'available' | 'connected' | 'coming_soon';
  features: string[];
  category: string;
}

const integrations: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send meeting reminders, daily briefings, and follow-ups to Slack channels',
    icon: MessageSquare,
    color: 'from-[#4A154B] to-[#611f69]',
    status: 'available',
    features: ['Meeting reminders', 'Daily briefings', 'AI summaries to channels', 'Follow-up notifications'],
    category: 'Communication',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Two-way sync with Google Calendar for seamless event management',
    icon: Calendar,
    color: 'from-[#4285F4] to-[#1a73e8]',
    status: 'available',
    features: ['Import events', 'Export events', 'Real-time sync', 'Color mapping'],
    category: 'Calendar',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Auto-create meeting notes, sync tasks, and maintain project docs',
    icon: FileText,
    color: 'from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-300',
    status: 'coming_soon',
    features: ['Auto meeting notes', 'Task sync', 'Project documentation', 'Decision records'],
    category: 'Productivity',
  },
  {
    id: 'email',
    name: 'Email (SMTP)',
    description: 'Send automated meeting reminders, follow-ups, and reports via email',
    icon: Mail,
    color: 'from-event-coral to-rose-600',
    status: 'coming_soon',
    features: ['Meeting reminders', 'Auto follow-ups', 'Weekly reports', 'Custom templates'],
    category: 'Communication',
  },
];

export function IntegrationHub({ isOpen, onClose }: IntegrationHubProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (integrationId: string) => {
    setConnectingId(integrationId);
    // Simulate connection - in real implementation this would trigger OAuth or connector setup
    await new Promise(r => setTimeout(r, 1500));
    setConnectingId(null);
  };

  if (!isOpen) return null;

  const connected = integrations.filter(i => i.status === 'connected');
  const available = integrations.filter(i => i.status === 'available');
  const comingSoon = integrations.filter(i => i.status === 'coming_soon');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55]"
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 z-[56] w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                  <Link2 className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Integrations</h2>
                  <p className="text-xs text-muted-foreground">
                    Connect your favorite tools
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {/* Connected */}
                {connected.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-event-emerald px-1 mb-2">
                      Connected
                    </p>
                    <div className="space-y-2">
                      {connected.map(integration => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          isExpanded={expandedId === integration.id}
                          onToggle={() => setExpandedId(prev => prev === integration.id ? null : integration.id)}
                          onConnect={() => handleConnect(integration.id)}
                          isConnecting={connectingId === integration.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Available */}
                {available.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-event-amber px-1 mb-2">
                      Available
                    </p>
                    <div className="space-y-2">
                      {available.map(integration => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          isExpanded={expandedId === integration.id}
                          onToggle={() => setExpandedId(prev => prev === integration.id ? null : integration.id)}
                          onConnect={() => handleConnect(integration.id)}
                          isConnecting={connectingId === integration.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Coming Soon */}
                {comingSoon.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                      Coming Soon
                    </p>
                    <div className="space-y-2">
                      {comingSoon.map(integration => (
                        <IntegrationCard
                          key={integration.id}
                          integration={integration}
                          isExpanded={expandedId === integration.id}
                          onToggle={() => setExpandedId(prev => prev === integration.id ? null : integration.id)}
                          onConnect={() => {}}
                          isConnecting={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <p className="text-[11px] text-muted-foreground text-center">
                Integrations power your AI automations across platforms
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function IntegrationCard({
  integration,
  isExpanded,
  onToggle,
  onConnect,
  isConnecting,
}: {
  integration: Integration;
  isExpanded: boolean;
  onToggle: () => void;
  onConnect: () => void;
  isConnecting: boolean;
}) {
  const isComingSoon = integration.status === 'coming_soon';
  const isConnected = integration.status === 'connected';

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border overflow-hidden transition-colors",
        isConnected ? "bg-event-emerald/5 border-event-emerald/20" :
        isComingSoon ? "opacity-60" : "bg-card hover:bg-muted/30"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-3 text-left"
      >
        <div className={cn(
          "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
          integration.color
        )}>
          <integration.icon className={cn(
            "h-5 w-5",
            integration.id === 'notion' ? "text-white dark:text-gray-900" : "text-white"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{integration.name}</p>
            {isConnected && (
              <span className="text-[10px] bg-event-emerald/20 text-event-emerald px-1.5 py-0.5 rounded-full font-medium">
                Connected
              </span>
            )}
            {isComingSoon && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                Soon
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{integration.description}</p>
        </div>
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-border/50 pt-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">What it does:</p>
              <div className="space-y-1 mb-3">
                {integration.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Zap className="h-3 w-3 text-event-amber shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              {!isComingSoon && !isConnected && (
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onConnect(); }}
                  disabled={isConnecting}
                  className="w-full h-8 text-xs bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:opacity-90 gap-1.5"
                >
                  {isConnecting ? (
                    <>Connecting...</>
                  ) : (
                    <>
                      <Link2 className="h-3 w-3" />
                      Connect {integration.name}
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default IntegrationHub;
