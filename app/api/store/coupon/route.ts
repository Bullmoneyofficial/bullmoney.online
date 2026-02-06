import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// COUPON / PROMO CODE VALIDATION API
// Validates discount codes and returns discount details
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Built-in coupon codes (can also be stored in Supabase)
const BUILTIN_COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; minOrder?: number; maxUses?: number; expiresAt?: string }> = {
  'WELCOME10': { type: 'percent', value: 10, minOrder: 50 },
  'BULL20': { type: 'percent', value: 20, minOrder: 100 },
  'SAVE15': { type: 'fixed', value: 15, minOrder: 75 },
  'FREESHIP': { type: 'fixed', value: 0 }, // handled as free shipping flag
  'VIP25': { type: 'percent', value: 25, minOrder: 150 },
  'LAUNCH30': { type: 'percent', value: 30, minOrder: 200 },
};

export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal } = await req.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Please enter a coupon code' },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check built-in coupons first
    const builtin = BUILTIN_COUPONS[normalizedCode];
    if (builtin) {
      // Check minimum order
      if (builtin.minOrder && cartTotal < builtin.minOrder) {
        return NextResponse.json({
          valid: false,
          error: `Minimum order of $${builtin.minOrder.toFixed(2)} required for this code`,
        });
      }

      // Check expiration
      if (builtin.expiresAt && new Date(builtin.expiresAt) < new Date()) {
        return NextResponse.json({
          valid: false,
          error: 'This coupon has expired',
        });
      }

      const discount = builtin.type === 'percent'
        ? (cartTotal * builtin.value) / 100
        : builtin.value;

      return NextResponse.json({
        valid: true,
        code: normalizedCode,
        type: builtin.type,
        value: builtin.value,
        discount: Math.min(discount, cartTotal),
        message: builtin.type === 'percent' 
          ? `${builtin.value}% off applied!` 
          : `$${builtin.value.toFixed(2)} off applied!`,
      });
    }

    // Check database for custom coupons (discount_codes table)
    try {
      const { data: dbCoupon, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', normalizedCode)
        .eq('is_active', true)
        .single();

      if (dbCoupon && !error) {
        // Check expiration
        if (dbCoupon.expires_at && new Date(dbCoupon.expires_at) < new Date()) {
          return NextResponse.json({
            valid: false,
            error: 'This coupon has expired',
          });
        }

        // Check max uses
        if (dbCoupon.max_uses && dbCoupon.use_count >= dbCoupon.max_uses) {
          return NextResponse.json({
            valid: false,
            error: 'This coupon has reached its usage limit',
          });
        }

        // Check minimum order
        if (dbCoupon.min_order_amount && cartTotal < dbCoupon.min_order_amount) {
          return NextResponse.json({
            valid: false,
            error: `Minimum order of $${dbCoupon.min_order_amount.toFixed(2)} required`,
          });
        }

        const discount = dbCoupon.discount_type === 'percent'
          ? (cartTotal * dbCoupon.discount_value) / 100
          : dbCoupon.discount_value;

        // Increment usage count
        await supabase
          .from('discount_codes')
          .update({ use_count: (dbCoupon.use_count || 0) + 1 })
          .eq('id', dbCoupon.id);

        return NextResponse.json({
          valid: true,
          code: normalizedCode,
          type: dbCoupon.discount_type,
          value: dbCoupon.discount_value,
          discount: Math.min(discount, cartTotal),
          message: dbCoupon.discount_type === 'percent'
            ? `${dbCoupon.discount_value}% off applied!`
            : `$${dbCoupon.discount_value.toFixed(2)} off applied!`,
        });
      }
    } catch {
      // Table might not exist yet — fall through to invalid
    }

    return NextResponse.json({
      valid: false,
      error: 'Invalid coupon code',
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
