import TradingJournal from '@/components/TradingJournal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trading Journal | BullMoney',
  description: 'Track your trades, analyze performance, and improve your trading strategy. Supports stocks, crypto, forex, and all tradable assets.',
  keywords: 'trading journal, trade tracker, trading analytics, P&L tracking, win rate, profit factor',
};

export default function TradingJournalPage() {
  return (
    <div className="min-h-screen bg-black">
      <TradingJournal />
    </div>
  );
}
