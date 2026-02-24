"use client";

import React, { memo, useMemo, useCallback } from 'react';

// Performance optimization HOCs
export const MemoizedComponent = memo;

// Hook for stable callbacks
export const useStableCallback = (callback: (...args: any[]) => any) => {
  return useCallback(callback, []);
};

// Hook for stable values
export const useStableValue = (value: any) => {
  return useMemo(() => value, []);
};

// Virtual scrolling container for long lists
interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}

export const VirtualScroll: React.FC<VirtualScrollProps> = memo(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    return { start: Math.max(0, start - 1), end };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const handleScroll = useStableCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  });

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Optimized image component with lazy loading
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = useStableCallback(() => {
    setIsLoaded(true);
  });

  const handleError = useStableCallback(() => {
    setHasError(true);
  });

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && placeholder === 'blur' && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </div>
  );
});

// Debounced hook for performance
export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottle = (callback: (...args: any[]) => any, delay: number) => {
  const lastRan = React.useRef(Date.now());

  return useStableCallback((...args: any[]) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  });
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

// Preload hook for critical resources
export const usePreload = (src: string, as: string = 'image') => {
  React.useEffect(() => {
    if (!src) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = src;

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [src, as]);
};