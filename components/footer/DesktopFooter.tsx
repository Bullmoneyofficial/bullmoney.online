"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { IconChevronRight } from "@tabler/icons-react";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

interface DesktopFooterProps {
  onDisclaimerClick: () => void;
  onAppsAndToolsClick: () => void;
  onSocialsClick: () => void;
}

export const DesktopFooter: React.FC<DesktopFooterProps> = ({
  onDisclaimerClick,
  onAppsAndToolsClick,
  onSocialsClick,
}) => {
  const footerItems = [
    { name: "Disclaimer", onClick: onDisclaimerClick },
    { name: "Apps & Tools", onClick: onAppsAndToolsClick },
    { name: "Socials", onClick: onSocialsClick },
  ];

  return (
    <motion.div
      className="hidden lg:flex flex-col items-center w-full"
    >
      <div className="flex justify-center items-center gap-4">
        {footerItems.map((item) => (
          <FooterItem key={item.name} onClick={item.onClick}>
            {item.name}
          </FooterItem>
        ))}
      </div>
    </motion.div>
  );
};

const FooterItem = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <motion.div
      onClick={() => {
        SoundEffects.click();
        onClick();
      }}
      onMouseEnter={() => SoundEffects.hover()}
      className="relative group px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      <motion.div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500/0 group-hover:bg-blue-500/80 transition-all duration-300" 
        layoutId="underline"
      />
    </motion.div>
  );
};
