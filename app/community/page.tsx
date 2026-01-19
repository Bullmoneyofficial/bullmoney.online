import type { Metadata } from 'next';
import CommunityContent from './CommunityContent';

export const metadata: Metadata = {
  title: 'Community | BullMoney',
  description: 'Join our trading community. Connect with 10,000+ traders, get live Telegram updates, and access exclusive Discord server.',
  openGraph: {
    title: 'Community | BullMoney',
    description: 'Join our trading community on Discord, Telegram, and Instagram.',
    type: 'website',
  },
};

export default function CommunityPage() {
  return <CommunityContent />;
}
