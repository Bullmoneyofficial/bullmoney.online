import { NextRequest, NextResponse } from 'next/server';

/**
 * List all MT4/MT5 accounts linked to this MetaAPI token
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const token = process.env.METAAPI_TOKEN;
const region = process.env.METAAPI_REGION || 'new-york';

export async function GET(request: NextRequest) {
  try {
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'MetaAPI token not configured. Set METAAPI_TOKEN in environment variables.'
      }, { status: 500 });
    }

    // Dynamic import to avoid SSR issues
    const MetaApi = (await import('metaapi.cloud-sdk')).default;
    const api = new MetaApi(token, { region });
    
    // Get all accounts - using type assertion for MetaAPI SDK
    const accounts = await (api.metatraderAccountApi as any).getAccounts();
    
    const formattedAccounts = accounts.map((account: any) => ({
      id: account.id,
      name: account.name,
      login: account.login,
      server: account.server,
      platform: account.platform,
      type: account.type,
      state: account.state,
      connectionStatus: account.connectionStatus,
      magic: account.magic,
    }));

    return NextResponse.json({
      success: true,
      accounts: formattedAccounts,
      count: formattedAccounts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Accounts API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch accounts'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({
        success: false,
        error: 'Missing accountId'
      }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'MetaAPI token not configured'
      }, { status: 500 });
    }

    // Dynamic import to avoid SSR issues
    const MetaApi = (await import('metaapi.cloud-sdk')).default;
    const api = new MetaApi(token, { region });
    const account = await api.metatraderAccountApi.getAccount(accountId);
    
    if (!account) {
      return NextResponse.json({
        success: false,
        error: 'Account not found'
      }, { status: 404 });
    }

    // Undeploy and delete
    await account.undeploy();
    await account.remove();

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Accounts API] Delete error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete account'
    }, { status: 500 });
  }
}
