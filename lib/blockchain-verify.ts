import Decimal from 'decimal.js';

// ============================================================================
// BLOCKCHAIN VERIFICATION - Check TX status on public block explorers
// Supports: ETH, BTC, SOL, XRP, DOGE, USDT/USDC (via ERC-20/TRC-20), BNB, Base
// Uses FREE public APIs — no API keys needed for basic checks
// ============================================================================

// Retry helper for blockchain API calls — exponential backoff
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError || new Error('fetchWithRetry exhausted');
}

// JSON-RPC helper for EVM chains
async function evmRpcCall(rpcUrl: string, method: string, params: unknown[], id = 1) {
  const res = await fetchWithRetry(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
  });
  return res.json();
}

export interface BlockchainTxResult {
  found: boolean;
  confirmations: number;
  status: 'success' | 'pending' | 'failed' | 'not_found';
  from?: string;
  to?: string;
  value?: string;       // Raw value in smallest unit
  valueParsed?: number;  // Parsed to human-readable
  blockNumber?: number;
  timestamp?: number;    // Unix timestamp
  error?: string;
}

// ── Ethereum / ERC-20 (ETH, USDT, USDC on Ethereum) ────────────────────
async function verifyEthereumTx(txHash: string, coin?: string): Promise<BlockchainTxResult> {
  try {
    const rpcUrl = process.env.ETH_RPC_URL || 'https://eth.llamarpc.com';
    
    // Get transaction receipt
    const receiptData = await evmRpcCall(rpcUrl, 'eth_getTransactionReceipt', [txHash]);
    
    if (!receiptData.result) {
      // TX might be pending — check mempool
      const txData = await evmRpcCall(rpcUrl, 'eth_getTransactionByHash', [txHash], 2);
      
      if (txData.result) {
        return {
          found: true,
          confirmations: 0,
          status: 'pending',
          from: txData.result.from,
          to: txData.result.to,
          value: txData.result.value,
          valueParsed: parseInt(txData.result.value, 16) / 1e18,
        };
      }
      return { found: false, confirmations: 0, status: 'not_found' };
    }
    
    const receipt = receiptData.result;
    const txSuccess = receipt.status === '0x1';
    
    // Get current block number for confirmation count
    const blockData = await evmRpcCall(rpcUrl, 'eth_blockNumber', [], 3);
    const currentBlock = parseInt(blockData.result, 16);
    const txBlock = parseInt(receipt.blockNumber, 16);
    const confirmations = currentBlock - txBlock;
    
    // Get full TX for native value
    const txData2 = await evmRpcCall(rpcUrl, 'eth_getTransactionByHash', [txHash], 4);
    
    let valueParsed: number | undefined;
    
    // Check if this is an ERC-20 token transfer (USDT, USDC, etc.)
    const upperCoin = (coin || '').toUpperCase();
    const isErc20 = upperCoin === 'USDT' || upperCoin === 'USDC';
    
    if (isErc20 && receipt.logs && receipt.logs.length > 0) {
      // ERC-20 Transfer event topic: Transfer(address,address,uint256)
      const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      const transferLog = receipt.logs.find(
        (log: { topics: string[] }) => log.topics && log.topics[0] === TRANSFER_TOPIC
      );
      if (transferLog) {
        const rawAmount = parseInt(transferLog.data, 16);
        // USDT and USDC both use 6 decimals on Ethereum
        const decimals = (upperCoin === 'USDT' || upperCoin === 'USDC') ? 6 : 18;
        valueParsed = rawAmount / Math.pow(10, decimals);
      }
    } else {
      // Native ETH transfer
      valueParsed = txData2.result?.value 
        ? parseInt(txData2.result.value, 16) / 1e18 
        : undefined;
    }
    
    return {
      found: true,
      confirmations,
      status: txSuccess ? 'success' : 'failed',
      from: receipt.from,
      to: receipt.to,
      value: txData2.result?.value,
      valueParsed,
      blockNumber: txBlock,
    };
  } catch (error) {
    return { found: false, confirmations: 0, status: 'not_found', error: String(error) };
  }
}

// ── Bitcoin ──────────────────────────────────────────────────────────────
async function verifyBitcoinTx(txHash: string, ourWallet?: string): Promise<BlockchainTxResult> {
  try {
    // Blockstream public API (no key needed)
    const res = await fetchWithRetry(`https://blockstream.info/api/tx/${txHash}`);
    if (!res.ok) {
      return { found: false, confirmations: 0, status: 'not_found' };
    }
    
    const tx = await res.json();
    
    // Get current block height
    const heightRes = await fetchWithRetry('https://blockstream.info/api/blocks/tip/height');
    const currentHeight = parseInt(await heightRes.text());
    
    const confirmations = tx.status?.confirmed 
      ? currentHeight - tx.status.block_height + 1 
      : 0;
    
    // Find the output to our wallet address specifically (not total outputs)
    let valueBTC: number | undefined;
    if (ourWallet && tx.vout) {
      const ourOutput = tx.vout.find(
        (out: { scriptpubkey_address?: string; value: number }) =>
          out.scriptpubkey_address?.toLowerCase() === ourWallet.toLowerCase()
      );
      if (ourOutput) {
        valueBTC = ourOutput.value / 1e8;
      }
    }
    
    // Fallback: if no specific wallet match, sum all outputs (less accurate)
    if (valueBTC === undefined && tx.vout) {
      const totalOutputSats = tx.vout.reduce(
        (sum: number, out: { value: number }) => sum + (out.value || 0), 0
      );
      valueBTC = totalOutputSats / 1e8;
    }
    
    return {
      found: true,
      confirmations,
      status: tx.status?.confirmed ? 'success' : 'pending',
      valueParsed: valueBTC,
      blockNumber: tx.status?.block_height,
      timestamp: tx.status?.block_time,
    };
  } catch (error) {
    return { found: false, confirmations: 0, status: 'not_found', error: String(error) };
  }
}

// ── Solana ───────────────────────────────────────────────────────────────
async function verifySolanaTx(txHash: string, ourWallet?: string): Promise<BlockchainTxResult> {
  try {
    const rpcUrl = process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    const data = await evmRpcCall(rpcUrl, 'getTransaction', [txHash, { encoding: 'json', maxSupportedTransactionVersion: 0 }]);
    
    if (!data.result) {
      return { found: false, confirmations: 0, status: 'not_found' };
    }
    
    const tx = data.result;
    const isSuccess = tx.meta?.err === null;
    
    // Get current slot for confirmations
    const slotData = await evmRpcCall(rpcUrl, 'getSlot', [{ commitment: 'confirmed' }], 2);
    const confirmations = slotData.result - tx.slot;
    
    // Get SOL transfer amount — find the balance change for our wallet
    let lamports: number | undefined;
    const accountKeys = tx.transaction?.message?.accountKeys || [];
    
    if (ourWallet) {
      const ourIndex = accountKeys.findIndex(
        (key: string) => key === ourWallet
      );
      if (ourIndex >= 0 && tx.meta?.preBalances && tx.meta?.postBalances) {
        const pre = tx.meta.preBalances[ourIndex] || 0;
        const post = tx.meta.postBalances[ourIndex] || 0;
        lamports = post - pre;
      }
    }
    
    // Fallback: use the second account balance change (receiver)
    if (lamports === undefined || lamports <= 0) {
      const preBalance = tx.meta?.preBalances?.[1] || 0;
      const postBalance = tx.meta?.postBalances?.[1] || 0;
      lamports = postBalance - preBalance;
    }
    
    return {
      found: true,
      confirmations: Math.max(0, confirmations),
      status: isSuccess ? 'success' : 'failed',
      valueParsed: lamports > 0 ? lamports / 1e9 : undefined, // lamports to SOL
      blockNumber: tx.slot,
      timestamp: tx.blockTime,
    };
  } catch (error) {
    return { found: false, confirmations: 0, status: 'not_found', error: String(error) };
  }
}

// ── XRP ──────────────────────────────────────────────────────────────────
async function verifyXrpTx(txHash: string): Promise<BlockchainTxResult> {
  try {
    const res = await fetchWithRetry(`https://api.xrpscan.com/api/v1/tx/${txHash}`);
    if (!res.ok) {
      return { found: false, confirmations: 0, status: 'not_found' };
    }
    
    const tx = await res.json();
    
    return {
      found: true,
      confirmations: tx.Validated ? 1 : 0, // XRP is instant after validation
      status: tx.TransactionResult === 'tesSUCCESS' ? 'success' : 'failed',
      from: tx.Account,
      to: tx.Destination,
      valueParsed: tx.Amount ? parseInt(tx.Amount) / 1e6 : undefined, // drops to XRP
      timestamp: tx.date ? tx.date + 946684800 : undefined, // Ripple epoch offset
    };
  } catch (error) {
    return { found: false, confirmations: 0, status: 'not_found', error: String(error) };
  }
}

// ── Dogecoin ─────────────────────────────────────────────────────────────
async function verifyDogecoinTx(txHash: string): Promise<BlockchainTxResult> {
  try {
    const res = await fetchWithRetry(`https://dogechain.info/api/v1/transaction/${txHash}`);
    if (!res.ok) {
      return { found: false, confirmations: 0, status: 'not_found' };
    }
    
    const data = await res.json();
    if (!data.transaction) {
      return { found: false, confirmations: 0, status: 'not_found' };
    }
    
    const tx = data.transaction;
    return {
      found: true,
      confirmations: tx.confirmations || 0,
      status: tx.confirmations > 0 ? 'success' : 'pending',
      valueParsed: tx.total_output ? parseFloat(tx.total_output) : undefined,
      timestamp: tx.time,
    };
  } catch (error) {
    return { found: false, confirmations: 0, status: 'not_found', error: String(error) };
  }
}

// ── Tron (TRC-20 USDT/USDC) ─────────────────────────────────────────────
async function verifyTronTx(txHash: string): Promise<BlockchainTxResult> {
  try {
    const res = await fetchWithRetry(`https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`);
    if (!res.ok) {
      return { found: false, confirmations: 0, status: 'not_found' };
    }
    
    const tx = await res.json();
    
    if (!tx.hash) {
      return { found: false, confirmations: 0, status: 'not_found' };
    }
    
    // Parse TRC-20 token transfer amount from trigger_info or tokenTransferInfo
    let valueParsed: number | undefined;
    if (tx.trigger_info?.parameter?._value) {
      // TRC-20 transfers store amount in trigger_info.parameter._value
      const rawAmount = BigInt(tx.trigger_info.parameter._value);
      // USDT/USDC on Tron = 6 decimals
      valueParsed = Number(rawAmount) / 1e6;
    } else if (tx.tokenTransferInfo?.amount_str) {
      const rawAmount = BigInt(tx.tokenTransferInfo.amount_str);
      const decimals = tx.tokenTransferInfo.decimals || 6;
      valueParsed = Number(rawAmount) / Math.pow(10, decimals);
    } else if (tx.contractData?.amount) {
      // Native TRX transfer
      valueParsed = tx.contractData.amount / 1e6;
    }
    
    return {
      found: true,
      confirmations: tx.confirmed ? 20 : 0, // Tron confirms quickly
      status: tx.contractRet === 'SUCCESS' ? 'success' : 'failed',
      from: tx.ownerAddress,
      to: tx.toAddress || tx.trigger_info?.parameter?.to,
      valueParsed,
      timestamp: tx.timestamp ? tx.timestamp / 1000 : undefined,
    };
  } catch (error) {
    return { found: false, confirmations: 0, status: 'not_found', error: String(error) };
  }
}

// ── BNB Smart Chain (BSC) ────────────────────────────────────────────────
async function verifyBscTx(txHash: string, coin?: string): Promise<BlockchainTxResult> {
  return verifyEvmTx(txHash, process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org', coin);
}

// ── Generic EVM verifier (works for ETH, BSC, Base, Polygon, etc.) ──────
async function verifyEvmTx(txHash: string, rpcUrl: string, coin?: string): Promise<BlockchainTxResult> {
  try {
    // Get transaction receipt
    const receiptData = await evmRpcCall(rpcUrl, 'eth_getTransactionReceipt', [txHash]);

    if (!receiptData.result) {
      // TX might be pending — check mempool
      const txData = await evmRpcCall(rpcUrl, 'eth_getTransactionByHash', [txHash], 2);
      if (txData.result) {
        return {
          found: true,
          confirmations: 0,
          status: 'pending',
          from: txData.result.from,
          to: txData.result.to,
          value: txData.result.value,
          valueParsed: parseInt(txData.result.value, 16) / 1e18,
        };
      }
      return { found: false, confirmations: 0, status: 'not_found' };
    }

    const receipt = receiptData.result;
    const txSuccess = receipt.status === '0x1';

    // Get current block number
    const blockData = await evmRpcCall(rpcUrl, 'eth_blockNumber', [], 3);
    const currentBlock = parseInt(blockData.result, 16);
    const txBlock = parseInt(receipt.blockNumber, 16);
    const confirmations = currentBlock - txBlock;

    // Get full TX for value
    const txData2 = await evmRpcCall(rpcUrl, 'eth_getTransactionByHash', [txHash], 4);

    // Handle ERC-20 token transfers
    let valueParsed: number | undefined;
    const upperCoin = (coin || '').toUpperCase();
    const isToken = upperCoin === 'USDT' || upperCoin === 'USDC';
    
    if (isToken && receipt.logs && receipt.logs.length > 0) {
      const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      const transferLog = receipt.logs.find(
        (log: { topics: string[] }) => log.topics && log.topics[0] === TRANSFER_TOPIC
      );
      if (transferLog) {
        const rawAmount = parseInt(transferLog.data, 16);
        const decimals = (upperCoin === 'USDT' || upperCoin === 'USDC') ? 6 : 18;
        valueParsed = rawAmount / Math.pow(10, decimals);
      }
    } else {
      valueParsed = txData2.result?.value
        ? parseInt(txData2.result.value, 16) / 1e18
        : undefined;
    }

    return {
      found: true,
      confirmations,
      status: txSuccess ? 'success' : 'failed',
      from: receipt.from,
      to: receipt.to,
      value: txData2.result?.value,
      valueParsed,
      blockNumber: txBlock,
    };
  } catch (error) {
    return { found: false, confirmations: 0, status: 'not_found', error: String(error) };
  }
}

// ── Main dispatcher ─────────────────────────────────────────────────────
export async function verifyTransaction(
  txHash: string, 
  coin: string, 
  network: string,
  ourWallet?: string
): Promise<BlockchainTxResult> {
  const upper = coin.toUpperCase();
  const net = network.toLowerCase();
  
  // Route to the right blockchain
  if (upper === 'BTC') return verifyBitcoinTx(txHash, ourWallet);
  if (upper === 'SOL') return verifySolanaTx(txHash, ourWallet);
  if (upper === 'XRP') return verifyXrpTx(txHash);
  if (upper === 'DOGE') return verifyDogecoinTx(txHash);
  
  // BNB / BSC chain
  if (upper === 'BNB' || net.includes('bsc') || net.includes('bnb') || net.includes('binance')) {
    return verifyBscTx(txHash, upper);
  }
  
  // Base L2 (EVM-compatible but different RPC)
  if (net.includes('base')) {
    return verifyEvmTx(txHash, process.env.BASE_RPC_URL || 'https://mainnet.base.org', upper);
  }
  
  // ERC-20 tokens (USDT/USDC on Ethereum)
  if (upper === 'ETH' || upper === 'USDT' || upper === 'USDC' || (net.includes('erc-20') || net.includes('ethereum'))) {
    return verifyEthereumTx(txHash, upper);
  }
  
  // TRC-20 tokens (USDT on Tron)
  if (net.includes('trc-20') || net.includes('tron')) {
    return verifyTronTx(txHash);
  }
  
  // Default to Ethereum for unknown
  return verifyEthereumTx(txHash, upper);
}

// ── Amount verification helper ──────────────────────────────────────────
const UNDERPAY_TOLERANCE = new Decimal('0.97');  // Allow 3% under (network fees, rounding)
const OVERPAY_TOLERANCE = new Decimal('1.10');   // Allow 10% over (generous to avoid false positives)
const EXACT_MIN = new Decimal('0.999');
const EXACT_MAX = new Decimal('1.001');

export function verifyAmount(
  expectedCrypto: number | string,
  actualCrypto: number | string
): { valid: boolean; ratio: number; status: 'exact' | 'underpaid' | 'overpaid' | 'acceptable'; difference: number } {
  const expected = new Decimal(expectedCrypto || 0);
  const actual = new Decimal(actualCrypto || 0);

  if (expected.lte(0)) {
    return { valid: false, ratio: 0, status: 'underpaid', difference: 0 };
  }
  if (actual.lte(0)) {
    return { valid: false, ratio: 0, status: 'underpaid', difference: expected.neg().toNumber() };
  }

  const ratio = actual.div(expected);
  const difference = actual.minus(expected);

  // Exact match (within 0.1%)
  if (ratio.gte(EXACT_MIN) && ratio.lte(EXACT_MAX)) {
    return { valid: true, ratio: ratio.toNumber(), status: 'exact', difference: difference.toNumber() };
  }
  // Acceptable range
  if (ratio.gte(UNDERPAY_TOLERANCE) && ratio.lte(OVERPAY_TOLERANCE)) {
    return { valid: true, ratio: ratio.toNumber(), status: 'acceptable', difference: difference.toNumber() };
  }
  // Underpaid
  if (ratio.lt(UNDERPAY_TOLERANCE)) {
    return { valid: false, ratio: ratio.toNumber(), status: 'underpaid', difference: difference.toNumber() };
  }
  // Overpaid (still valid but flagged)
  return { valid: true, ratio: ratio.toNumber(), status: 'overpaid', difference: difference.toNumber() };
}
