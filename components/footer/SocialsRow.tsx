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
            className="p-3 rounded-full bg-black cursor-pointer transition-all duration-300"
            style={{
              color: '#ffffff',
              border: '2px solid #ffffff',
              boxShadow: '0 0 4px #ffffff, 0 0 8px rgba(255, 255, 255, 0.5)',
              filter: 'drop-shadow(0 0 4px #ffffff)'
            }}
          >
            {social.icon}
          </motion.div>
        </a>
      ))}
    </div>
  );
};
