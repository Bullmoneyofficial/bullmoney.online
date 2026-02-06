import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch all email templates or single by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') !== 'false';

    // Handle single template fetch separately
    if (slug) {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        throw error;
      }
      return NextResponse.json(data);
    }

    // Handle list query
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('display_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Email templates GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST - Create new email template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        slug: body.slug,
        name: body.name,
        subject: body.subject,
        hero_title: body.hero_title || '',
        hero_subtitle: body.hero_subtitle || '',
        hero_icon: body.hero_icon || 'check',
        content_blocks: body.content_blocks || [],
        primary_cta_text: body.primary_cta_text || '',
        primary_cta_url: body.primary_cta_url || '',
        secondary_cta_text: body.secondary_cta_text || '',
        secondary_cta_url: body.secondary_cta_url || '',
        footer_text: body.footer_text || '',
        promo_code: body.promo_code || '',
        promo_description: body.promo_description || '',
        category: body.category || 'general',
        is_active: body.is_active !== false,
        display_order: body.display_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Email templates POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create email template' },
      { status: 500 }
    );
  }
}

// PUT - Update email template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, slug } = body;

    if (!id && !slug) {
      return NextResponse.json({ error: 'id or slug required' }, { status: 400 });
    }

    const updateData: any = {};
    const fields = [
      'name', 'subject', 'hero_title', 'hero_subtitle', 'hero_icon',
      'content_blocks', 'primary_cta_text', 'primary_cta_url',
      'secondary_cta_text', 'secondary_cta_url', 'footer_text',
      'promo_code', 'promo_description', 'category', 'is_active', 'display_order'
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Allow slug update only if id is provided
    if (id && body.slug) {
      updateData.slug = body.slug;
    }

    let query = supabase.from('email_templates').update(updateData);
    
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Email templates PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update email template' },
      { status: 500 }
    );
  }
}

// DELETE - Remove email template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (!id && !slug) {
      return NextResponse.json({ error: 'id or slug required' }, { status: 400 });
    }

    let query = supabase.from('email_templates').delete();
    
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', slug);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email templates DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete email template' },
      { status: 500 }
    );
  }
}
