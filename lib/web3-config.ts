'use client';

import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, base, optimism, sepolia } from 'wagmi/chains';

/* ─── Wagmi config for the Aviator game ─── */
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, base, optimism, sepolia],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

/* Supported chains for the dropdown */
export const SUPPORTED_CHAINS = [
  { id: mainnet.id, name: 'Ethereum', symbol: 'ETH', color: '#627EEA', icon: 'Ξ' },
  { id: polygon.id, name: 'Polygon', symbol: 'MATIC', color: '#8247E5', icon: '⬡' },
  { id: arbitrum.id, name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0', icon: '◈' },
  { id: base.id, name: 'Base', symbol: 'ETH', color: '#0052FF', icon: '◉' },
  { id: optimism.id, name: 'Optimism', symbol: 'ETH', color: '#FF0420', icon: '⊕' },
  { id: sepolia.id, name: 'Sepolia', symbol: 'ETH', color: '#CFB991', icon: '⧫' },
] as const;
