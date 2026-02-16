import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase';

const adminEmailEnv = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

const updateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  base_price: z.number().min(0),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  buy_url: z.string().url().optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

const normalizeEmail = (value?: string | null) =>
  String(value || '').trim().replace(/^['"]|['"]$/g, '').trim().toLowerCase();

const ensureAdmin = (request: NextRequest) => {
  if (!adminEmailEnv) return false;
  const headerEmail = normalizeEmail(request.headers.get('x-admin-email'));
  return Boolean(headerEmail && headerEmail === adminEmailEnv);
};

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!ensureAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const supabase = createServerSupabase();

    const { error } = await supabase
      .from('products')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        base_price: body.base_price,
        category_id: body.category_id || null,
        status: body.status || 'DRAFT',
        buy_url: body.buy_url || null,
        details: body.details || {},
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (body.image_url) {
      const { data: existing } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', id)
        .eq('is_primary', true)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('product_images')
          .update({ url: body.image_url, sort_order: 0, is_primary: true })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('product_images')
          .insert({ product_id: id, url: body.image_url, sort_order: 0, is_primary: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!ensureAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServerSupabase();

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}