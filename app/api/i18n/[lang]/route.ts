import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TRANSLATIONS API - GET /api/i18n/[lang]
// Returns all translations for a given language code.
// If translations don't exist in DB, returns empty (client uses English fallback).
// POST /api/i18n/[lang] - Bulk upsert translations (admin only).
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;

  if (!lang || lang === 'en') {
    return NextResponse.json({ translations: {}, language: 'en' });
  }

  try {
    const { data, error } = await supabase
      .from('site_translations')
      .select('translation_key, translation_value')
      .eq('language_code', lang);

    if (error) {
      console.error('Translation fetch error:', error);
      return NextResponse.json({ translations: {}, language: lang });
    }

    // Convert array to key-value map
    const translations: Record<string, string> = {};
    data?.forEach((row: { translation_key: string; translation_value: string }) => {
      translations[row.translation_key] = row.translation_value;
    });

    return NextResponse.json(
      { translations, language: lang, count: Object.keys(translations).length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ translations: {}, language: lang });
  }
}

// POST - Bulk upsert translations (admin endpoint)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  
  try {
    const { translations } = await req.json();
    
    if (!translations || typeof translations !== 'object') {
      return NextResponse.json({ error: 'Invalid translations' }, { status: 400 });
    }

    const rows = Object.entries(translations).map(([key, value]) => ({
      language_code: lang,
      translation_key: key,
      translation_value: value as string,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('site_translations')
      .upsert(rows, { onConflict: 'language_code,translation_key' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Translation upsert error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
