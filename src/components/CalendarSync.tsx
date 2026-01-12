import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  X, 
  CheckCircle, 
  XCircle, 
  Download, 
  Upload,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendarSync, SyncProvider } from '@/hooks/useCalendarSync';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';

interface CalendarSyncProps {
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  onImportEvents: (events: any[]) => void;
}

// Google Calendar icon
const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Outlook icon
const OutlookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.159.152-.36.228-.605.228h-8.64v-9.32l2.85 2.09c.096.078.2.117.313.117.112 0 .216-.039.313-.117l6.007-4.412V7.387z"/>
    <path fill="#0078D4" d="M24 5.387l-6.007 4.412c-.097.078-.201.117-.313.117-.113 0-.217-.039-.313-.117L14.517 7.7V5.387c0-.23.08-.424.238-.576.159-.152.36-.228.605-.228h8.64z"/>
    <path fill="#28A8EA" d="M14.517 7.7v11.663c0 .23-.08.424-.238.576-.159.152-.36.228-.605.228H5.034c-.245 0-.446-.076-.605-.228-.159-.152-.238-.346-.238-.576V5.387c0-.23.08-.424.238-.576.159-.152.36-.228.605-.228h8.64c.245 0 .446.076.605.228.159.152.238.346.238.576V7.7z"/>
    <path fill="#0364B8" d="M11.034 9.387c-.86 0-1.598.304-2.214.913-.616.608-.924 1.365-.924 2.27s.308 1.661.924 2.27c.616.608 1.354.912 2.214.912.86 0 1.598-.304 2.214-.912.616-.609.924-1.365.924-2.27s-.308-1.662-.924-2.27c-.616-.609-1.354-.913-2.214-.913zm0 5.13c-.54 0-.996-.183-1.368-.549-.372-.366-.558-.82-.558-1.364 0-.544.186-.998.558-1.364.372-.366.828-.549 1.368-.549.54 0 .996.183 1.368.549.372.366.558.82.558 1.364 0 .544-.186.998-.558 1.364-.372.366-.828.549-1.368.549z"/>
  </svg>
);

export function CalendarSync({ events, isOpen, onClose, onImportEvents }: CalendarSyncProps) {
  const { syncState, connectGoogle, connectOutlook, disconnect, syncNow, importEvents } = useCalendarSync();
  
  if (!isOpen) return null;
  
  const handleImport = async (provider: SyncProvider) => {
    const imported = await importEvents(provider);
    if (imported.length > 0) {
      onImportEvents(imported);
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Calendar Sync</h2>
                <p className="text-sm text-muted-foreground">Connect external calendars</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Google Calendar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GoogleCalendarIcon />
                    <div>
                      <h3 className="font-medium">Google Calendar</h3>
                      {syncState.google.connected ? (
                        <p className="text-xs text-emerald-500 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Connected
                          {syncState.google.lastSync && (
                            <span className="text-muted-foreground ml-1">
                              • Last sync: {format(new Date(syncState.google.lastSync), 'MMM d, h:mm a')}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {syncState.google.connected ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleImport('google')}
                          disabled={syncState.google.syncing}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Import
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => syncNow('google', events)}
                          disabled={syncState.google.syncing}
                        >
                          {syncState.google.syncing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Export
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => disconnect('google')}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={connectGoogle}>
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Outlook Calendar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <OutlookIcon />
                    <div>
                      <h3 className="font-medium">Outlook Calendar</h3>
                      {syncState.outlook.connected ? (
                        <p className="text-xs text-emerald-500 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Connected
                          {syncState.outlook.lastSync && (
                            <span className="text-muted-foreground ml-1">
                              • Last sync: {format(new Date(syncState.outlook.lastSync), 'MMM d, h:mm a')}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {syncState.outlook.connected ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleImport('outlook')}
                          disabled={syncState.outlook.syncing}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Import
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => syncNow('outlook', events)}
                          disabled={syncState.outlook.syncing}
                        >
                          {syncState.outlook.syncing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Export
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => disconnect('outlook')}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={connectOutlook}>
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Info */}
            <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded-lg">
              <p>Two-way sync keeps your calendars in sync automatically.</p>
              <p>Changes made here will appear in your connected calendars.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
