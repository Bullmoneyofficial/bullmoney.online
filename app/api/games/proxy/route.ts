/**
 * API Proxy for Casino Games
 * Proxies game requests to the Laravel backend
 * Handles CORS and CSRF token management
 * 
 * Usage: POST /api/games/proxy?endpoint=/dice/bet&backend=render
 * Usage: POST /api/games/proxy?endpoint=/mines/create&backend=local
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0; // No caching for game requests

async function proxyRequest(
  backendUrl: string,
  endpoint: string,
  method: string,
  body?: any,
  headers?: Record<string, string>
) {
  try {
    const url = `${backendUrl}${endpoint}`;
    
    // Build request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      // Important: Include credentials for cross-origin requests
      credentials: 'include',
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    console.log(`[GameProxy] ${method} ${url}`, { body });

    const response = await fetch(url, options);
    
    // Get response data
    const contentType = response.headers.get('content-type');
    let responseData: any;
    
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`[GameProxy] Response: ${response.status}`, responseData);

    // Return response with appropriate status
    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        data: responseData,
        backend: backendUrl,
      },
      { status: response.status }
    );
  } catch (error) {
    console.error('[GameProxy] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        backend: backendUrl,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');
    const backendParam = searchParams.get('backend');

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    // Determine which backend to use
    let backendUrl = process.env.CASINO_BACKEND_URL || 'http://localhost:8000';
    
    if (backendParam === 'local') {
      backendUrl = 'http://localhost:8000';
    } else if (backendParam === 'render') {
      backendUrl = 'https://bullmoney-casino.onrender.com';
    } else if (backendParam === 'primary') {
      backendUrl = process.env.CASINO_BACKEND_URL || 'https://bullmoney-casino.onrender.com';
    }

    // Parse request body
    let body: any;
    try {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await request.json();
      } else {
        body = await request.text();
      }
    } catch (e) {
      // No body or invalid JSON, that's ok
    }

    // Get headers from client (for CSRF token, etc)
    const clientHeaders: Record<string, string> = {};
    const csrfToken = request.headers.get('x-csrf-token');
    if (csrfToken) {
      clientHeaders['X-CSRF-TOKEN'] = csrfToken;
    }

    // Forward request to backend
    return await proxyRequest(
      backendUrl,
      endpoint,
      'POST',
      body,
      clientHeaders
    );
  } catch (error) {
    console.error('[GameProxy] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.CASINO_BACKEND_URL || 'http://localhost:8000';

    return await proxyRequest(backendUrl, endpoint, 'GET');
  } catch (error) {
    console.error('[GameProxy] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
