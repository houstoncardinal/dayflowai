import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  provider: 'google' | 'outlook';
  action: 'sync' | 'import';
  events?: any[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, action, events }: SyncRequest = await req.json();

    console.log(`Calendar sync request: ${action} for ${provider}`, { eventCount: events?.length });

    // In production, this would:
    // 1. Use OAuth tokens to authenticate with Google/Microsoft APIs
    // 2. Fetch events from external calendar (import)
    // 3. Push events to external calendar (sync/export)
    
    // For now, we return a simulated response
    if (action === 'import') {
      // Simulated import - in production, fetch from Google/Microsoft Calendar API
      const simulatedEvents = [
        {
          title: `${provider === 'google' ? 'Google' : 'Outlook'} Meeting`,
          description: `Imported from ${provider === 'google' ? 'Google' : 'Outlook'} Calendar`,
          event_date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '11:00',
          color: 'teal',
          all_day: false,
        },
      ];

      return new Response(
        JSON.stringify({ 
          success: true, 
          events: simulatedEvents,
          message: `Imported ${simulatedEvents.length} events from ${provider}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'sync') {
      // Simulated sync - in production, push to Google/Microsoft Calendar API
      console.log(`Syncing ${events?.length || 0} events to ${provider}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          syncedCount: events?.length || 0,
          message: `Synced ${events?.length || 0} events to ${provider}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error: unknown) {
    console.error('Calendar sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync calendar';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
