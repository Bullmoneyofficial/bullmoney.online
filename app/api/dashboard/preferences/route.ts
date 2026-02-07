import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// GET - Fetch user dashboard preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user preferences from recruits table
    const { data, error } = await supabase
      .from('recruits')
      .select('dashboard_preferences, email')
      .eq('email', user.email)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ 
      preferences: data?.dashboard_preferences || getDefaultPreferences(),
      email: data?.email
    });
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update user dashboard preferences
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json({ error: 'Preferences required' }, { status: 400 });
    }

    // Update preferences in recruits table
    const { data, error } = await supabase
      .from('recruits')
      .update({ dashboard_preferences: preferences })
      .eq('email', user.email)
      .select('dashboard_preferences')
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      preferences: data?.dashboard_preferences
    });
  } catch (error) {
    console.error('Preferences POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Default preferences structure
function getDefaultPreferences() {
  return {
    quotes: {
      autoRefresh: true,
      notifications: false,
      soundEnabled: false,
      refreshInterval: 30000,
      category: 'all'
    },
    news: {
      autoRefresh: true,
      notifications: true,
      soundEnabled: true,
      refreshInterval: 60000,
      priority: 'all',
      pullInterval: 300000 // 5 minutes
    },
    telegram: {
      autoRefresh: true,
      notifications: true,
      soundEnabled: false,
      refreshInterval: 45000,
      visibility: 'all',
      enabledGroups: ['vip', 'free', 'signals'],
      notifyGroups: ['vip']
    },
    watchlist: []
  };
}
