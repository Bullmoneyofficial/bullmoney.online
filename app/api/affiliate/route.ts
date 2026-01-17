// app/api/affiliate/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { trackServerEvent } from '@/lib/analytics';

// 1. Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "YOUR_MONGODB_CONNECTION_STRING";

if (!mongoose.connections[0]?.readyState) {
  mongoose.connect(MONGODB_URI);
}

// 2. Define Schema (Matches your Screenshot)
const affiliateSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  affiliateLinkID: String,
  totalCommissions: Number,
  totalReferrals: Number,
  referralTarget: Number,
  // Add other fields from your screenshot if needed
}, { collection: 'AffiliatesData' }); // IMPORTANT: Matches your collection name

// Prevent model recompilation error in Next.js
const Affiliate = (mongoose.models.AffiliatesData as any) || mongoose.model('AffiliatesData', affiliateSchema);

// --- GET: Fetch Data for a User ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  try {
    let user = await Affiliate.findOne({ userEmail: email });
    
    // If no affiliate data exists for this user, return default/zero data
    if (!user) {
      return NextResponse.json({ 
        affiliateId: email.split('@')[0], 
        commissions: 0, 
        referrals: 0 
      });
    }

    return NextResponse.json({
      affiliateId: user.affiliateLinkID,
      commissions: user.totalCommissions,
      referrals: user.totalReferrals
    });
  } catch (error) {
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}

// --- POST: Admin Update ---
export async function POST(request: Request) {
  const body = await request.json();
  const { adminSecret, targetEmail, newCommissions, newReferrals } = body;

  // Simple Admin Protection
  if (adminSecret !== "MY_SUPER_SECRET_ADMIN_PASSWORD") { // CHANGE THIS PASSWORD
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Upsert: Update if exists, Create if not
    const updatedUser = await Affiliate.findOneAndUpdate(
      { userEmail: targetEmail },
      { 
        $set: { 
          totalCommissions: parseFloat(newCommissions),
          totalReferrals: parseInt(newReferrals),
          userEmail: targetEmail,
          // Generate a handle if it doesn't exist
          affiliateLinkID: `bmt_${targetEmail.split('@')[0]}` 
        }
      },
      { new: true, upsert: true } // Create if doesn't exist
    );

    // Track affiliate commission update (server-side)
    await trackServerEvent('affiliate_commission_update', {
      email: targetEmail,
      commissions: parseFloat(newCommissions),
      referrals: parseInt(newReferrals),
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
  }
}