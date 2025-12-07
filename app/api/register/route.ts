// app/api/register/route.ts
import { NextResponse } from 'next/server';
// Corrected
import { supabase } from '@/lib/supabaseClient'; // Import the client instance directly

export async function POST(request: Request) {
  // const supabase = getSupabase(); // REMOVE this line
  // The 'supabase' client is now available directly from the import.

  try {
// ...
    // 1. Parse the incoming JSON data from the frontend
    const body = await request.json();
    const { name, email, mt5Number } = body;

    // 2. Basic Validation (Server Side)
    if (!email || !mt5Number || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, or mt5Number' },
        { status: 400 }
      );
    }

    // 3. Insert into Supabase
    // Note: Ensure your table columns match these keys (email, mt5_id, recruiter_name, used_code)
    const { error } = await supabase.from('recruits').insert([
      {
        email: email,
        mt5_id: mt5Number,
        recruiter_name: name, // assuming 'name' maps to 'recruiter_name'
        used_code: true,      // Defaults to true based on your flow
      },
    ]);

    if (error) {
      console.error('Supabase Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Return success
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}