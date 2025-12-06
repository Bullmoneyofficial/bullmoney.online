"use client";

import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { Button } from "./button";
import { Logo } from "./logo";
import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";

interface NavbarProps {
  navItems: { name: string; link: string | { pathname: string; query?: Record<string, string> } }[];
  visible: boolean;
}

export const Navbar = () => {
  // ✅ Center nav items — added Recruiter link here
  const navItems: NavbarProps["navItems"] = [
    { name: "Funded", link: "/#features" },
    { name: "Shop", link: { pathname: "/shop", query: { src: "nav" } } },
    { name: "Community", link: "/#pricing" },
    { name: "About", link: { pathname: "/about", query: { src: "nav" } } },
    { name: "Become a Recruiter", link: { pathname: "/recruit", query: { src: "nav" } } }, // 👈 NEW
  ];

  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => setVisible(latest > 100));

  return (
    <motion.div ref={ref} className="w-full fixed top-0 inset-x-0 z-50">
      <DesktopNav visible={visible} navItems={navItems} />
      <MobileNav visible={visible} navItems={navItems} />
    </motion.div>
  );
};

const DesktopNav = ({ navItems, visible }: NavbarProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const calOptions = useCalEmbed({
    namespace: CONSTANTS.CALCOM_NAMESPACE,
    styles: { branding: { brandColor: CONSTANTS.CALCOM_BRAND_COLOR } },
    hideEventTypeDetails: CONSTANTS.CALCOM_HIDE_EVENT_TYPE_DETAILS,
    layout: CONSTANTS.CALCOM_LAYOUT,
  });

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
          : "none",
        y: visible ? 20 : 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 50 }}
      className={cn(
        "hidden lg:flex items-center justify-between py-2 max-w-7xl mx-auto px-4 rounded-full relative z-[60] w-full",
        visible ? "bg-white/80 dark:bg-neutral-950/80" : "bg-transparent dark:bg-transparent"
      )}
    >
      <Logo />

      {/* Center nav links */}
      <div className="hidden lg:flex flex-1 items-center justify-center space-x-2 text-sm font-medium">
        {navItems.map((item, idx) => (
          <Link
            prefetch={false}
            onMouseEnter={() => setHovered(idx)}
            className="text-neutral-600 dark:text-neutral-300 relative px-4 py-2 hover:text-neutral-800 dark:hover:text-white transition"
            key={`link-${idx}`}
            href={item.link as any}
          >
            {hovered === idx && (
              <motion.div
                layoutId="hovered"
                className="w-full h-full absolute inset-0 bg-gray-100 dark:bg-neutral-800 rounded-full"
              />
            )}
            <span className="relative z-20">{item.name}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {!visible && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: [0, 0, 1] }}
              exit={{ x: 100, opacity: [0, 0, 0] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <Button
          data-cal-namespace={calOptions.namespace}
          data-cal-link={CONSTANTS.CALCOM_LINK}
          data-cal-config={{ layout: `${calOptions.layout}` }}
          as="button"
          variant="primary"
          className="hidden md:block"
        >
          Book a call
        </Button>
      </div>
    </motion.div>
  );
};

const MobileNav = ({ navItems, visible }: NavbarProps) => {
  const [open, setOpen] = useState(false);

  const calOptions = useCalEmbed({
    namespace: "chat-with-manu-demo",
    styles: { branding: { brandColor: "#000000" } },
    hideEventTypeDetails: false,
    layout: "month_view",
  });

  return (
    <>
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(10px)" : "none",
          boxShadow: visible
            ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
            : "none",
          width: visible ? "90%" : "100%",
          y: visible ? 20 : 0,
          borderRadius: open ? "4px" : "2rem",
        }}
        transition={{ type: "spring", stiffness: 200, damping: 50 }}
        className={cn(
          "flex relative flex-col lg:hidden w-full justify-between items-center bg-transparent max-w-[calc(100vw-2rem)] mx-auto px-0 py-2 z-50",
          visible && "bg-white/80 dark:bg-neutral-950/80"
        )}
      >
        <div className="flex flex-row justify-between items-center w-full">
          <Logo />
          <div className="flex items-center gap-2">
            {open ? (
              <IconX className="text-black dark:text-white" onClick={() => setOpen(!open)} />
            ) : (
              <IconMenu2 className="text-black dark:text-white" onClick={() => setOpen(!open)} />
            )}
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex rounded-lg absolute top-16 bg-white dark:bg-neutral-950 inset-x-0 z-50 flex-col items-start justify-start gap-4 w-full px-4 py-8 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            >
              {navItems.map((item, idx) => (
                <Link
                  prefetch={false}
                  key={`link-${idx}`}
                  href={item.link as any}
                  onClick={() => setOpen(false)}
                  className="relative text-neutral-600 dark:text-neutral-300"
                >
                  <motion.span className="block">{item.name}</motion.span>
                </Link>
              ))}

              <Button
                data-cal-namespace={calOptions.namespace}
                data-cal-link="bullmoney/15min"
                data-cal-config={{ layout: `${calOptions.layout}` }}
                as="button"
                onClick={() => setOpen(false)}
                variant="primary"
                className="block md:hidden w-full"
              >
                Book a call
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
