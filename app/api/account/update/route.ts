import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

interface SessionPayload {
  id: number;
  email: string;
}

interface UpdateRequestBody {
  session?: SessionPayload;
  updates?: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as UpdateRequestBody | null;
    const session = body?.session;
    const updates = body?.updates;

    if (!session?.id || !session?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates supplied' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: recruit, error: recruitError } = await supabase
      .from('recruits')
      .select('id, email')
      .eq('id', session.id)
      .eq('email', session.email)
      .maybeSingle();

    if (recruitError) {
      console.error('[AccountUpdateAPI] Lookup error:', recruitError);
      return NextResponse.json({ error: 'Failed to verify account' }, { status: 400 });
    }

    if (!recruit) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('recruits')
      .update(sanitizedUpdates)
      .eq('id', recruit.id);

    if (updateError) {
      console.error('[AccountUpdateAPI] Update error:', updateError);
      return NextResponse.json({ error: updateError.message || 'Failed to update account' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AccountUpdateAPI] Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
