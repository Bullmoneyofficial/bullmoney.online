import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side admin login endpoint.
 * Validates credentials against ADMIN_EMAIL + ADMIN_PASSWORD env vars
 * (no NEXT_PUBLIC_ prefix — never exposed to the browser).
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all fields.' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('[admin/login] ADMIN_EMAIL or ADMIN_PASSWORD env vars are not set');
      return NextResponse.json(
        { success: false, message: 'Admin credentials are not configured.' },
        { status: 500 }
      );
    }

    const normalizedInput = email.trim().toLowerCase();
    const normalizedAdmin = adminEmail.trim().toLowerCase();

    if (normalizedInput === normalizedAdmin && password === adminPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Bad request.' },
      { status: 400 }
    );
  }
}
