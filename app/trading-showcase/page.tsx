import TradingShowcase from '@/components/TradingShowcase';

// Force dynamic rendering to reduce build time
export const dynamic = 'force-dynamic';

export default function TradingPage() {
  return (
    <main className="min-h-screen bg-black">
      <TradingShowcase />
    </main>
  );
}
