import type { Metadata } from 'next';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';
import { GAME_SEO, VALID_GAMES } from './[game]/games/valid-games';

import { GamesPageClient } from './GamesPageClient';

const PRIMARY_DOMAIN = 'https://www.bullmoney.shop';

export const metadata: Metadata = {
  title: 'Free Online Games (Demo) — Play in Your Browser',
  description:
    'Play free online demo games in your browser — Dice, Mines, Crash, Plinko, Wheel, Jackpot, Slots & more. Free-to-play with virtual currency only. 18+.',
  keywords: [
    'free games',
    'free online games',
    'free games website',
    'play free games online',
    'free casino games',
    'free casino demo games',
    'crypto casino games demo',
    'bullmoney games',
    'dice game free',
    'mines game free',
    'crash game free',
    'plinko free',
    'wheel game free',
    'jackpot game free',
    'free slots',
    'flappy bird free',
  ],
  alternates: makeAlternatesMetadata('/games', PRIMARY_DOMAIN),
  openGraph: {
    title: 'BullMoney Games — Free Online Demo Games',
    description:
      'Free-to-play demo games with virtual currency only. Play Dice, Mines, Crash, Plinko, Wheel, Jackpot, Slots & more in your browser. 18+.',
    url: `${PRIMARY_DOMAIN}/games`,
    siteName: 'BullMoney',
    images: [{ url: '/IMG_2921.PNG', width: 1200, height: 630, alt: 'BullMoney Games — Free Online Demo Games' }],
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online Demo Games — BullMoney',
    description:
      'Play free demo games in your browser (virtual currency only). Dice, Mines, Crash, Plinko, Wheel, Jackpot, Slots & more. 18+.',
    images: ['/IMG_2921.PNG'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function GamesPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'BullMoney Games (Free Demo)',
    description:
      'A collection of free-to-play demo games that run in your browser using virtual currency only (no deposits, no withdrawals).',
    itemListElement: VALID_GAMES.map((slug, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${PRIMARY_DOMAIN}/games/${slug}`,
      name: GAME_SEO[slug].name,
    })),
  };

  return (
    <>
      <script
        id="ld-games-itemlist"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <GamesPageClient />
    </>
  );
}
