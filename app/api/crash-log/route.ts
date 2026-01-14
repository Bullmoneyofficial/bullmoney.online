import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, session } = body;
    
    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events data' }, { status: 400 });
    }
    
    // Insert crash log events
    if (events.length > 0) {
      const { error: eventsError } = await supabase
        .from('crash_logs')
        .insert(events.map((e: any) => ({
          id: e.id,
          created_at: new Date(e.timestamp).toISOString(),
          event_type: e.type,
          component: e.component,
          action: e.action || null,
          target: e.target || null,
          metadata: e.metadata || {},
          session_id: e.sessionId,
          user_agent: e.userAgent,
          url: e.url,
          device_tier: e.deviceTier || null,
          fps: e.fps || null,
          error_message: e.errorMessage || null,
          error_stack: e.errorStack || null,
        })));
      
      if (eventsError) {
        console.error('[CrashLog API] Failed to insert events:', eventsError);
        // Don't return error - we want to still try session update
      }
    }
    
    // Update session if provided
    if (session) {
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .upsert({
          id: session.id,
          started_at: new Date(session.startedAt).toISOString(),
          device_info: session.deviceInfo,
          page_views: session.pageViews,
          event_count: session.eventCount,
          error_count: session.errorCount,
          last_activity: new Date(session.lastActivity).toISOString(),
        }, { onConflict: 'id' });
      
      if (sessionError) {
        console.error('[CrashLog API] Failed to update session:', sessionError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      eventsProcessed: events.length 
    });
    
  } catch (error) {
    console.error('[CrashLog API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle sendBeacon which uses POST with text/plain
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
