'use client';

import React, { useMemo } from 'react';
import { TradeDB } from '@/types/tradingJournal';
import { TradingStatistics } from '@/lib/tradingCalculations';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Percent,
  Award,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

interface TradeStatisticsProps {
  trades: TradeDB[];
  stats: TradingStatistics;
}

export default function TradeStatistics({ trades, stats }: TradeStatisticsProps) {
  const { formatPrice } = useCurrencyLocaleStore();
  // Calculate additional insights
  const insights = useMemo(() => {
    const assetTypeBreakdown: { [key: string]: { trades: number; pnl: number } } = {};
    const strategyBreakdown: { [key: string]: { trades: number; wins: number; pnl: number } } = {};
    const timeframeBreakdown: { [key: string]: { trades: number; wins: number } } = {};
    
    trades.forEach(trade => {
      // Asset type
      if (!assetTypeBreakdown[trade.asset_type]) {
        assetTypeBreakdown[trade.asset_type] = { trades: 0, pnl: 0 };
      }
      assetTypeBreakdown[trade.asset_type].trades++;
      assetTypeBreakdown[trade.asset_type].pnl += trade.net_pnl || 0;

      // Strategy
      if (trade.strategy) {
        if (!strategyBreakdown[trade.strategy]) {
          strategyBreakdown[trade.strategy] = { trades: 0, wins: 0, pnl: 0 };
        }
        strategyBreakdown[trade.strategy].trades++;
        if (trade.outcome === 'win') strategyBreakdown[trade.strategy].wins++;
        strategyBreakdown[trade.strategy].pnl += trade.net_pnl || 0;
      }

      // Timeframe
      if (trade.timeframe) {
        if (!timeframeBreakdown[trade.timeframe]) {
          timeframeBreakdown[trade.timeframe] = { trades: 0, wins: 0 };
        }
        timeframeBreakdown[trade.timeframe].trades++;
        if (trade.outcome === 'win') timeframeBreakdown[trade.timeframe].wins++;
      }
    });

    return { assetTypeBreakdown, strategyBreakdown, timeframeBreakdown };
  }, [trades]);

  const StatCard = ({ 
    title, 
    value, 
    subValue, 
    icon: Icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    subValue?: string; 
    icon: any; 
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`text-${color}-400`} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-white' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : null}
          </div>
        )}
      </div>
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {subValue && <div className="text-sm text-gray-500">{subValue}</div>}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Trades"
          value={stats.totalTrades}
          subValue={`${stats.winningTrades}W / ${stats.losingTrades}L`}
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subValue={`Loss Rate: ${stats.lossRate.toFixed(1)}%`}
          icon={Target}
          color="green"
          trend={stats.winRate >= 50 ? 'up' : 'down'}
        />
        <StatCard
          title="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          subValue={stats.profitFactor >= 2 ? 'Excellent' : stats.profitFactor >= 1.5 ? 'Good' : 'Needs Work'}
          icon={Award}
          color="purple"
          trend={stats.profitFactor >= 1.5 ? 'up' : 'down'}
        />
        <StatCard
          title="Net P&L"
          value={formatPrice(stats.totalNetProfit)}
          subValue={`Fees: ${formatPrice(stats.totalFees)}`}
          icon={DollarSign}
          color={stats.totalNetProfit >= 0 ? 'green' : 'red'}
          trend={stats.totalNetProfit >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Advanced Metrics */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity size={24} />
          Advanced Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <div className="text-gray-400 text-sm mb-1">Expectancy</div>
            <div className={`text-2xl font-bold ${
              stats.expectancy >= 0 ? 'text-white' : 'text-red-400'
            }`}>
              {formatPrice(stats.expectancy)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Average per trade</div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">Sharpe Ratio</div>
            <div className={`text-2xl font-bold ${
              stats.sharpeRatio >= 1 ? 'text-white' : 'text-yellow-400'
            }`}>
              {stats.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Risk-adjusted return</div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">Sortino Ratio</div>
            <div className={`text-2xl font-bold ${
              stats.sortinioRatio >= 1 ? 'text-white' : 'text-yellow-400'
            }`}>
              {stats.sortinioRatio.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Downside risk measure</div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">Average Win</div>
            <div className="text-2xl font-bold text-white">
              {formatPrice(stats.averageWin)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Per winning trade</div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">Average Loss</div>
            <div className="text-2xl font-bold text-red-400">
              {formatPrice(Math.abs(stats.averageLoss))}
            </div>
            <div className="text-xs text-gray-500 mt-1">Per losing trade</div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">Avg Risk/Reward</div>
            <div className={`text-2xl font-bold ${
              stats.averageRiskReward >= 2 ? 'text-white' : 'text-yellow-400'
            }`}>
              1:{stats.averageRiskReward.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Risk to reward ratio</div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-400">
              {formatPrice(stats.maxDrawdown)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.maxDrawdownPercentage.toFixed(1)}% peak to trough
            </div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">Best Trade</div>
            <div className="text-2xl font-bold text-white">
              {formatPrice(stats.largestWin)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Largest winning trade</div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-1">Worst Trade</div>
            <div className="text-2xl font-bold text-red-400">
              {formatPrice(Math.abs(stats.largestLoss))}
            </div>
            <div className="text-xs text-gray-500 mt-1">Largest losing trade</div>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Winning Streaks</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm">Longest Win Streak</div>
              <div className="text-3xl font-bold text-white">
                {stats.consecutiveWins}
              </div>
            </div>
            <TrendingUp className="text-white" size={48} />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Losing Streaks</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm">Longest Loss Streak</div>
              <div className="text-3xl font-bold text-red-400">
                {stats.consecutiveLosses}
              </div>
            </div>
            <TrendingDown className="text-red-400" size={48} />
          </div>
        </div>
      </div>

      {/* Asset Type Breakdown */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <PieChart size={24} />
          Performance by Asset Type
        </h3>
        
        <div className="space-y-4">
          {Object.entries(insights.assetTypeBreakdown).map(([type, data]) => {
            const percentage = (data.trades / stats.totalTrades) * 100;
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-medium capitalize">{type}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{data.trades} trades</span>
                    <span className={data.pnl >= 0 ? 'text-white' : 'text-red-400'}>
                      {formatPrice(data.pnl)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      data.pnl >= 0 ? 'bg-white' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy Performance */}
      {Object.keys(insights.strategyBreakdown).length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target size={24} />
            Strategy Performance
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Strategy</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Trades</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Win Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(insights.strategyBreakdown)
                  .sort((a, b) => b[1].pnl - a[1].pnl)
                  .map(([strategy, data]) => {
                    const winRate = (data.wins / data.trades) * 100;
                    return (
                      <tr key={strategy} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{strategy}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{data.trades}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            winRate >= 60 
                              ? 'bg-white/20 text-white'
                              : winRate >= 40
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {winRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          data.pnl >= 0 ? 'text-white' : 'text-red-400'
                        }`}>
                          {formatPrice(data.pnl)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeframe Performance */}
      {Object.keys(insights.timeframeBreakdown).length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Timeframe Analysis</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(insights.timeframeBreakdown)
              .sort((a, b) => b[1].trades - a[1].trades)
              .map(([timeframe, data]) => {
                const winRate = (data.wins / data.trades) * 100;
                return (
                  <div key={timeframe} className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">{timeframe}</div>
                    <div className="text-xl font-bold text-white mb-1">
                      {data.trades} trades
                    </div>
                    <div className={`text-sm font-medium ${
                      winRate >= 50 ? 'text-white' : 'text-red-400'
                    }`}>
                      {winRate.toFixed(0)}% Win Rate
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Profit Distribution */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-xl font-bold text-white mb-6">Profit Distribution</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-gray-400 text-sm mb-3">Gross Profits vs Losses</div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white">Gross Profit</span>
                  <span className="text-white font-medium">
                    {formatPrice(stats.totalGrossProfit)}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full"
                    style={{ 
                      width: `${(stats.totalGrossProfit / (stats.totalGrossProfit + Math.abs(stats.totalGrossLoss))) * 100}%` 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-red-400">Gross Loss</span>
                  <span className="text-white font-medium">
                    {formatPrice(Math.abs(stats.totalGrossLoss))}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full"
                    style={{ 
                      width: `${(Math.abs(stats.totalGrossLoss) / (stats.totalGrossProfit + Math.abs(stats.totalGrossLoss))) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-gray-400 text-sm mb-3">Win/Loss Distribution</div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white">Wins</span>
                  <span className="text-white font-medium">
                    {stats.winningTrades} ({stats.winRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full"
                    style={{ width: `${stats.winRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-red-400">Losses</span>
                  <span className="text-white font-medium">
                    {stats.losingTrades} ({stats.lossRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full"
                    style={{ width: `${stats.lossRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
