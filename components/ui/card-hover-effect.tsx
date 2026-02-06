import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export type HoverEffectItem = {
  title: string;
  description: string;
  link: string;
};

export type HoverEffectProps<T> = {
  items: T[];
  className?: string;
  layout?: "grid" | "custom";
  containerStyle?: CSSProperties;
  itemClassName?: string;
  getItemClassName?: (item: T, index: number) => string | undefined;
  getItemStyle?: (item: T, index: number) => CSSProperties | undefined;
  getKey?: (item: T, index: number) => string | number;
  getLink?: (item: T, index: number) => string | undefined | null;
  renderItem?: (item: T, index: number) => ReactNode;
  onItemRef?: (index: number, el: HTMLDivElement | null) => void;
};

export const HoverEffect = <T,>({
  items,
  className,
  layout = "grid",
  containerStyle,
  itemClassName,
  getItemClassName,
  getItemStyle,
  getKey,
  getLink,
  renderItem,
  onItemRef,
}: HoverEffectProps<T>) => {
  let [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerClass = cn(
    layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10" : "",
    className
  );

  return (
    <div className={containerClass} style={containerStyle}>
      {items.map((item, idx) => {
        const link = getLink ? getLink(item, idx) : (item as HoverEffectItem)?.link;
        const key = getKey ? getKey(item, idx) : link ?? idx;
        const Wrapper = link ? "a" : "div";
        const wrapperProps = link ? { href: link } : {};
        const wrapperClass = cn(
          "relative group block h-full w-full",
          layout === "grid" ? "p-2" : "",
          itemClassName,
          getItemClassName?.(item, idx)
        );
        const content = renderItem ? (
          renderItem(item, idx)
        ) : (
          <Card>
            <CardTitle>{(item as HoverEffectItem).title}</CardTitle>
            <CardDescription>{(item as HoverEffectItem).description}</CardDescription>
          </Card>
        );

        return (
          <Wrapper
            {...wrapperProps}
            key={key}
            className={wrapperClass}
            style={{ ...getItemStyle?.(item, idx), overflow: 'visible', zIndex: hoveredIndex === idx ? 50 : 1, position: 'relative' as const }}
            ref={(el: HTMLElement | null) => {
              onItemRef?.(idx, el as HTMLDivElement | null);
            }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence key={`presence-${key}`} mode="wait">
              {hoveredIndex === idx && (
                <motion.span
                  key={`hover-${key}`}
                  className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/80 block rounded-3xl"
                  layoutId={`hoverBackground-${key}`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <div key={`content-${key}`} className="relative z-20 h-full w-full" style={{ zIndex: hoveredIndex === idx ? 9990 : 20 }}>{content}</div>
          </Wrapper>
        );
      })}
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl h-full w-full p-4 overflow-hidden bg-black border border-transparent dark:border-white/20 group-hover:border-slate-700 relative z-20",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <h4 className={cn("text-zinc-100 font-bold tracking-wide mt-4", className)}>
      {children}
    </h4>
  );
};
export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <p
      className={cn(
        "mt-8 text-zinc-400 tracking-wide leading-relaxed text-sm",
        className
      )}
    >
      {children}
    </p>
  );
};
