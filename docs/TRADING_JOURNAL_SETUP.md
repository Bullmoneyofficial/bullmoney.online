# Trading Journal - Setup Guide

## Overview
A comprehensive trading journal system built for BullMoney.online that supports all tradable assets (stocks, crypto, forex, options, futures, commodities, bonds, ETFs).

## Features

### ✅ Calendar View
- 30-day interactive calendar
- Daily P&L tracking
- Win/loss indicators
- Trade count per day
- Visual performance heat map

### ✅ Trade Management
- Add/Edit/Delete trades
- Upload multiple images per trade
- Support for all asset types
- Long and short positions
- Leverage support

### ✅ Advanced Analytics
- **Win Rate**: Percentage of winning trades
- **Profit Factor**: Ratio of gross profits to gross losses
- **Expectancy**: Average expected return per trade
- **Sharpe Ratio**: Risk-adjusted returns
- **Sortino Ratio**: Downside risk measure
- **Maximum Drawdown**: Peak to trough decline
- **Average Risk/Reward**: Risk-to-reward ratio across trades

### ✅ Trade Details
- Entry/Exit prices
- Stop Loss & Take Profit levels
- Fees tracking (entry, exit, funding)
- Strategy tagging
- Timeframe analysis
- Market conditions
- Emotional state tracking
- Mistake logging

### ✅ Psychology Tracking
- Emotional state during trades
- Trading plan adherence
- Mistake documentation
- Session quality rating

### ✅ Data Export
- CSV export functionality
- Complete trade history
- All metrics included

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase project:

```bash
# In Supabase SQL Editor, run:
/Users/justin/Downloads/newbullmoney/TRADING_JOURNAL_SCHEMA.sql
```

This creates:
- `trades` table - Main trade records
- `trade_images` table - Trade screenshots/charts
- `daily_trading_stats` table - Daily aggregated stats
- `user_trading_stats` table - Overall user statistics

### 2. Storage Setup

Create a storage bucket for trade images in Supabase:

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `trade-images`
3. Set it to **Public** (or configure RLS policies)
4. Enable the following MIME types:
   - image/png
   - image/jpeg
   - image/jpg
   - image/webp

### 3. Storage RLS Policies

Add these policies to the `trade-images` bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload trade images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trade-images');

-- Allow users to view their own images
CREATE POLICY "Users can view their own trade images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'trade-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own trade images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'trade-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 4. Access the Journal

Users can access the trading journal in two ways:

1. **Via Ultimate Hub** (Recommended)
   - Click the FPS pill in the header
   - Select the "Journal" tab (with shining effect)
   - Click "Open Trading Journal" button

2. **Direct URL**
   - Navigate to `/journal`

## Usage Guide

### Adding a Trade

1. Click "+ Add Trade" button
2. Fill in required fields:
   - **Trade Date**: When the trade occurred
   - **Symbol**: Asset ticker (e.g., BTC, AAPL, EUR/USD)
   - **Asset Type**: Stock, Crypto, Forex, etc.
   - **Direction**: Long or Short
   - **Entry Price**: Price you entered
   - **Quantity**: Amount traded
   
3. Optional fields:
   - **Exit Price**: For closed trades
   - **Stop Loss & Take Profit**: Risk management
   - **Strategy**: Your trading strategy
   - **Notes**: Additional trade details
   - **Tags**: Custom labels
   - **Images**: Upload charts/screenshots

4. Click "Add Trade" to save

### Viewing Statistics

Switch to the "Statistics" tab to see:
- Performance metrics
- Win/loss distribution
- Asset type breakdown
- Strategy performance
- Timeframe analysis

### Calendar Navigation

- Use arrows to navigate months
- Click any date to view trades
- Hover over dates to see quick stats
- Green dots = Winning trades
- Red dots = Losing trades

## Calculations Reference

### Win Rate
```
Win Rate = (Winning Trades / Total Trades) × 100
```

### Profit Factor
```
Profit Factor = Total Gross Profit / Total Gross Loss
```

### Expectancy
```
Expectancy = (Win Rate × Average Win) - (Loss Rate × Average Loss)
```

### Sharpe Ratio
```
Sharpe Ratio = (Mean Return - Risk Free Rate) / Standard Deviation
```

### Risk/Reward Ratio
```
For Long: R/R = (Take Profit - Entry) / (Entry - Stop Loss)
For Short: R/R = (Entry - Take Profit) / (Stop Loss - Entry)
```

### Net P&L
```
For Long: P&L = (Exit Price - Entry Price) × Quantity × Leverage - Fees
For Short: P&L = (Entry Price - Exit Price) × Quantity × Leverage - Fees
```

## File Structure

```
/app/journal/page.tsx                    - Journal page route
/components/TradingJournal.tsx           - Main journal component
/components/TradeEntryModal.tsx          - Add/Edit trade modal
/components/TradingCalendar.tsx          - 30-day calendar view
/components/TradeStatistics.tsx          - Analytics dashboard
/lib/tradingCalculations.ts              - Calculation utilities
/types/tradingJournal.ts                 - TypeScript definitions
TRADING_JOURNAL_SCHEMA.sql               - Database schema
```

## Supported Asset Types

- **Stocks**: Traditional equities
- **Crypto**: Bitcoin, Ethereum, Altcoins
- **Forex**: Currency pairs (EUR/USD, GBP/USD, etc.)
- **Options**: Calls and Puts
- **Futures**: Commodity and index futures
- **Commodities**: Gold, Silver, Oil, etc.
- **Bonds**: Government and corporate bonds
- **ETFs**: Exchange-traded funds

## Performance Grades

Based on overall performance score (0-100):

- **S (95-100)**: Elite Professional
- **A (85-94)**: Advanced Trader
- **B (70-84)**: Intermediate
- **C (50-69)**: Developing
- **D (30-49)**: Beginner
- **F (<30)**: Needs Improvement

## Tips for Success

1. **Be Consistent**: Log every trade immediately
2. **Be Honest**: Track mistakes and emotions
3. **Review Weekly**: Analyze statistics weekly
4. **Use Tags**: Categorize trades for better insights
5. **Upload Screenshots**: Visual reference helps learning
6. **Track Psychology**: Note emotional state and discipline
7. **Set Goals**: Use statistics to set improvement targets

## Troubleshooting

### Images Not Uploading
- Check Supabase storage bucket exists
- Verify bucket is public or has correct RLS policies
- Ensure file size is under 10MB
- Check allowed MIME types

### Statistics Not Updating
- Ensure trades have `status = 'closed'`
- Check that exit prices are provided
- Verify database triggers are active
- Run manual recalculation if needed

### Calendar Not Showing Trades
- Check date range filters
- Verify trades have valid `trade_date`
- Ensure user is logged in
- Check RLS policies

## Future Enhancements

Potential features for future versions:

- [ ] Trade replays with time-based chart playback
- [ ] AI-powered trade analysis and suggestions
- [ ] Social sharing of trade setups (anonymized)
- [ ] Integration with broker APIs for auto-import
- [ ] Advanced charting with drawing tools
- [ ] Correlation analysis between strategies
- [ ] Monte Carlo simulations
- [ ] Risk management recommendations
- [ ] Mobile app for on-the-go logging
- [ ] Voice notes for trade commentary

## Support

For issues or questions:
- Check this documentation first
- Review Supabase logs for errors
- Check browser console for client-side errors
- Contact BullMoney support team

---

**Built with ❤️ for traders, by traders**
