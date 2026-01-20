import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown';
  return NextResponse.json({ version });
}
