"use client";
import React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient" | "clear";
} & React.HTMLAttributes<HTMLElement>;

export const Button = ({
  href,
  as,
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) => {
  const baseStyles =
    "px-4 py-2 rounded-md bg-white text-black text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    secondary: "bg-transparent shadow-none dark:text-white",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgrgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
    
    // ✅ NEW CLEAR VARIANT ↓↓↓
    clear: "bg-transparent shadow-none text-inherit p-0",
  };

  const Component = (as ?? "a") as React.ElementType;
  const componentProps = {
    ...(href ? { href } : {}),
    className: cn(baseStyles, variantStyles[variant], className),
    ...props,
  } as React.HTMLAttributes<HTMLElement>;

  return React.createElement(Component, componentProps, children);
};
