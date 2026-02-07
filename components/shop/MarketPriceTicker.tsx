"use client";

import React, { useEffect, useState, memo, useCallback } from 'react';
import LogoLoop, { LogoItem } from '@/components/LogoLoop';

interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  logo: string;
  type: 'crypto' | 'metal';
}

// CoinGecko logo URLs
const CRYPTO_LOGOS: Record<string, string> = {
  BTC: 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',
  XRP: 'https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://coin-images.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png',
  LINK: 'https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  DOT: 'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png',
  AVAX: 'https://coin-images.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  MATIC: 'https://coin-images.coingecko.com/coins/images/4713/small/polygon.png',
};

// Metal logos (using simple SVG data URIs)
const METAL_LOGOS: Record<string, string> = {
  XAU: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="15" fill="%23FFD700"/%3E%3Ctext x="16" y="21" font-size="12" font-weight="bold" text-anchor="middle" fill="%23000"%3EAu%3C/text%3E%3C/svg%3E',
  XAG: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="15" fill="%23C0C0C0"/%3E%3Ctext x="16" y="21" font-size="12" font-weight="bold" text-anchor="middle" fill="%23000"%3EAg%3C/text%3E%3C/svg%3E',
  XPT: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="15" fill="%23E5E4E2"/%3E%3Ctext x="16" y="21" font-size="12" font-weight="bold" text-anchor="middle" fill="%23000"%3EPt%3C/text%3E%3C/svg%3E',
  XPD: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="15" fill="%23B8B8B8"/%3E%3Ctext x="16" y="21" font-size="12" font-weight="bold" text-anchor="middle" fill="%23000"%3EPd%3C/text%3E%3C/svg%3E',
};

const COIN_IDS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
];

const METAL_IDS = [
  { symbol: 'XAU', name: 'Gold' },
  { symbol: 'XAG', name: 'Silver' },
  { symbol: 'XPT', name: 'Platinum' },
  { symbol: 'XPD', name: 'Palladium' },
];

const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toFixed(6)}`;
};

const formatChange = (change: number): string => {
  const arrow = change >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(change).toFixed(2)}%`;
};

interface TickerItemProps {
  asset: MarketAsset;
}

const TickerItemContent = memo(function TickerItemContent({ asset }: TickerItemProps) {
  const isPositive = asset.change24h >= 0;
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/5">
      <img 
        src={asset.logo} 
        alt={asset.name}
        className="w-5 h-5 md:w-6 md:h-6 rounded-full"
        loading="lazy"
      />
      <span className="text-xs md:text-sm font-semibold text-white/90">{asset.symbol}</span>
      <span className="text-xs md:text-sm text-white/60 font-mono">{formatPrice(asset.price)}</span>
      <span className={`text-xs md:text-sm font-semibold font-mono ${isPositive ? 'text-green-400/90' : 'text-red-400/90'}`}>
        {formatChange(asset.change24h)}
      </span>
    </div>
  );
});

interface MarketPriceTickerProps {
  direction?: 'left' | 'right';
  showMetals?: boolean;
  showCrypto?: boolean;
  speed?: number;
  className?: string;
}

export const MarketPriceTicker = memo(function MarketPriceTicker({
  direction = 'left',
  showMetals = true,
  showCrypto = true,
  speed = 25,
  className = '',
}: MarketPriceTickerProps) {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrices = useCallback(async (signal?: AbortSignal) => {
    try {
      const results: MarketAsset[] = [];

      // Use our Next.js API route instead of direct external API calls
      const apiUrl = `/api/market-prices?crypto=${showCrypto}&metals=${showMetals}`;
      
      const response = await fetch(apiUrl, { 
        signal, 
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Process crypto data
      if (showCrypto && data.crypto) {
        COIN_IDS.forEach(coin => {
          const coinData = data.crypto[coin.id];
          if (coinData) {
            results.push({
              symbol: coin.symbol,
              name: coin.name,
              price: coinData.usd || 0,
              change24h: coinData.usd_24h_change || 0,
              logo: CRYPTO_LOGOS[coin.symbol] || '',
              type: 'crypto',
            });
          }
        });
      }

      // Process metals data
      if (showMetals && data.metals) {
        const metalPrices: Record<string, { price: number; change: number }> = {};
        
        if (Array.isArray(data.metals)) {
          data.metals.forEach((metal: { gold?: number; silver?: number; platinum?: number; palladium?: number }) => {
            if (metal.gold) metalPrices['XAU'] = { price: metal.gold, change: 0 };
            if (metal.silver) metalPrices['XAG'] = { price: metal.silver, change: 0 };
            if (metal.platinum) metalPrices['XPT'] = { price: metal.platinum, change: 0 };
            if (metal.palladium) metalPrices['XPD'] = { price: metal.palladium, change: 0 };
          });
        }

        METAL_IDS.forEach(metal => {
          const metalData = metalPrices[metal.symbol];
          results.push({
            symbol: metal.symbol,
            name: metal.name,
            price: metalData?.price || (metal.symbol === 'XAU' ? 2650 : metal.symbol === 'XAG' ? 31 : metal.symbol === 'XPT' ? 980 : 1050),
            change24h: metalData?.change || 0,
            logo: METAL_LOGOS[metal.symbol],
            type: 'metal',
          });
        });
      }

      setAssets(results);
      setIsLoading(false);
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      
      console.warn('Market prices fetch failed, using fallback data:', error);
      
      // Comprehensive fallback data
      const fallbackResults: MarketAsset[] = [];
      
      if (showCrypto) {
        const FALLBACK_CRYPTO: Record<string, { price: number; change: number }> = {
          BTC: { price: 97000, change: 2.5 },
          ETH: { price: 3300, change: 3.2 },
          SOL: { price: 190, change: 5.1 },
          XRP: { price: 0.62, change: 1.8 },
          ADA: { price: 0.45, change: -0.5 },
          DOGE: { price: 0.08, change: 1.2 },
          LINK: { price: 15, change: 2.1 },
          DOT: { price: 7.5, change: 0.9 },
          AVAX: { price: 38, change: 3.5 },
          MATIC: { price: 0.85, change: 1.5 },
        };
        
        COIN_IDS.forEach(coin => {
          const data = FALLBACK_CRYPTO[coin.symbol];
          fallbackResults.push({
            symbol: coin.symbol,
            name: coin.name,
            price: data.price,
            change24h: data.change,
            logo: CRYPTO_LOGOS[coin.symbol] || '',
            type: 'crypto',
          });
        });
      }

      if (showMetals) {
        const FALLBACK_METALS = [
          { symbol: 'XAU', name: 'Gold', price: 2650, change: 0.5 },
          { symbol: 'XAG', name: 'Silver', price: 31, change: 0.8 },
          { symbol: 'XPT', name: 'Platinum', price: 980, change: -0.3 },
          { symbol: 'XPD', name: 'Palladium', price: 1050, change: 0.2 },
        ];
        
        FALLBACK_METALS.forEach(metal => {
          fallbackResults.push({
            symbol: metal.symbol,
            name: metal.name,
            price: metal.price,
            change24h: metal.change,
            logo: METAL_LOGOS[metal.symbol],
            type: 'metal',
          });
        });
      }

      setAssets(fallbackResults);
      setIsLoading(false);
    }
  }, [showCrypto, showMetals]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPrices(controller.signal);
    const interval = setInterval(() => fetchPrices(controller.signal), 30000); // Refresh every 30s
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchPrices]);

  const logoItems: LogoItem[] = assets.map(asset => ({
    node: <TickerItemContent asset={asset} />,
    title: `${asset.name}: ${formatPrice(asset.price)}`,
    ariaLabel: `${asset.name} price: ${formatPrice(asset.price)}, ${asset.change24h >= 0 ? 'up' : 'down'} ${Math.abs(asset.change24h).toFixed(2)}%`,
  }));

  if (isLoading || assets.length === 0) {
    return (
      <div className={`h-10 bg-black/50 ${className}`} />
    );
  }

  return (
    <div className={`bg-black/90 border-y border-white/5 py-1.5 ${className}`}>
      <LogoLoop
        logos={logoItems}
        speed={speed}
        direction={direction}
        logoHeight={32}
        gap={24}
        pauseOnHover={false}
        fadeOut
        fadeOutColor="black"
        ariaLabel="Live market prices"
      />
    </div>
  );
});

export default MarketPriceTicker;
