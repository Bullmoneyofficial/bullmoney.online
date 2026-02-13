import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let pageId = 'unknown';
  let path = '/';

  try {
    const body = await request.json();
    if (typeof body?.pageId === 'string' && body.pageId) pageId = body.pageId;
    if (typeof body?.path === 'string' && body.path) path = body.path;
  } catch {
    // keep fast path when beacon body is unavailable
  }

  return NextResponse.json(
    {
      ok: true,
      boosted: true,
      pageId,
      path,
      ts: Date.now(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export async function GET() {
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
