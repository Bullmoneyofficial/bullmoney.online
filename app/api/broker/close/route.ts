import { NextRequest, NextResponse } from 'next/server';
import MetaApi from 'metaapi.cloud-sdk';

/**
 * MT4/MT5 Position Closing API - Production Ready
 * Powered by MetaAPI (https://metaapi.cloud/)
 */

const token = process.env.METAAPI_TOKEN;
const region = process.env.METAAPI_REGION || 'new-york';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, positionId } = body;

    console.log('[Close API] Position close attempt:', { accountId, positionId });

    // Validate input
    if (!accountId || !positionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: accountId, positionId'
      }, { status: 400 });
    }

    // Check if MetaAPI is configured
    if (!token) {
      console.warn('[Close API] MetaAPI not configured, using demo mode');
      return getDemoCloseResponse(positionId);
    }

    // Initialize MetaAPI
    const api = new MetaApi(token, { region });
    
    // Get account
    const account = await api.metatraderAccountApi.getAccount(accountId);
    if (!account) {
      return NextResponse.json({
        success: false,
        error: `Account ${accountId} not found`
      }, { status: 404 });
    }

    // Ensure account is connected
    if (account.state !== 'DEPLOYED') {
      await account.deploy();
    }
    await account.waitConnected();

    // Get connection
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();

    // Get position details before closing
    const positions = await connection.getPositions();
    const position = positions.find((p: any) => p.id === positionId);
    
    if (!position) {
      return NextResponse.json({
        success: false,
        error: `Position ${positionId} not found`
      }, { status: 404 });
    }

    const closingProfit = position.profit || 0;

    // Close position
    console.log('[Close API] Closing position:', positionId);
    await connection.closePosition(positionId);
    
    console.log('[Close API] Position closed successfully');

    // Get updated positions
    const updatedPositions = await connection.getPositions();
    const formattedPositions = updatedPositions.map((pos: any) => ({
      id: pos.id,
      symbol: pos.symbol,
      type: pos.type === 'POSITION_TYPE_BUY' ? 'buy' : 'sell',
      volume: pos.volume,
      entryPrice: pos.openPrice,
      currentPrice: pos.currentPrice,
      profit: pos.profit,
      swap: pos.swap,
      commission: pos.commission,
      openTime: pos.time,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
    }));

    return NextResponse.json({
      success: true,
      message: 'Position closed successfully',
      positionId: positionId,
      closingProfit: closingProfit,
      positions: formattedPositions,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Close API] Error:', error);
    
    let errorMessage = error.message || 'Failed to close position';
    
    if (error.message?.includes('TRADE_DISABLED')) {
      errorMessage = 'Trading is disabled for this account';
    } else if (error.message?.includes('POSITION_NOT_FOUND')) {
      errorMessage = 'Position not found or already closed';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.METAAPI_DEBUG === 'true' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Demo mode fallback
function getDemoCloseResponse(positionId: string) {
  const updatedPositions = [
    {
      id: '12346',
      symbol: 'EURUSD',
      type: 'sell',
      volume: 0.05,
      entryPrice: 1.0850,
      currentPrice: 1.0845,
      profit: 25.00,
      openTime: new Date(Date.now() - 7200000).toISOString(),
    }
  ];

  return NextResponse.json({
    success: true,
    message: 'Position closed (Demo Mode - Configure METAAPI_TOKEN for live trading)',
    positionId: positionId,
    closingProfit: 24.50,
    positions: updatedPositions,
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Use POST method to close positions'
  }, { status: 405 });
}
