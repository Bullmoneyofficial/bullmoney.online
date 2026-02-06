'use client';

import { useTranslation } from '@/hooks/useTranslation';

// ============================================================================
// TRANSLATED TEXT COMPONENTS
// Drop-in replacements that auto-translate based on selected language.
// Google can read these because they render as real DOM text.
// ============================================================================

interface TProps {
  /** Translation key from DEFAULT_STRINGS */
  k: string;
  /** English fallback text (shown if no translation found) */
  children?: string;
  /** HTML element to render as */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'strong' | 'em' | 'label' | 'li';
  /** Pass-through className */
  className?: string;
  /** Template variables: { count: '5' } replaces {{count}} */
  vars?: Record<string, string | number>;
}

/**
 * Translatable text component.
 * 
 * Usage:
 *   <T k="common.addToCart">Add to Cart</T>
 *   <T k="product.onlyLeft" vars={{ count: 3 }}>Only 3 left</T>
 *   <T k="store.title" as="h1" className="text-2xl">Store</T>
 */
export function T({ k, children, as: Tag = 'span', className, vars }: TProps) {
  const { t } = useTranslation();
  
  let text = t(k, children || k);
  
  // Replace template variables
  if (vars) {
    Object.entries(vars).forEach(([key, value]) => {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    });
  }

  // Render the appropriate element
  switch (Tag) {
    case 'div': return <div className={className}>{text}</div>;
    case 'p': return <p className={className}>{text}</p>;
    case 'h1': return <h1 className={className}>{text}</h1>;
    case 'h2': return <h2 className={className}>{text}</h2>;
    case 'h3': return <h3 className={className}>{text}</h3>;
    case 'h4': return <h4 className={className}>{text}</h4>;
    case 'h5': return <h5 className={className}>{text}</h5>;
    case 'h6': return <h6 className={className}>{text}</h6>;
    case 'strong': return <strong className={className}>{text}</strong>;
    case 'em': return <em className={className}>{text}</em>;
    case 'label': return <label className={className}>{text}</label>;
    case 'li': return <li className={className}>{text}</li>;
    default: return <span className={className}>{text}</span>;
  }
}

/**
 * Hook-based translation for non-JSX contexts (titles, placeholders, aria-labels).
 * Re-exported for convenience.
 */
export { useTranslation } from '@/hooks/useTranslation';
