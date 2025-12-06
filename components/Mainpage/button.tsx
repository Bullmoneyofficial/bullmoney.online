import React from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging classes (if you don't have a global utils file)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Button = ({
  as: Tag = "button",
  variant = "primary",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary:
      "bg-neutral-900 text-neutral-50 shadow hover:bg-neutral-900/90 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90",
    secondary:
      "bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80",
    outline:
      "border border-neutral-200 bg-transparent shadow-sm hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
    ghost:
      "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
  };

  return (
    <Tag
      className={cn(baseStyles, variants[variant], className)}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </Tag>
  );
};