import { NextRequest, NextResponse } from 'next/server';
import MetaApi from 'metaapi.cloud-sdk';

/**
 * MT4/MT5 Broker Connection API - Production Ready
 * Powered by MetaAPI (https://metaapi.cloud/)
 * 
 * Supports:
 * - MetaTrader 4 and MetaTrader 5
 * - Demo and Live accounts
 * - 1000+ brokers worldwide
 * - Real-time synchronization
 */

// Initialize MetaAPI
const token = process.env.METAAPI_TOKEN;
const region = process.env.METAAPI_REGION || 'new-york';

if (!token) {
  console.error('⚠️ METAAPI_TOKEN not set in environment variables!');
  console.error('Get your token at: https://app.metaapi.cloud/token');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, server, login, password, accountId, demo = true } = body;

    console.log('[Broker API] Connection attempt:', { type, server, login, demo });

    // Validate input
    if (!type || (!accountId && (!server || !login || !password))) {
      return NextResponse.json({
        success: false,
        error: 'Provide either accountId OR (server, login, password)'
      }, { status: 400 });
    }

    // Check if MetaAPI token is configured
    if (!token) {
      console.warn('[Broker API] MetaAPI token not configured, using demo mode');
      return getDemoResponse(type, login, server);
    }

    // Initialize MetaAPI client
    const api = new MetaApi(token, { region });

    let account;
    
    if (accountId) {
      // Connect to existing account by ID
      console.log('[Broker API] Connecting to existing account:', accountId);
      account = await api.metatraderAccountApi.getAccount(accountId);
      
      if (!account) {
        return NextResponse.json({
          success: false,
          error: `Account ${accountId} not found`
        }, { status: 404 });
      }
    } else {
      // Create new account
      console.log('[Broker API] Creating new account...');
      
      const accountData = {
        name: `${type.toUpperCase()} - ${login}`,
        type: type === 'mt5' ? 'cloud-g2' : 'cloud-g1',
        login: login,
        password: password,
        server: server,
        platform: type === 'mt5' ? 'mt5' : 'mt4',
        magic: 123456,
        application: 'MetaApi',
        region: region,
      };

      account = await api.metatraderAccountApi.createAccount(accountData);
      console.log('[Broker API] Account created:', account.id);
    }

    // Deploy and wait for connection
    console.log('[Broker API] Deploying account...');
    await account.deploy();
    
    console.log('[Broker API] Waiting for connection...');
    await account.waitConnected();
    
    // Get account connection
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();

    // Get account information
    const accountInfo = await connection.getAccountInformation();
    console.log('[Broker API] Account info retrieved:', accountInfo.login);

    // Get positions
    const positions = await connection.getPositions();
    console.log('[Broker API] Positions:', positions.length);

    // Get orders
    const orders = await connection.getOrders();
    console.log('[Broker API] Orders:', orders.length);

    // Format account data
    const formattedAccount = {
      accountId: account.id,
      accountNumber: accountInfo.login,
      server: accountInfo.server || server,
      type: type,
      balance: accountInfo.balance,
      equity: accountInfo.equity,
      margin: accountInfo.margin,
      freeMargin: accountInfo.freeMargin,
      leverage: accountInfo.leverage,
      currency: accountInfo.currency,
      company: accountInfo.company || accountInfo.broker || 'Unknown',
      name: accountInfo.name || account.name,
      demo: demo,
    };

    // Format positions
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

    // Format orders
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      symbol: order.symbol,
      type: order.type,
      volume: order.volume,
      targetPrice: order.openPrice,
      currentPrice: order.currentPrice,
      createdTime: order.time,
      stopLoss: order.stopLoss,
      takeProfit: order.takeProfit,
    }));

    return NextResponse.json({
      success: true,
      message: `Connected to ${type.toUpperCase()} successfully`,
      account: formattedAccount,
      positions: formattedPositions,
      orders: formattedOrders,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Broker API] Connection error:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message || 'Failed to connect to broker';
    
    if (error.message?.includes('NotAuthenticated')) {
      errorMessage = 'Invalid MetaAPI token. Get your token at https://app.metaapi.cloud/token';
    } else if (error.message?.includes('ValidationError')) {
      errorMessage = 'Invalid account credentials. Check server, login, and password.';
    } else if (error.message?.includes('TimeoutError')) {
      errorMessage = 'Connection timeout. The broker server may be down or unreachable.';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.METAAPI_DEBUG === 'true' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Demo/fallback mode when MetaAPI is not configured
function getDemoResponse(type: string, login: string, server: string) {
  const demoAccount = {
    accountId: 'demo-account',
    accountNumber: login,
    server: server,
    type: type,
    balance: 10000.00,
    equity: 10245.50,
    margin: 245.50,
    freeMargin: 9754.50,
    leverage: 100,
    currency: 'USD',
    company: 'Demo Broker',
    name: 'Demo Account',
    demo: true,
  };

  const demoPositions = [
    {
      id: '12345',
      symbol: 'XAUUSD',
      type: 'buy',
      volume: 0.01,
      entryPrice: 2650.50,
      currentPrice: 2653.00,
      profit: 24.50,
      openTime: new Date().toISOString(),
    },
    {
      id: '12346',
      symbol: 'EURUSD',
      type: 'sell',
      volume: 0.05,
      entryPrice: 1.0850,
      currentPrice: 1.0845,
      profit: 25.00,
      openTime: new Date().toISOString(),
    }
  ];

  const demoOrders = [
    {
      id: '67890',
      symbol: 'BTCUSD',
      type: 'Buy Limit',
      volume: 0.02,
      targetPrice: 95000,
      createdTime: new Date().toISOString(),
    }
  ];

  return NextResponse.json({
    success: true,
    message: `Connected to ${type.toUpperCase()} (Demo Mode - Configure METAAPI_TOKEN for live trading)`,
    account: demoAccount,
    positions: demoPositions,
    orders: demoOrders,
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Use POST method to connect to broker'
  }, { status: 405 });
}
