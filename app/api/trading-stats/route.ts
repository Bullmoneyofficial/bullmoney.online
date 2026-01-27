import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    // Fetch user's trading statistics
    const { data, error } = await supabase
      .from('user_trading_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ stats: data || null });
  } catch (error) {
    console.error('Error fetching trading stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { action, userId } = await request.json();

    if (action === 'recalculate') {
      // Trigger recalculation of all statistics
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'closed');

      if (tradesError) throw tradesError;

      // Calculate aggregate statistics
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => t.outcome === 'win').length;
      const losingTrades = trades.filter(t => t.outcome === 'loss').length;
      const totalNetPnl = trades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
      const totalGrossProfit = trades
        .filter(t => t.outcome === 'win')
        .reduce((sum, t) => sum + (t.gross_pnl || 0), 0);
      const totalGrossLoss = trades
        .filter(t => t.outcome === 'loss')
        .reduce((sum, t) => sum + (t.gross_pnl || 0), 0);

      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const profitFactor = totalGrossLoss !== 0 ? totalGrossProfit / Math.abs(totalGrossLoss) : 0;

      // Update user statistics
      const { error: updateError } = await supabase
        .from('user_trading_stats')
        .upsert({
          user_id: userId,
          total_trades: totalTrades,
          winning_trades: winningTrades,
          losing_trades: losingTrades,
          total_net_pnl: totalNetPnl,
          total_gross_profit: totalGrossProfit,
          total_gross_loss: totalGrossLoss,
          win_rate: winRate,
          profit_factor: profitFactor,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, message: 'Statistics recalculated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in trading stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
