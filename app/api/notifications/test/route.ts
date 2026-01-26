import { NextRequest, NextResponse } from 'next/server';

// GET - Test endpoint to check notification system status
// Access: /api/notifications/test
export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  
  // Check environment variables
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Detect browser from user agent
  const isChrome = /Chrome/i.test(userAgent) && !/Edge|Edg/i.test(userAgent);
  const isFirefox = /Firefox/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isEdge = /Edge|Edg/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isInAppBrowser = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(userAgent);
  
  // Safari iOS requires iOS 16.4+ for push
  const iOSVersion = userAgent.match(/OS (\d+)_/);
  const iOSVersionNum = iOSVersion ? parseInt(iOSVersion[1]) : 0;
  const iOSSupportsPush = !isIOS || (isIOS && iOSVersionNum >= 16);
  
  const diagnostics = {
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    protocol: request.nextUrl.protocol,
    host: request.nextUrl.host,
    
    // Environment variable status (not values!)
    config: {
      vapidPublicKeySet: !!vapidPublic,
      vapidPrivateKeySet: !!vapidPrivate,
      supabaseUrlSet: !!supabaseUrl,
      supabaseKeySet: !!supabaseKey,
      allConfigured: !!(vapidPublic && vapidPrivate && supabaseUrl && supabaseKey),
    },
    
    // Browser detection
    browser: {
      userAgent: userAgent.substring(0, 100) + (userAgent.length > 100 ? '...' : ''),
      isChrome,
      isFirefox,
      isSafari,
      isEdge,
      isIOS,
      isAndroid,
      isInAppBrowser,
      iOSVersion: iOSVersionNum || null,
    },
    
    // Push support assessment
    pushSupport: {
      browserSupported: isChrome || isFirefox || isEdge || (isSafari && iOSSupportsPush),
      iOSSupportsPush,
      inAppBrowserWarning: isInAppBrowser ? 'In-app browsers may not support push notifications. Open in Safari/Chrome.' : null,
      recommendation: isInAppBrowser 
        ? 'Open in Safari or Chrome for push notifications'
        : isIOS && iOSVersionNum < 16
        ? 'Update to iOS 16.4+ for push notification support'
        : isSafari && !isIOS
        ? 'Safari on macOS supports push notifications'
        : 'Push notifications should be supported',
    },
    
    // Instructions
    instructions: {
      step1: 'Ensure you are accessing via HTTPS',
      step2: 'Click the notification toggle in the app',
      step3: 'When browser prompts, click "Allow"',
      step4: 'If blocked, click lock icon in address bar and enable notifications',
      debug: 'Run window.debugNotifications() in browser console for more info',
    },
  };
  
  return NextResponse.json(diagnostics, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
