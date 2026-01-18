import { NextRequest, NextResponse } from 'next/server';
import { fetchTelegramMessages, validateTelegramConfig } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    // Validate configuration
    const config = validateTelegramConfig();
    if (!config.isValid) {
      return NextResponse.json(
        { error: config.error },
        { status: 500 }
      );
    }

    // Get limit from query parameters (default 20, max 100)
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || '20'),
      100
    );

    // Fetch messages from Telegram
    const messages = await fetchTelegramMessages(limit);

    // Cache response for 5 minutes
    const cacheControl = 'public, s-maxage=300, stale-while-revalidate=600';

    return NextResponse.json(
      {
        success: true,
        messages,
        count: messages.length,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': cacheControl,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in Telegram API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Telegram messages',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
