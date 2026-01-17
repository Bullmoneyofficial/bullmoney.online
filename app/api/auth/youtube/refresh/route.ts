import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_CLIENT_ID = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '';
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'OAuth credentials not configured' },
        { status: 500 }
      );
    }

    // Exchange refresh token for new access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token refresh error:', tokenData);
      
      // If refresh token is invalid/revoked, user needs to re-authenticate
      if (tokenData.error === 'invalid_grant') {
        return NextResponse.json(
          { error: 'Session expired. Please sign in again.', requiresReauth: true },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: tokenData.error_description || tokenData.error || 'Failed to refresh token' },
        { status: 400 }
      );
    }

    const { access_token, expires_in, token_type, scope } = tokenData;

    // Note: Google doesn't always return a new refresh token
    // The original refresh token remains valid
    return NextResponse.json({
      access_token,
      expires_in,
      token_type,
      scope,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
