import { DesignLayoutClient } from './DesignLayoutClient';

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return <DesignLayoutClient>{children}</DesignLayoutClient>;
}
