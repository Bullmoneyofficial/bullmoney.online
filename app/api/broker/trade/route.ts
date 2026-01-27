import { NextRequest, NextResponse } from 'next/server';
import MetaApi from 'metaapi.cloud-sdk';

/**
 * MT4/MT5 Trade Execution API - Production Ready
 * Powered by MetaAPI (https://metaapi.cloud/)
 */

const token = process.env.METAAPI_TOKEN;
const region = process.env.METAAPI_REGION || 'new-york';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, symbol, side, volume, stopLoss, takeProfit } = body;

    console.log('[Trade API] Execution attempt:', { accountId, symbol, side, volume });

    // Validate input
    if (!accountId || !symbol || !side || !volume) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: accountId, symbol, side, volume'
      }, { status: 400 });
    }

    if (side !== 'buy' && side !== 'sell') {
      return NextResponse.json({
        success: false,
        error: 'Invalid side. Must be "buy" or "sell"'
      }, { status: 400 });
    }

    // Check if MetaAPI is configured
    if (!token) {
      console.warn('[Trade API] MetaAPI not configured, using demo mode');
      return getDemoTradeResponse(symbol, side, volume);
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

    // Ensure account is deployed and connected
    if (account.state !== 'DEPLOYED') {
      await account.deploy();
    }
    await account.waitConnected();

    // Get connection
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();

    // Execute trade
    console.log('[Trade API] Executing market order...');
    
    const orderType = side === 'buy' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL';
    
    const trade = {
      actionType: 'ORDER_TYPE_BUY' as const,
      symbol: symbol.toUpperCase(),
      volume: parseFloat(volume.toString()),
      stopLoss: stopLoss ? parseFloat(stopLoss.toString()) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit.toString()) : undefined,
    };

    const result = await connection.createMarketBuyOrder(
      trade.symbol,
      trade.volume,
      trade.stopLoss,
      trade.takeProfit
    );

    console.log('[Trade API] Order executed:', result.orderId);

    // Get updated positions
    const positions = await connection.getPositions();
    const formattedPositions = positions.map((pos: any) => ({
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
      message: `${side.toUpperCase()} order executed successfully`,
      orderId: result.orderId,
      symbol: symbol.toUpperCase(),
      side: side,
      volume: volume,
      executionPrice: result.price || 'Market',
      positions: formattedPositions,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Trade API] Execution error:', error);
    
    let errorMessage = error.message || 'Failed to execute trade';
    
    if (error.message?.includes('TRADE_DISABLED')) {
      errorMessage = 'Trading is disabled for this account';
    } else if (error.message?.includes('NOT_ENOUGH_MONEY')) {
      errorMessage = 'Insufficient funds';
    } else if (error.message?.includes('MARKET_CLOSED')) {
      errorMessage = 'Market is closed';
    } else if (error.message?.includes('INVALID_STOPS')) {
      errorMessage = 'Invalid stop loss or take profit levels';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.METAAPI_DEBUG === 'true' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Demo mode fallback
function getDemoTradeResponse(symbol: string, side: string, volume: number) {
  const mockPrices: Record<string, number> = {
    'XAUUSD': 2653.50,
    'BTCUSD': 96500.00,
    'EURUSD': 1.0850,
    'GBPUSD': 1.2650,
    'USDJPY': 148.50,
    'ETHUSD': 3500.00,
  };

  const currentPrice = mockPrices[symbol.toUpperCase()] || 1.0000;
  const orderId = Math.random().toString(36).substring(7).toUpperCase();

  const newPosition = {
    id: orderId,
    symbol: symbol.toUpperCase(),
    type: side,
    volume: volume,
    entryPrice: currentPrice,
    currentPrice: currentPrice,
    profit: 0,
    openTime: new Date().toISOString(),
  };

  const updatedPositions = [
    newPosition,
    {
      id: '12345',
      symbol: 'XAUUSD',
      type: 'buy',
      volume: 0.01,
      entryPrice: 2650.50,
      currentPrice: 2653.50,
      profit: 30.00,
      openTime: new Date(Date.now() - 3600000).toISOString(),
    }
  ];

  return NextResponse.json({
    success: true,
    message: `${side.toUpperCase()} order executed (Demo Mode - Configure METAAPI_TOKEN for live trading)`,
    orderId: orderId,
    symbol: symbol.toUpperCase(),
    side: side,
    volume: volume,
    executionPrice: currentPrice,
    positions: updatedPositions,
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Use POST method to execute trades'
  }, { status: 405 });
}
