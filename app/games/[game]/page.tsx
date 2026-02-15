import CasinoGamePage from './GamePageClient';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';
import { GAME_SEO, VALID_GAMES } from './games/valid-games';

const PRIMARY_DOMAIN = 'https://www.bullmoney.shop';

function isValidGameSlug(game: string): game is (typeof VALID_GAMES)[number] {
  return (VALID_GAMES as readonly string[]).includes(game);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ game: string }>;
}): Promise<Metadata> {
  const { game } = await params;

  if (!isValidGameSlug(game)) {
    return {
      title: 'Game Not Found',
      description: 'This game does not exist.',
      robots: { index: false, follow: false },
    };
  }

  const seo = GAME_SEO[game];
  const path = `/games/${game}`;
  const canonical = `${PRIMARY_DOMAIN}${path}`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: [...seo.keywords, 'free online games', 'free games website', 'play free games online', 'demo games'],
    alternates: makeAlternatesMetadata(path, PRIMARY_DOMAIN),
    openGraph: {
      title: `BullMoney Games — ${seo.name}`,
      description: seo.description,
      url: canonical,
      siteName: 'BullMoney',
      images: [{ url: seo.image, width: 1200, height: 630, alt: `${seo.name} — Free Online Demo Game` }],
      locale: 'en_US',
      alternateLocale: ALL_OG_LOCALES,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Free ${seo.name} Demo Game — BullMoney`,
      description: seo.description,
      images: [seo.image],
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
}

export function generateStaticParams() {
  return VALID_GAMES.map((game) => ({ game }));
}

/** Allow runtime handling so routes never 404 due to missing static output */
export const dynamicParams = true;

export default async function GamePage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;

  if (!isValidGameSlug(game)) {
    notFound();
  }

  const seo = GAME_SEO[game];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: seo.name,
    description: seo.description,
    url: `${PRIMARY_DOMAIN}/games/${game}`,
    image: [`${PRIMARY_DOMAIN}${seo.image}`],
    operatingSystem: 'Web',
    applicationCategory: 'Game',
    genre: ['Free online game', 'Demo game'],
    isAccessibleForFree: true,
    audience: {
      '@type': 'Audience',
      audienceType: 'Adults',
    },
    contentRating: '18+',
  };

  return (
    <>
      <script
        id={`ld-game-${game}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CasinoGamePage game={game} />
    </>
  );
}
