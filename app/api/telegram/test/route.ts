import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

/**
 * Telegram Setup Test Endpoint
 * Visit this page to diagnose VIP channel integration issues
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  // Test 1: Bot Connection
  try {
    const botRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const botData = await botRes.json();
    results.tests.push({
      name: 'Bot Connection',
      status: botData.ok ? 'PASS' : 'FAIL',
      details: botData.ok ? `Connected to @${botData.result.username}` : botData.description,
      bot: botData.result,
    });
  } catch (error) {
    results.tests.push({
      name: 'Bot Connection',
      status: 'FAIL',
      error: String(error),
    });
  }

  // Test 2: Webhook Status
  try {
    const webhookRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const webhookData = await webhookRes.json();
    const hasWebhook = webhookData.result?.url && webhookData.result.url !== '';
    results.tests.push({
      name: 'Webhook Status',
      status: hasWebhook ? 'WARNING' : 'PASS',
      details: hasWebhook 
        ? `Active webhook found: ${webhookData.result.url} - This BLOCKS getUpdates!`
        : 'No webhook active - getUpdates will work',
      webhook: webhookData.result,
      fix: hasWebhook ? 'POST /api/telegram/delete-webhook to remove it' : null,
    });
  } catch (error) {
    results.tests.push({
      name: 'Webhook Status',
      status: 'FAIL',
      error: String(error),
    });
  }

  // Test 3: Recent Updates
  try {
    const updatesRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=10`);
    const updatesData = await updatesRes.json();
    const channelPosts = updatesData.result?.filter((u: any) => u.channel_post) || [];
    results.tests.push({
      name: 'Recent Channel Posts',
      status: channelPosts.length > 0 ? 'PASS' : 'WARNING',
      details: `Found ${channelPosts.length} channel posts in recent updates`,
      totalUpdates: updatesData.result?.length || 0,
      channelPosts: channelPosts.length,
      hint: channelPosts.length === 0 
        ? 'No channel posts found. Make sure @MrBullmoneybot is admin in your VIP channel and post a test message.'
        : 'Channel posts detected - messages should appear in VIP Trades',
    });
  } catch (error) {
    results.tests.push({
      name: 'Recent Channel Posts',
      status: 'FAIL',
      error: String(error),
    });
  }

  // Test 4: VIP Channel API
  try {
    const vipRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/telegram/channel?channel=vip&t=${Date.now()}`, {
      cache: 'no-store',
    });
    const vipData = await vipRes.json();
    results.tests.push({
      name: 'VIP Channel API',
      status: vipData.posts?.length > 0 ? 'PASS' : 'WARNING',
      details: `API returned ${vipData.posts?.length || 0} VIP messages`,
      apiResponse: vipData,
      hint: vipData.posts?.length === 0 
        ? 'VIP channel API is working but no messages found. Check webhook status and bot permissions.'
        : 'VIP messages are being fetched successfully!',
    });
  } catch (error) {
    results.tests.push({
      name: 'VIP Channel API',
      status: 'FAIL',
      error: String(error),
    });
  }

  // Overall Status
  const failCount = results.tests.filter((t: any) => t.status === 'FAIL').length;
  const warnCount = results.tests.filter((t: any) => t.status === 'WARNING').length;
  const passCount = results.tests.filter((t: any) => t.status === 'PASS').length;

  results.summary = {
    total: results.tests.length,
    passed: passCount,
    warnings: warnCount,
    failed: failCount,
    overall: failCount > 0 ? 'FAILED' : warnCount > 0 ? 'NEEDS ATTENTION' : 'ALL GOOD',
  };

  results.recommendations = [];
  
  const webhookTest = results.tests.find((t: any) => t.name === 'Webhook Status');
  if (webhookTest?.status === 'WARNING') {
    results.recommendations.push({
      issue: 'Active webhook is blocking getUpdates',
      action: 'Delete the webhook',
      command: 'curl -X POST https://bullmoney.online/api/telegram/delete-webhook',
    });
  }

  const postsTest = results.tests.find((t: any) => t.name === 'Recent Channel Posts');
  if (postsTest?.status === 'WARNING') {
    results.recommendations.push({
      issue: 'No channel posts found',
      action: 'Ensure bot is admin in VIP channel and post a test message',
      steps: [
        '1. Open VIP channel in Telegram',
        '2. Go to Channel Info → Administrators',
        '3. Add @MrBullmoneybot with "Post Messages" permission',
        '4. Post a test message',
        '5. Refresh this page',
      ],
    });
  }

  return NextResponse.json(results, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
