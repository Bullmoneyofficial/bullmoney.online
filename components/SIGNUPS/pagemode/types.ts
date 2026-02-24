import type React from "react";

export type Broker = "Vantage" | "XM";

export type ViewMode = "register" | "login";

export type LegalTab = "terms" | "privacy" | "disclaimer";

export type FormData = {
  email: string;
  mt5Number: string;
  password: string;
  referralCode: string;
};

export type ReferralAttribution = {
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  affiliateCode: string;
  source: string;
  medium: string;
  campaign: string;
};

export type HubPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  fps: number;
  deviceTier: "high" | "mid" | "low";
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  userEmail?: string;
  prices: any;
};

export type HubPillProps = {
  fps: number;
  deviceTier: "high" | "mid" | "low";
  prices: any;
  isMinimized: boolean;
  onToggleMinimized: () => void;
  onOpenPanel: () => void;
  topOffsetMobile: string;
  topOffsetDesktop: string;
  mobileAlignment: "left" | "center" | "right";
};

export type WelcomeDesktopProps = {
  onSignUp: () => void;
  onGuest: () => void;
  onLogin: () => void;
  hideBackground?: boolean;
};

export type SafePortalComponent = (props: { children: React.ReactNode; container?: Element | null }) => React.ReactNode;
