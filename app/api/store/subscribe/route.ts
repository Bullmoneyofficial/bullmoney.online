import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// STORE SUBSCRIBE API - REDIRECT TO GMAIL ADMIN HUB
// This route now redirects to the new Gmail admin hub newsletter system
// Maintains backward compatibility while upgrading to SQL-based system
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Redirect to new Gmail admin hub newsletter system
    const body = await request.json();
    const { email, source = 'store_footer' } = body;

    // Forward to the new Gmail newsletter API
    const hubApiUrl = new URL('/api/store/newsletter/subscribe', request.url);
    
    const gmailHubResponse = await fetch(hubApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Newsletter-Source': source,
        'X-Forwarded-From': 'legacy-subscribe-route',
        'Referer': request.headers.get('referer') || '',
        'User-Agent': request.headers.get('user-agent') || '',
      },
      body: JSON.stringify({
        email,
        source: `${source}_legacy_redirect`,
        useGmailHub: true,
        preferences: {
          marketing: true,
          updates: true,
          legacy_migrated: true
        }
      })
    });

    const data = await gmailHubResponse.json();
    
    // Return the response from Gmail hub system
    return NextResponse.json(data, { 
      status: gmailHubResponse.ok ? 200 : 400 
    });

  } catch (error: any) {
    console.error('[Subscribe] Legacy redirect error:', error);
    return NextResponse.json(
      { 
        error: 'Newsletter system temporarily unavailable. Please try again.',
        success: false,
        isGmailHubError: true
      },
      { status: 503 }
    );
  }
}
