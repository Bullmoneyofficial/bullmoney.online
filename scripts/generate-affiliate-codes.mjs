#!/usr/bin/env node

/**
 * Affiliate Code Batch Generation Script
 * 
 * Usage:
 *   node scripts/generate-affiliate-codes.js status
 *   node scripts/generate-affiliate-codes.js generate
 * 
 * Environment variables:
 *   API_URL - Base URL (default: http://localhost:3000)
 *   AFFILIATE_BATCH_SECRET - Admin secret for authentication
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AFFILIATE_BATCH_SECRET = process.env.AFFILIATE_BATCH_SECRET || 'change-this-in-prod';
const command = process.argv[2] || 'status';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${AFFILIATE_BATCH_SECRET}`,
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode,
            data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('🔧 BullMoney Affiliate Code Batch Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`API: ${API_URL}\n`);

  try {
    if (command === 'status') {
      console.log('📊 Checking affiliate code status...\n');
      const result = await makeRequest('GET', '/api/recruit/batch-generate-codes');

      if (result.status === 200) {
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.error('❌ Error:', result.data.error || `HTTP ${result.status}`);
        process.exit(1);
      }
    } else if (command === 'generate') {
      console.log('⚙️  Generating affiliate codes for existing users...');
      console.log('ℹ️  This will generate codes for all users without an affiliate_code\n');

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('Continue? (y/N) ', async (answer) => {
        rl.close();

        if (answer.toLowerCase() !== 'y') {
          console.log('❌ Cancelled');
          process.exit(0);
        }

        try {
          console.log('\n⏳ Processing...\n');
          const result = await makeRequest('POST', '/api/recruit/batch-generate-codes', {});

          if (result.status === 200) {
            console.log(JSON.stringify(result.data, null, 2));
            if (result.data.generated > 0) {
              console.log(`\n✅ Successfully generated ${result.data.generated} affiliate codes!`);
            }
          } else {
            console.error('❌ Error:', result.data.error || `HTTP ${result.status}`);
            process.exit(1);
          }
        } catch (error) {
          console.error('❌ Request failed:', error.message);
          process.exit(1);
        }
      });
    } else if (command === 'help') {
      console.log('📖 Available Commands:\n');
      console.log('  status    - Check how many users need affiliate codes');
      console.log('  generate  - Generate codes for all users without one');
      console.log('  help      - Show this help message\n');
      console.log('⚙️  Environment Variables:\n');
      console.log('  API_URL                   - Base URL of your API (default: http://localhost:3000)');
      console.log('  AFFILIATE_BATCH_SECRET    - Admin secret for authentication\n');
      console.log('📋 Examples:\n');
      console.log('  # Check status');
      console.log('  node scripts/generate-affiliate-codes.js status\n');
      console.log('  # Generate codes');
      console.log('  node scripts/generate-affiliate-codes.js generate\n');
      console.log('  # Use custom API URL');
      console.log('  API_URL=https://bullmoney.online node scripts/generate-affiliate-codes.js status\n');
    } else {
      console.error(`❌ Unknown command: ${command}`);
      console.log("\nRun 'node scripts/generate-affiliate-codes.js help' for usage");
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
