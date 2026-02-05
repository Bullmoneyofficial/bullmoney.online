import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { z } from 'zod';

// ============================================================================
// ADMIN ORDER DETAIL API - VIEW & UPDATE SINGLE ORDER
// ============================================================================

const updateOrderSchema = z.object({
  status: z.enum([
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]).optional(),
  tracking_number: z.string().optional(),
  tracking_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabase();
    const { id } = await params;

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    // Fetch order with items
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(name, slug),
          variant:variants(name, sku)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ data: order });

  } catch (error) {
    console.error('Admin order detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabase();
    const { id } = await params;
    const body = await request.json();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    // Validate input
    const validated = updateOrderSchema.parse(body);

    // Update order
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: order });

  } catch (error) {
    console.error('Admin order update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
