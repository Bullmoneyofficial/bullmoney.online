"use client";

import React from "react";
import type { WelcomeDesktopProps } from "../types";

type Props = {
  isDesktop: boolean;
  WelcomeScreenDesktop: React.ComponentType<WelcomeDesktopProps>;
  mobile: React.ReactNode;
  onSignUp: () => void;
  onGuest: () => void;
  onLogin: () => void;
};

export function WelcomeStep({ isDesktop, WelcomeScreenDesktop, mobile, onSignUp, onGuest, onLogin }: Props) {
  if (isDesktop) {
    return (
      <WelcomeScreenDesktop
        onSignUp={onSignUp}
        onGuest={onGuest}
        onLogin={onLogin}
        hideBackground
      />
    );
  }

  return <>{mobile}</>;
}
