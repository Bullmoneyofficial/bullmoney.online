import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CHECKOUT API - CREATE PAYMENT INTENT
// ============================================================================

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return _stripe;
}

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

interface StoreVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  size: string | null;
  color: string | null;
  price_modifier: number;
  stock_quantity: number;
  product: {
    id: string;
    name: string;
    base_price: number;
    status: string;
  } | {
    id: string;
    name: string;
    base_price: number;
    status: string;
  }[] | null;
}

interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

interface CartItem {
  product_id: string;
  variant_id: string;
  quantity: number;
}

interface AddressInput {
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  email: string;
  shipping_address: AddressInput;
  billing_address?: AddressInput;
  discount_code?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, email, shipping_address, billing_address, discount_code } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    if (!email || !shipping_address) {
      return NextResponse.json(
        { error: 'Email and shipping address are required' },
        { status: 400 }
      );
    }

    // Use service role client for checkout (no user auth required for guest checkout)
    const user_id = null; // Guest checkout - can be enhanced later with auth

    // Fetch product and variant data
    const variantIds = items.map(item => item.variant_id);
    const { data: variantsData, error: variantError } = await getSupabaseAdmin()
      .from('store_variants')
      .select(`
        id,
        product_id,
        sku,
        name,
        size,
        color,
        price_modifier,
        stock_quantity,
        product:store_products (
          id,
          name,
          base_price,
          status
        )
      `)
      .in('id', variantIds);

    const variants = variantsData as StoreVariant[] | null;

    if (variantError || !variants) {
      return NextResponse.json(
        { error: 'Failed to fetch product data' },
        { status: 500 }
      );
    }

    // Validate stock and calculate totals
    const orderItems: Array<{
      product_id: string;
      variant_id: string;
      product_snapshot: object;
      quantity: number;
      unit_price: number;
      total_price: number;
    }> = [];

    let subtotal = 0;

    for (const item of items) {
      const variant = variants.find(v => v.id === item.variant_id);
      
      if (!variant || !variant.product) {
        return NextResponse.json(
          { error: `Product not found for variant ${item.variant_id}` },
          { status: 400 }
        );
      }

      // Handle both array and object returns from Supabase
      const productData = Array.isArray(variant.product) ? variant.product[0] : variant.product;
      const product = productData as { id: string; name: string; base_price: number; status: string };

      if (!product || product.status !== 'active') {
        return NextResponse.json(
          { error: `Product "${product.name}" is not available` },
          { status: 400 }
        );
      }

      if (variant.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}"` },
          { status: 400 }
        );
      }

      const unitPrice = product.base_price + variant.price_modifier;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_id: product.id,
        variant_id: variant.id,
        product_snapshot: {
          id: product.id,
          name: product.name,
          sku: variant.sku,
          price: unitPrice,
          options: { size: variant.size, color: variant.color },
        },
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    // Apply discount if provided
    let discountAmount = 0;
    if (discount_code) {
      const { data: discountData } = await getSupabaseAdmin()
        .from('store_discount_codes')
        .select('*')
        .eq('code', discount_code.toUpperCase())
        .eq('is_active', true)
        .single();

      const discount = discountData as DiscountCode | null;

      if (discount) {
        const now = new Date();
        const startsAt = discount.starts_at ? new Date(discount.starts_at) : null;
        const expiresAt = discount.expires_at ? new Date(discount.expires_at) : null;

        if (
          (!startsAt || now >= startsAt) &&
          (!expiresAt || now < expiresAt) &&
          subtotal >= discount.min_order_amount &&
          (!discount.max_uses || discount.current_uses < discount.max_uses)
        ) {
          if (discount.discount_type === 'PERCENTAGE') {
            discountAmount = subtotal * (discount.discount_value / 100);
          } else {
            discountAmount = Math.min(discount.discount_value, subtotal);
          }

          // Increment usage
          await (getSupabaseAdmin() as any)
            .from('discount_codes')
            .update({ current_uses: discount.current_uses + 1 })
            .eq('id', discount.id);
        }
      }
    }

    // Calculate shipping and tax
    const shippingCost = subtotal >= 150 ? 0 : 9.99;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * 0.0875; // 8.75% tax
    const total = taxableAmount + taxAmount + shippingCost;

    // Create order in database
    const { data: order, error: orderError } = await (getSupabaseAdmin() as any)
      .from('store_orders')
      .insert({
        user_id: user_id,
        guest_email: email,
        status: 'PENDING',
        shipping_address: {
          ...shipping_address,
          label: 'Shipping',
          id: crypto.randomUUID(),
        },
        billing_address: billing_address ? {
          ...billing_address,
          label: 'Billing',
          id: crypto.randomUUID(),
        } : null,
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: Math.round(taxAmount * 100) / 100,
        discount_amount: Math.round(discountAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const { error: itemsError } = await (getSupabaseAdmin() as any)
      .from('store_order_items')
      .insert(
        orderItems.map(item => ({
          ...item,
          order_id: order.id,
        }))
      );

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Rollback order
      await (getSupabaseAdmin() as any).from('store_orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // Create Stripe Payment Intent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(total * 100), // Stripe uses cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
      receipt_email: email,
      shipping: {
        name: `${shipping_address.first_name} ${shipping_address.last_name}`,
        address: {
          line1: shipping_address.line1,
          line2: shipping_address.line2 || '',
          city: shipping_address.city,
          state: shipping_address.state,
          postal_code: shipping_address.postal_code,
          country: shipping_address.country,
        },
        phone: shipping_address.phone || '',
      },
    });

    // Update order with payment intent ID
    await (getSupabaseAdmin() as any)
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id);

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      order_id: order.id,
      order_number: order.order_number,
      summary: {
        subtotal,
        shipping: shippingCost,
        tax: Math.round(taxAmount * 100) / 100,
        discount: Math.round(discountAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
