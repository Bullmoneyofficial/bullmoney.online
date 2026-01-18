/**
 * Telegram Session Generator for Private Channel Access
 * 
 * This script generates a StringSession that allows your app to access
 * private Telegram channels. Run this ONCE to get your session string.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://my.telegram.org/apps
 * 2. Log in with your phone number
 * 3. Create a new application (any name/platform)
 * 4. Copy your API_ID and API_HASH
 * 5. Run: node scripts/telegram-session-setup.js
 * 6. Enter your phone number when prompted
 * 7. Enter the verification code sent to your Telegram
 * 8. Copy the session string and add to .env.local as TELEGRAM_SESSION
 * 
 * IMPORTANT: The account you use MUST be a member of the private VIP channel!
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');

// Replace these with your values from https://my.telegram.org/apps
const API_ID = process.env.TELEGRAM_API_ID || 'YOUR_API_ID';
const API_HASH = process.env.TELEGRAM_API_HASH || 'YOUR_API_HASH';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🔐 Telegram Session Generator\n');
  console.log('This will generate a session string for accessing private channels.\n');

  let apiId = API_ID;
  let apiHash = API_HASH;

  if (apiId === 'YOUR_API_ID') {
    apiId = await prompt('Enter your API_ID from my.telegram.org: ');
  }
  if (apiHash === 'YOUR_API_HASH') {
    apiHash = await prompt('Enter your API_HASH from my.telegram.org: ');
  }

  const stringSession = new StringSession('');
  
  const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await prompt('Enter your phone number (with country code, e.g. +1234567890): '),
    password: async () => await prompt('Enter your 2FA password (if enabled, otherwise press Enter): '),
    phoneCode: async () => await prompt('Enter the verification code sent to your Telegram: '),
    onError: (err) => console.error('Error:', err),
  });

  console.log('\n✅ Successfully logged in!\n');
  
  const sessionString = client.session.save();
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 Your TELEGRAM_SESSION string (add this to .env.local):');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(sessionString);
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  
  console.log('Add these to your .env.local file:\n');
  console.log(`TELEGRAM_API_ID=${apiId}`);
  console.log(`TELEGRAM_API_HASH=${apiHash}`);
  console.log(`TELEGRAM_SESSION=${sessionString}`);
  console.log(`VIP_CHANNEL_USERNAME=bullmoneyvip`);
  console.log('\n');

  // Test access to the VIP channel
  const channelUsername = await prompt('Enter VIP channel username to test (e.g. bullmoneyvip): ');
  
  if (channelUsername) {
    try {
      console.log(`\nTesting access to @${channelUsername}...`);
      const messages = await client.getMessages(channelUsername, { limit: 3 });
      console.log(`✅ Successfully accessed @${channelUsername}!`);
      console.log(`Found ${messages.length} recent messages.\n`);
      
      if (messages.length > 0) {
        console.log('Latest message preview:');
        console.log(`"${messages[0].message?.substring(0, 100) || '(media)'}..."\n`);
      }
    } catch (err) {
      console.error(`❌ Could not access @${channelUsername}. Make sure you're a member!`);
    }
  }

  await client.disconnect();
  rl.close();
  
  console.log('Done! You can now use the VIP sync API to fetch messages.');
  process.exit(0);
}

main().catch(console.error);
