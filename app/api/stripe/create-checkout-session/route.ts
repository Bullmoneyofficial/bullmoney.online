import { NextRequest, NextResponse } from 'next/server';
import { getStripe, formatAmountForStripe } from '@/lib/stripe';

// Helper to check if we're in a development environment
function isDevEnvironment(origin: string | null): boolean {
  if (!origin) return true; // No origin = likely dev
  return (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('192.168.') || // Local network IPs
    origin.includes('10.0.') ||
    origin.startsWith('http://') // Non-HTTPS = dev
  );
}

// Helper to ensure image URL is absolute and valid for Stripe
// Note: Stripe requires publicly accessible HTTPS URLs
function getAbsoluteImageUrl(image: string | undefined | null, origin: string | null): string[] {
  // In development, skip images entirely - Stripe can't access them
  if (isDevEnvironment(origin)) {
    return [];
  }
  
  // Return empty if no image or empty string
  if (!image || typeof image !== 'string' || image.trim() === '') {
    return [];
  }

  const trimmedImage = image.trim();
  
  // Skip invalid image values
  if (trimmedImage === 'null' || trimmedImage === 'undefined') {
    return [];
  }

  try {
    // If already absolute URL with https, validate and use it
    if (trimmedImage.startsWith('https://')) {
      new URL(trimmedImage);
      return [trimmedImage];
    }
    
    // Skip http:// URLs (Stripe requires https)
    if (trimmedImage.startsWith('http://')) {
      return [];
    }
    
    // Build absolute URL from relative path using production URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    // Must have a production base URL
    if (!baseUrl || !baseUrl.startsWith('https://')) {
      return [];
    }
    
    // Clean the image path - remove 'public/' prefix if present
    let cleanImage = trimmedImage.replace(/^public\//, '');
    cleanImage = cleanImage.startsWith('/') ? cleanImage : `/${cleanImage}`;
    
    const absoluteUrl = `${baseUrl}${cleanImage}`;
    new URL(absoluteUrl);
    return [absoluteUrl];
  } catch {
    // If URL is invalid, skip the image rather than fail
    console.warn('Invalid image URL skipped:', image);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { items, customerEmail, metadata } = await req.json();
    const origin = req.headers.get('origin');

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || undefined,
          images: getAbsoluteImageUrl(item.image, origin),
          metadata: {
            productId: item.productId || '',
            variantId: item.variantId || '',
          },
        },
        unit_amount: formatAmountForStripe(item.price),
      },
      quantity: item.quantity,
    }));

    // Determine base URL for redirects - must be https for Stripe
    const getBaseUrl = () => {
      // Use origin if it's https
      if (origin?.startsWith('https://')) {
        return origin;
      }
      // Use configured base URL
      if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
      }
      // For localhost dev, use a placeholder that will work
      // The user will be redirected back correctly via the browser
      if (origin?.includes('localhost')) {
        return origin; // localhost is allowed for test mode
      }
      return 'https://www.bullmoney.shop';
    };
    
    const baseUrl = getBaseUrl();

    // Create Checkout Session
    // Note: Apple Pay & Google Pay are automatically enabled through 'card' when supported
    const session = await getStripe().checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card', 'link'],
        line_items: lineItems,
        customer_email: customerEmail,
        metadata: metadata || {},
        success_url: `${baseUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/store/checkout`,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'ZA'],
        },
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
        allow_promotion_codes: true,
        automatic_tax: {
          enabled: false,
        },
      } as any
    );

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
