import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// REWARDS API — Get/Update Punch Card Rewards
// Tracks punches based on store orders ($25 = 1 punch, 20 punches = reward)
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch rewards for a specific email or sync from orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const sync = searchParams.get("sync") === "true";

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // If sync requested, recalculate from store orders
    if (sync) {
      // Get total spent from paid orders
      const { data: orders, error: orderErr } = await supabase
        .from("store_orders")
        .select("total")
        .eq("payment_status", "paid")
        .ilike("email", email);

      if (orderErr) throw orderErr;

      const totalSpent = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const totalPunches = Math.floor(totalSpent / 25);
      const cardsCompleted = Math.floor(totalPunches / 20);
      const currentPunches = totalPunches % 20;
      
      // Determine tier
      const tier = cardsCompleted >= 10 ? "platinum" 
        : cardsCompleted >= 5 ? "gold" 
        : cardsCompleted >= 2 ? "silver" 
        : "bronze";

      // Update recruit record
      const { error: updateErr } = await supabase
        .from("recruits")
        .update({
          rewards_punches: currentPunches,
          rewards_total_spent: totalSpent,
          rewards_cards_completed: cardsCompleted,
          rewards_tier: tier,
          rewards_lifetime_points: totalPunches * 10,
          rewards_available_points: currentPunches * 10,
          rewards_last_punch_at: new Date().toISOString(),
          store_total_spent: totalSpent,
        })
        .ilike("email", email);

      if (updateErr) {
        console.error("Update error:", updateErr);
      }

      // Log sync action
      const { data: recruit } = await supabase
        .from("recruits")
        .select("id")
        .ilike("email", email)
        .single();

      if (recruit) {
        await supabase.from("rewards_history").insert({
          email: email.toLowerCase(),
          recruit_id: recruit.id,
          action: "sync",
          punches_added: 0,
          punches_before: currentPunches,
          punches_after: currentPunches,
          order_total: totalSpent,
          notes: "Auto-sync from store orders",
        });
      }

      return NextResponse.json({
        email,
        punches: currentPunches,
        max_punches: 20,
        total_spent: totalSpent,
        cards_completed: cardsCompleted,
        tier,
        lifetime_points: totalPunches * 10,
        available_points: currentPunches * 10,
        synced: true,
      });
    }

    // Just fetch current rewards data
    const { data: recruit, error } = await supabase
      .from("recruits")
      .select(`
        email,
        rewards_punches,
        rewards_total_spent,
        rewards_cards_completed,
        rewards_tier,
        rewards_lifetime_points,
        rewards_available_points,
        rewards_last_punch_at,
        rewards_free_item_claimed,
        store_total_spent
      `)
      .ilike("email", email)
      .single();

    if (error || !recruit) {
      return NextResponse.json({
        email,
        punches: 0,
        max_punches: 20,
        total_spent: 0,
        cards_completed: 0,
        tier: "bronze",
        lifetime_points: 0,
        available_points: 0,
        exists: false,
      });
    }

    return NextResponse.json({
      email: recruit.email,
      punches: recruit.rewards_punches || 0,
      max_punches: 20,
      total_spent: recruit.rewards_total_spent || recruit.store_total_spent || 0,
      cards_completed: recruit.rewards_cards_completed || 0,
      tier: recruit.rewards_tier || "bronze",
      lifetime_points: recruit.rewards_lifetime_points || 0,
      available_points: recruit.rewards_available_points || 0,
      last_punch_at: recruit.rewards_last_punch_at,
      free_item_claimed: recruit.rewards_free_item_claimed || false,
      exists: true,
    });
  } catch (error: any) {
    console.error("GET /api/rewards error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add punches manually (admin) or process order punch
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, action, punches, order_id, order_total, notes } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Get current recruit data
    const { data: recruit, error: fetchErr } = await supabase
      .from("recruits")
      .select("id, rewards_punches, rewards_cards_completed, rewards_tier")
      .ilike("email", email)
      .single();

    if (fetchErr || !recruit) {
      return NextResponse.json({ error: "Recruit not found" }, { status: 404 });
    }

    const currentPunches = recruit.rewards_punches || 0;
    let newPunches = currentPunches;
    let cardsCompleted = recruit.rewards_cards_completed || 0;

    if (action === "add_punch" || action === "order") {
      const punchesToAdd = punches || 1;
      newPunches = currentPunches + punchesToAdd;
      
      // Clamp to valid range (allow negative to subtract)
      if (newPunches < 0) {
        newPunches = 0;
      }
      
      // Check for card completion
      if (newPunches >= 20) {
        cardsCompleted += Math.floor(newPunches / 20);
        newPunches = newPunches % 20;
      }
    } else if (action === "set") {
      newPunches = Math.min(punches || 0, 20);
    } else if (action === "reset") {
      newPunches = 0;
    } else if (action === "complete_card") {
      cardsCompleted += 1;
      newPunches = 0;
    }

    // Determine tier
    const tier = cardsCompleted >= 10 ? "platinum" 
      : cardsCompleted >= 5 ? "gold" 
      : cardsCompleted >= 2 ? "silver" 
      : "bronze";

    // Update recruit
    const { error: updateErr } = await supabase
      .from("recruits")
      .update({
        rewards_punches: newPunches,
        rewards_cards_completed: cardsCompleted,
        rewards_tier: tier,
        rewards_lifetime_points: (cardsCompleted * 20 + newPunches) * 10,
        rewards_available_points: newPunches * 10,
        rewards_last_punch_at: new Date().toISOString(),
      })
      .eq("id", recruit.id);

    if (updateErr) throw updateErr;

    // Log history
    await supabase.from("rewards_history").insert({
      email: email.toLowerCase(),
      recruit_id: recruit.id,
      action: action || "manual",
      punches_added: newPunches - currentPunches,
      punches_before: currentPunches,
      punches_after: newPunches,
      order_id,
      order_total,
      notes: notes || `Action: ${action}`,
    });

    return NextResponse.json({
      success: true,
      email,
      punches: newPunches,
      previous_punches: currentPunches,
      cards_completed: cardsCompleted,
      tier,
    });
  } catch (error: any) {
    console.error("POST /api/rewards error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Admin update rewards (set punches, tier, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, ...updates } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Validate updates
    const allowedFields = [
      "rewards_punches",
      "rewards_cards_completed",
      "rewards_tier",
      "rewards_lifetime_points",
      "rewards_available_points",
      "rewards_free_item_claimed",
    ];

    const validUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("recruits")
      .update(validUpdates)
      .ilike("email", email)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("PATCH /api/rewards error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
