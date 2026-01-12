"use client";
import React from "react";
import { motion } from "framer-motion";
import { FaInstagram, FaTwitter, FaDiscord } from "react-icons/fa";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

const socials = [
  {
    name: "Instagram",
    icon: <FaInstagram size={24} />,
    url: "https://www.instagram.com/bullmoney.online/",
  },
  {
    name: "Twitter",
    icon: <FaTwitter size={24} />,
    url: "https://twitter.com/bullmoneyonline",
  },
  {
    name: "Discord",
    icon: <FaDiscord size={24} />,
    url: "https://discord.gg/bullmoney",
  },
];

export const SocialsRow = () => {
  return (
    <div className="flex items-center gap-4">
      {socials.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => SoundEffects.hover()}
            onClick={() => SoundEffects.click()}
            onTouchStart={() => SoundEffects.click()}
            className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            {social.icon}
          </motion.div>
        </a>
      ))}
    </div>
  );
};
