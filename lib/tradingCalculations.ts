// Trading Journal Calculation Utilities
// Comprehensive calculations for all trading metrics

export interface Trade {
  id: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  direction: 'long' | 'short';
  entry_fee: number;
  exit_fee: number;
  funding_fees: number;
  gross_pnl: number | null;
  net_pnl: number | null;
  outcome: 'win' | 'loss' | 'breakeven' | null;
  risk_amount: number | null;
  reward_amount: number | null;
  leverage: number;
}

export interface TradingStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  lossRate: number;
  profitFactor: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageRiskReward: number;
  sharpeRatio: number;
  sortinioRatio: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  totalGrossProfit: number;
  totalGrossLoss: number;
  totalNetProfit: number;
  totalFees: number;
  profitableDays: number;
  losingDays: number;
  averageDailyPnl: number;
  bestDay: number;
  worstDay: number;
}

/**
 * Calculate P&L for a single trade
 */
export function calculateTradePnL(trade: {
  entry_price: number;
  exit_price: number;
  quantity: number;
  direction: 'long' | 'short';
  entry_fee?: number;
  exit_fee?: number;
  funding_fees?: number;
  leverage?: number;
}): {
  gross_pnl: number;
  net_pnl: number;
  pnl_percentage: number;
} {
  const {
    entry_price,
    exit_price,
    quantity,
    direction,
    entry_fee = 0,
    exit_fee = 0,
    funding_fees = 0,
    leverage = 1,
  } = trade;

  let gross_pnl = 0;

  if (direction === 'long') {
    gross_pnl = (exit_price - entry_price) * quantity * leverage;
  } else {
    gross_pnl = (entry_price - exit_price) * quantity * leverage;
  }

  const total_fees = entry_fee + exit_fee + funding_fees;
  const net_pnl = gross_pnl - total_fees;
  
  const position_value = entry_price * quantity;
  const pnl_percentage = (net_pnl / position_value) * 100;

  return {
    gross_pnl,
    net_pnl,
    pnl_percentage,
  };
}

/**
 * Determine trade outcome
 */
export function determineOutcome(net_pnl: number): 'win' | 'loss' | 'breakeven' {
  if (net_pnl > 0) return 'win';
  if (net_pnl < 0) return 'loss';
  return 'breakeven';
}

/**
 * Calculate Risk/Reward Ratio
 */
export function calculateRiskReward(
  entry_price: number,
  stop_loss: number,
  take_profit: number,
  direction: 'long' | 'short'
): {
  risk_amount: number;
  reward_amount: number;
  risk_reward_ratio: number;
} {
  let risk_amount = 0;
  let reward_amount = 0;

  if (direction === 'long') {
    risk_amount = entry_price - stop_loss;
    reward_amount = take_profit - entry_price;
  } else {
    risk_amount = stop_loss - entry_price;
    reward_amount = entry_price - take_profit;
  }

  const risk_reward_ratio = risk_amount !== 0 ? reward_amount / risk_amount : 0;

  return {
    risk_amount: Math.abs(risk_amount),
    reward_amount: Math.abs(reward_amount),
    risk_reward_ratio,
  };
}

/**
 * Calculate Win Rate
 */
export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return (wins / total) * 100;
}

/**
 * Calculate Profit Factor
 * Ratio of gross profits to gross losses
 */
export function calculateProfitFactor(
  grossProfit: number,
  grossLoss: number
): number {
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / Math.abs(grossLoss);
}

/**
 * Calculate Expectancy (Average Expected Return per Trade)
 */
export function calculateExpectancy(
  winRate: number,
  averageWin: number,
  averageLoss: number
): number {
  const lossRate = 100 - winRate;
  return (winRate / 100) * averageWin - (lossRate / 100) * Math.abs(averageLoss);
}

/**
 * Calculate Sharpe Ratio
 * Measures risk-adjusted returns
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0
): number {
  if (returns.length === 0) return 0;

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
    returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  return (meanReturn - riskFreeRate) / stdDev;
}

/**
 * Calculate Sortino Ratio
 * Similar to Sharpe but only considers downside volatility
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = 0
): number {
  if (returns.length === 0) return 0;

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  // Only consider negative returns for downside deviation
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return Infinity;

  const downsideVariance =
    negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) /
    returns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);

  if (downsideDeviation === 0) return 0;

  return (meanReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate Maximum Drawdown
 */
export function calculateMaxDrawdown(equityCurve: number[]): {
  maxDrawdown: number;
  maxDrawdownPercentage: number;
} {
  if (equityCurve.length === 0) {
    return { maxDrawdown: 0, maxDrawdownPercentage: 0 };
  }

  let peak = equityCurve[0];
  let maxDrawdown = 0;
  let maxDrawdownPercentage = 0;

  for (const value of equityCurve) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = peak - value;
    const drawdownPercentage = peak !== 0 ? (drawdown / peak) * 100 : 0;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercentage = drawdownPercentage;
    }
  }

  return { maxDrawdown, maxDrawdownPercentage };
}

/**
 * Calculate consecutive wins/losses
 */
export function calculateStreaks(trades: Trade[]): {
  currentStreak: number;
  currentStreakType: 'win' | 'loss' | null;
  longestWinStreak: number;
  longestLossStreak: number;
} {
  if (trades.length === 0) {
    return {
      currentStreak: 0,
      currentStreakType: null,
      longestWinStreak: 0,
      longestLossStreak: 0,
    };
  }

  let currentStreak = 0;
  let currentStreakType: 'win' | 'loss' | null = null;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  for (const trade of trades) {
    if (trade.outcome === 'win') {
      tempWinStreak++;
      tempLossStreak = 0;
      currentStreakType = 'win';
      currentStreak = tempWinStreak;
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
    } else if (trade.outcome === 'loss') {
      tempLossStreak++;
      tempWinStreak = 0;
      currentStreakType = 'loss';
      currentStreak = tempLossStreak;
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
    } else {
      // Breakeven resets streaks
      tempWinStreak = 0;
      tempLossStreak = 0;
    }
  }

  return {
    currentStreak,
    currentStreakType,
    longestWinStreak,
    longestLossStreak,
  };
}

/**
 * Calculate comprehensive trading statistics
 */
export function calculateComprehensiveStats(
  trades: Trade[]
): TradingStatistics {
  const closedTrades = trades.filter(t => t.net_pnl !== null);

  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      lossRate: 0,
      profitFactor: 0,
      expectancy: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      averageRiskReward: 0,
      sharpeRatio: 0,
      sortinioRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercentage: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      totalGrossProfit: 0,
      totalGrossLoss: 0,
      totalNetProfit: 0,
      totalFees: 0,
      profitableDays: 0,
      losingDays: 0,
      averageDailyPnl: 0,
      bestDay: 0,
      worstDay: 0,
    };
  }

  const wins = closedTrades.filter(t => t.outcome === 'win');
  const losses = closedTrades.filter(t => t.outcome === 'loss');
  const breakevens = closedTrades.filter(t => t.outcome === 'breakeven');

  const totalGrossProfit = wins.reduce((sum, t) => sum + (t.gross_pnl || 0), 0);
  const totalGrossLoss = losses.reduce((sum, t) => sum + (t.gross_pnl || 0), 0);
  const totalNetProfit = closedTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
  
  const totalFees = closedTrades.reduce(
    (sum, t) => sum + t.entry_fee + t.exit_fee + t.funding_fees,
    0
  );

  const averageWin = wins.length > 0 
    ? wins.reduce((sum, t) => sum + (t.net_pnl || 0), 0) / wins.length 
    : 0;
  
  const averageLoss = losses.length > 0 
    ? losses.reduce((sum, t) => sum + (t.net_pnl || 0), 0) / losses.length 
    : 0;

  const largestWin = wins.length > 0 
    ? Math.max(...wins.map(t => t.net_pnl || 0)) 
    : 0;
  
  const largestLoss = losses.length > 0 
    ? Math.min(...losses.map(t => t.net_pnl || 0)) 
    : 0;

  const winRate = calculateWinRate(wins.length, closedTrades.length);
  const profitFactor = calculateProfitFactor(totalGrossProfit, totalGrossLoss);
  const expectancy = calculateExpectancy(winRate, averageWin, averageLoss);

  // Calculate risk/reward average
  const tradesWithRR = closedTrades.filter(
    t => t.risk_amount && t.reward_amount && t.risk_amount > 0
  );
  const averageRiskReward = tradesWithRR.length > 0
    ? tradesWithRR.reduce((sum, t) => sum + ((t.reward_amount || 0) / (t.risk_amount || 1)), 0) / tradesWithRR.length
    : 0;

  // Calculate equity curve for drawdown
  let equity = 10000; // Starting equity (arbitrary)
  const equityCurve = [equity];
  closedTrades.forEach(t => {
    equity += t.net_pnl || 0;
    equityCurve.push(equity);
  });

  const { maxDrawdown, maxDrawdownPercentage } = calculateMaxDrawdown(equityCurve);

  // Calculate returns for Sharpe/Sortino
  const returns = closedTrades.map(t => {
    const positionValue = t.entry_price * t.quantity;
    return positionValue !== 0 ? ((t.net_pnl || 0) / positionValue) * 100 : 0;
  });

  const sharpeRatio = calculateSharpeRatio(returns);
  const sortinioRatio = calculateSortinoRatio(returns);

  const streaks = calculateStreaks(closedTrades);

  // Daily statistics (placeholder - would need actual daily grouping)
  const profitableDays = 0;
  const losingDays = 0;
  const averageDailyPnl = totalNetProfit / Math.max(1, closedTrades.length);
  const bestDay = largestWin;
  const worstDay = largestLoss;

  return {
    totalTrades: closedTrades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    breakevenTrades: breakevens.length,
    winRate,
    lossRate: 100 - winRate,
    profitFactor,
    expectancy,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    averageRiskReward,
    sharpeRatio,
    sortinioRatio,
    maxDrawdown,
    maxDrawdownPercentage,
    consecutiveWins: streaks.longestWinStreak,
    consecutiveLosses: streaks.longestLossStreak,
    totalGrossProfit,
    totalGrossLoss,
    totalNetProfit,
    totalFees,
    profitableDays,
    losingDays,
    averageDailyPnl,
    bestDay,
    worstDay,
  };
}

/**
 * Format currency
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get color for P&L value
 */
export function getPnLColor(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
}
