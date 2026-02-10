import { jsonOk } from '@/lib/casino-db';

// GET /api/casino/auth/logout
export async function GET() {
  const headers = new Headers();
  headers.set('Set-Cookie', 'casino_token=; Path=/; HttpOnly; Max-Age=0');
  return new Response(JSON.stringify({ success: true }), { status: 200, headers, });
}
