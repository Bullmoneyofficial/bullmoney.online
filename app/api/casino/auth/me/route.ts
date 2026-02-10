import { NextRequest } from 'next/server';
import { authenticateCasinoUser, jsonOk, jsonError } from '@/lib/casino-db';

// GET /api/casino/auth/me — get current casino user
export async function GET(request: NextRequest) {
  const user = await authenticateCasinoUser(request);
  if (!user) return jsonError('Not authenticated', 401);

  return jsonOk({
    user: {
      id: user.id,
      username: user.username,
      balance: user.balance,
      avatar: user.avatar,
      rank: user.rank,
      unique_id: user.unique_id,
      admin: user.admin,
      ref_code: user.ref_code,
      demo_balance: user.demo_balance,
    },
  });
}
