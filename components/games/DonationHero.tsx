'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ShieldCheck, Scale, Heart } from 'lucide-react';

// Your crypto donation addresses
const DONATION_ADDRESSES = {
  BTC: 'bc1purm66ng2asctqsl87jrjp6sk0sml6q8fpeymsl90pxdgsa70hm2qtramdl',
  ETH: '0xcd010464272d0190de122093bfc9106c5f37b1f3',
  USDT_ETH: '0xfC851C016d1f4D4031f7d20320252cb283169DF3',
  SOL: 'AMRcDPbT5aM8iUabH5dFvFmSmyjpcd6eEpijnjytYrJ',
  DOGE: 'DJX6PqD3y3cygeYtD9imbzHcEcuNScwenG'
};

export function DonationHero() {
  const [donationBalance, setDonationBalance] = useState(0);
  const [selectedCrypto, setSelectedCrypto] = useState<keyof typeof DONATION_ADDRESSES>('ETH');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch real donation balance from your backend/API
    // For now, showing placeholder
    setDonationBalance(0);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESSES[selectedCrypto]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative z-0 w-full bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-b-2 border-yellow-200/50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* CRITICAL LEGAL DISCLAIMER */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-sm mb-1">⚠️ DEMO GAMES ONLY - NO REAL GAMBLING</h3>
              <p className="text-red-800 text-xs leading-relaxed">
                <strong>IMPORTANT:</strong> All games below use <strong>DEMO CURRENCY ONLY</strong>. 
                No real money gambling occurs. These are <strong>skill games for entertainment purposes</strong>, 
                not licensed gambling services. Not intended for jurisdictions where online gambling is restricted.
                <br/><strong>18+ Only. Play Responsibly.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Donation Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-yellow-300 shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-yellow-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Support Gaming License Fund</h2>
                  <p className="text-sm text-gray-600">Help us obtain official gaming licenses to offer real prizes</p>
                </div>
              </div>
              
              {/* Donation Balance Display */}
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl px-6 py-3 text-white">
                <div className="text-xs opacity-90 mb-0.5">Total Raised</div>
                <div className="text-2xl font-bold">${donationBalance.toLocaleString()}</div>
              </div>
            </div>

            {/* Why We Need Donations */}
            <div className="bg-yellow-50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Scale className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-gray-700">
                  <strong className="text-gray-900">Why donate?</strong> Gaming licenses cost $50,000-$500,000+ 
                  depending on jurisdiction. Your donations fund:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    <li>Official gaming license applications (Curacao, Malta, UK)</li>
                    <li>Legal compliance and regulatory fees</li>
                    <li>Real prize pools once licensed</li>
                    <li>Platform development and security</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Crypto Selection */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(DONATION_ADDRESSES).map((crypto) => (
                <button
                  key={crypto}
                  onClick={() => setSelectedCrypto(crypto as keyof typeof DONATION_ADDRESSES)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCrypto === crypto
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {crypto}
                </button>
              ))}
            </div>

            {/* Address Display */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <label className="text-xs font-medium text-gray-600 mb-2 block">
                {selectedCrypto} Donation Address
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border border-gray-300 overflow-x-auto">
                  {DONATION_ADDRESSES[selectedCrypto]}
                </code>
                <button
                  onClick={copyAddress}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium text-sm whitespace-nowrap transition-all shadow-md hover:shadow-lg"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Transparent</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>All funds → licensing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Legal Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Donations are voluntary contributions to support license acquisition. Not tax-deductible. 
            No goods or services provided in exchange. Demo games remain free to play regardless of donation status.
          </p>
        </div>
      </div>
    </section>
  );
}
