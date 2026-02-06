import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Auto-detect carrier from tracking number
function detectCarrier(trackingNumber: string): { carrier: string; trackUrl: string } | null {
  const t = trackingNumber.trim();
  
  // FedEx: 12-22 digits
  if (/^\d{12,22}$/.test(t)) {
    return { carrier: 'fedex', trackUrl: `https://www.fedex.com/fedextrack/?trknbr=${t}` };
  }
  
  // UPS: starts with 1Z
  if (/^1Z[A-Z0-9]{16,}$/i.test(t)) {
    return { carrier: 'ups', trackUrl: `https://www.ups.com/track?tracknum=${t}` };
  }
  
  // The Courier Guy: starts with TCG or typical SA format
  if (/^TCG/i.test(t) || /^CG\d/i.test(t)) {
    return { carrier: 'courier_guy', trackUrl: `https://www.thecourierguy.co.za/track?waybill=${t}` };
  }
  
  // SA Post Office: International format RR/RA/CP + 9 digits + ZA
  if (/^[A-Z]{2}\d{9}ZA$/i.test(t)) {
    return { carrier: 'sapo', trackUrl: `https://www.postoffice.co.za/Track/track.aspx?id=${t}` };
  }
  
  // DHL: 10+ digits or starts with JD/JJD
  if (/^(JD|JJD)\d{10,}$/i.test(t) || /^\d{10}$/.test(t)) {
    return { carrier: 'dhl', trackUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${t}` };
  }
  
  // Aramex: 10+ digits starting with common prefixes
  if (/^\d{10,}$/.test(t) && t.length <= 15) {
    return { carrier: 'aramex', trackUrl: `https://www.aramex.com/track/results?ShipmentNumber=${t}` };
  }
  
  return null;
}

// PUT - Save/update tracking number for an order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_number, email, tracking_number, carrier: userCarrier } = body;

    if (!order_number || !email) {
      return NextResponse.json({ error: 'order_number and email required' }, { status: 400 });
    }

    if (!tracking_number) {
      return NextResponse.json({ error: 'tracking_number required' }, { status: 400 });
    }

    // Auto-detect carrier if not provided
    const detected = detectCarrier(tracking_number);
    const carrier = userCarrier || detected?.carrier || null;
    const trackUrl = detected?.trackUrl || null;

    const { data, error } = await supabase
      .from('store_orders')
      .update({
        tracking_number: tracking_number.trim(),
        carrier,
        tracking_url: trackUrl,
        updated_at: new Date().toISOString(),
        // Auto-update status to shipped if currently processing/pending
        ...(carrier ? { status: 'shipped', shipped_at: new Date().toISOString() } : {}),
      })
      .eq('order_number', order_number)
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error updating tracking:', error);
      return NextResponse.json({ error: 'Failed to update tracking' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tracking_number: data.tracking_number,
      carrier: data.carrier,
      tracking_url: data.tracking_url,
      status: data.status,
    });
  } catch (err) {
    console.error('Tracking API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get tracking info for an order
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('order_number');
  const email = searchParams.get('email');

  if (!orderNumber || !email) {
    return NextResponse.json({ error: 'order_number and email required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('store_orders')
    .select('tracking_number, carrier, tracking_url, status, shipped_at, delivered_at')
    .eq('order_number', orderNumber)
    .eq('email', email)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
