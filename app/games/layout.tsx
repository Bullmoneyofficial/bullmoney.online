import { GamesLayoutClient } from './GamesLayoutClient';

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <GamesLayoutClient>{children}</GamesLayoutClient>;
}
