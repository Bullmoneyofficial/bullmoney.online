"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PREMIUM_THEME, GLASS_STYLES, MOBILE_OPTIMIZATIONS, Z_LAYERS } from "@/lib/premiumUISystem";

/**
 * Premium Shimmer Border - Universal component for premium aesthetic
 * Wraps any content with animated blue shimmer border
 */
export const PremiumShimmerBorder = ({
  children,
  className = "",
  borderRadius = "rounded-xl",
  borderWidth = "inset-[1.5px]",
  speed = 3,
  active = true,
  onClick,
  interactive = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
  borderWidth?: string;
  speed?: number;
  active?: boolean;
  onClick?: () => void;
  interactive?: boolean;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden",
        borderRadius,
        className,
        interactive && "cursor-pointer"
      )}
      style={style}
    >
      {/* Rotating shimmer gradient */}
      {active && (
        <motion.div
          className="absolute inset-[-100%] pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
          style={{ background: PREMIUM_THEME.SHIMMER_GRADIENT }}
        />
      )}

      {/* Inner mask with glass effect */}
      <div
        className={cn(
          "absolute bg-black flex items-center justify-center z-10",
          borderRadius,
          borderWidth
        )}
      />

      {/* Content */}
      <div className="relative z-20 h-full w-full">{children}</div>
    </div>
  );
};

/**
 * Premium Glass Button - Tap-friendly mobile button with premium styling
 */
export const PremiumButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  size = "md",
  fullWidth = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) => {
  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[40px]",
    md: "px-6 py-3 text-base min-h-[44px]",
    lg: "px-8 py-4 text-lg min-h-[48px]",
  };

  return (
    <PremiumShimmerBorder
      className={cn(
        "rounded-xl transition-all",
        fullWidth && "w-full",
        className
      )}
      active={!disabled && !loading}
    >
      <motion.button
        onClick={onClick}
        disabled={disabled || loading}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={cn(
          "relative w-full h-full flex items-center justify-center gap-2",
          "bg-linear-to-r from-blue-950/40 via-slate-950 to-neutral-950",
          "text-white font-bold uppercase tracking-wider",
          "hover:from-white/60 transition-all duration-300",
          "touch-manipulation",
          sizes[size],
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{
          WebkitTapHighlightColor: MOBILE_OPTIMIZATIONS.TAP_HIGHLIGHT,
          touchAction: MOBILE_OPTIMIZATIONS.TOUCH_ACTION,
        }}
      >
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/50 border-t-blue-400 rounded-full"
          />
        )}
        {children}
      </motion.button>
    </PremiumShimmerBorder>
  );
};

/**
 * Premium Panel - Glass panel with shimmer border for modals, sidebars, etc
 */
export const PremiumPanel = ({
  children,
  title,
  className = "",
  maxHeight = "max-h-[85vh]",
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
  maxHeight?: string;
}) => {
  return (
    <PremiumShimmerBorder className={cn("w-full", className)}>
      <div className={cn("rounded-xl overflow-hidden", maxHeight)}>
        <div className={cn(GLASS_STYLES.gradient, GLASS_STYLES.border, "p-6")}>
          {title && (
            <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </PremiumShimmerBorder>
  );
};

/**
 * Premium Badge - Status indicator with shimmer
 */
export const PremiumBadge = ({
  text,
  variant = "info",
  glowing = true,
  size = "md",
}: {
  text: string;
  variant?: "info" | "success" | "warning" | "error" | "blue";
  glowing?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const variantStyles = {
    info: "bg-white/20 text-white border-white/40",
    blue: "bg-white/20 text-white border-white/40",
    success: "bg-white/20 text-white border-white/40",
    warning: "bg-amber-500/20 text-amber-200 border-amber-500/40",
    error: "bg-red-500/20 text-red-200 border-red-500/40",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <div
      className={cn(
        "rounded-full font-bold uppercase tracking-widest",
        "border backdrop-blur-sm min-h-[32px] flex items-center",
        variantStyles[variant],
        sizeStyles[size],
        glowing && `shadow-[0_0_10px_${variant === "blue" || variant === "info" ? "rgba(255, 255, 255,0.3)" : "rgba(255, 255, 255,0.3)"}]`
      )}
    >
      {text}
    </div>
  );
};

/**
 * Premium Glass Card - Shimmer border + glass effect
 */
export const PremiumGlassCard = ({
  children,
  className = "",
  interactive = false,
  onClick,
  glowing = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  glowing?: boolean;
}) => {
  return (
    <PremiumShimmerBorder
      className={cn("rounded-xl", className)}
      onClick={onClick}
      interactive={interactive}
    >
      <div
        className={cn(
          "relative rounded-xl p-4 backdrop-blur-xl",
          GLASS_STYLES.gradient,
          GLASS_STYLES.border,
          interactive && "cursor-pointer hover:border-white/40 transition-colors",
          glowing && "shadow-lg shadow-white/20"
        )}
      >
        {children}
      </div>
    </PremiumShimmerBorder>
  );
};

/**
 * Mobile-Optimized Floating Button
 * Ensures 44px+ tap target on mobile
 */
export const PremiumFloatingButton = ({
  icon: Icon,
  label,
  onClick,
  className = "",
  variant = "primary",
  position = "bottom-right",
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}) => {
  const positionStyles = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <PremiumShimmerBorder
      className={cn(
        `fixed ${positionStyles[position]} z-[250]`,
        "w-16 h-16 rounded-full",
        className
      )}
      borderRadius="rounded-full"
      borderWidth="inset-[2px]"
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-full h-full rounded-full flex items-center justify-center group",
          "transition-all duration-300 touch-manipulation",
          variant === "primary"
            ? "bg-slate-950/80 hover:bg-slate-900/80"
            : "bg-slate-900/60 hover:bg-slate-800/60"
        )}
        style={{
          WebkitTapHighlightColor: MOBILE_OPTIMIZATIONS.TAP_HIGHLIGHT,
          touchAction: MOBILE_OPTIMIZATIONS.TOUCH_ACTION,
          minHeight: MOBILE_OPTIMIZATIONS.MIN_TAP_TARGET,
          minWidth: MOBILE_OPTIMIZATIONS.MIN_TAP_TARGET,
        }}
        title={label}
      >
        <Icon size={24} className="text-white group-hover:text-white transition-colors" />
      </motion.button>
    </PremiumShimmerBorder>
  );
};
