// ============================================================================
// DATABASE-DRIVEN EMAIL TEMPLATE RENDERER
// Converts email_templates table data into rendered HTML with full style customization
// ============================================================================

export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.shop';
const BRAND_BLUE = '#3b82f6';

// Default styles (can be overridden by template.styles)
export const DEFAULT_STYLES = {
  mode: 'dark' as 'dark' | 'light',
  colors: {
    primary: '#3b82f6',
    primaryDark: '#1d4ed8',
    background: '#000000',
    cardBg: '#111111',
    cardBgAlt: '#0a0a0a',
    border: '#222222',
    textPrimary: '#ffffff',
    textSecondary: '#e0e0e0',
    textMuted: '#888888',
    textDim: '#666666',
    link: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  darkMode: {
    background: '#000000',
    cardBg: '#111111',
    textPrimary: '#ffffff',
    textSecondary: '#e0e0e0',
  },
  lightMode: {
    background: '#ffffff',
    cardBg: '#f8f9fa',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    heroSize: '32px',
    headingSize: '18px',
    bodySize: '16px',
    smallSize: '14px',
    tinySize: '12px',
    lineHeight: '1.7',
  },
  spacing: {
    containerPadding: '40px',
    cardPadding: '24px',
    sectionGap: '24px',
    elementGap: '16px',
  },
  borders: {
    radius: '16px',
    radiusSmall: '12px',
    radiusTiny: '8px',
    width: '1px',
  },
  buttons: {
    primaryBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    primaryText: '#ffffff',
    primaryRadius: '12px',
    primaryPadding: '18px 48px',
    secondaryBg: 'transparent',
    secondaryBorder: '#3b82f6',
    secondaryText: '#3b82f6',
    secondaryRadius: '12px',
    secondaryPadding: '14px 40px',
  },
  hero: {
    iconBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    iconSize: '64px',
    iconRadius: '50%',
  },
  layout: {
    maxWidth: '600px',
    columns: 2,
    gridGap: '8px',
  },
};

export type EmailStyles = typeof DEFAULT_STYLES;

// Merge custom styles with defaults
function mergeStyles(customStyles?: Partial<EmailStyles>): EmailStyles {
  if (!customStyles) return DEFAULT_STYLES;
  
  return {
    mode: customStyles.mode || DEFAULT_STYLES.mode,
    colors: { ...DEFAULT_STYLES.colors, ...customStyles.colors },
    darkMode: { ...DEFAULT_STYLES.darkMode, ...customStyles.darkMode },
    lightMode: { ...DEFAULT_STYLES.lightMode, ...customStyles.lightMode },
    typography: { ...DEFAULT_STYLES.typography, ...customStyles.typography },
    spacing: { ...DEFAULT_STYLES.spacing, ...customStyles.spacing },
    borders: { ...DEFAULT_STYLES.borders, ...customStyles.borders },
    buttons: { ...DEFAULT_STYLES.buttons, ...customStyles.buttons },
    hero: { ...DEFAULT_STYLES.hero, ...customStyles.hero },
    layout: { ...DEFAULT_STYLES.layout, ...customStyles.layout },
  };
}

// Get active colors based on mode
function getActiveColors(styles: EmailStyles) {
  const modeColors = styles.mode === 'light' ? styles.lightMode : styles.darkMode;
  return {
    ...styles.colors,
    background: modeColors.background,
    cardBg: modeColors.cardBg,
    textPrimary: modeColors.textPrimary,
    textSecondary: modeColors.textSecondary,
  };
}

// Icon SVG mappings (inline for email compatibility)
const ICONS: Record<string, string> = {
  check: `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -55%) rotate(45deg); width: 12px; height: 22px; border-right: 4px solid #fff; border-bottom: 4px solid #fff;"></div>`,
  play: `<div style="width: 0; height: 0; border-left: 16px solid #fff; border-top: 10px solid transparent; border-bottom: 10px solid transparent; margin-left: 4px;"></div>`,
  crown: `<div style="position: absolute; top: 18px; left: 50%; transform: translateX(-50%); font-size: 24px; color: #fff;">👑</div>`,
  shopping: `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 16px; border: 3px solid #fff; border-radius: 4px;"></div>`,
  tag: `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 20px; color: #fff;">🏷️</div>`,
  dollar: `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; color: #fff;">💰</div>`,
  chart: `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 20px; color: #fff;">📈</div>`,
  mail: `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 20px; color: #fff;">✉️</div>`,
};

export interface EmailTemplateData {
  slug: string;
  name: string;
  subject: string;
  hero_title: string;
  hero_subtitle?: string;
  hero_icon?: string;
  content_blocks?: any[];
  primary_cta_text?: string;
  primary_cta_url?: string;
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  footer_text?: string;
  promo_code?: string;
  promo_description?: string;
  category?: string;
  is_active?: boolean;
  styles?: Partial<EmailStyles>;
}

// ============================================================================
// CONTENT BLOCK RENDERERS (with style support)
// ============================================================================

function renderHeading(block: { text: string }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  return `
    <h2 style="color: ${c.primary}; margin: ${s.spacing.sectionGap} 0 ${s.spacing.elementGap} 0; font-size: ${s.typography.headingSize}; text-transform: uppercase; letter-spacing: 1px;">
      ${block.text}
    </h2>
  `;
}

function renderParagraph(block: { text: string }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  return `
    <p style="color: ${c.textSecondary}; font-size: ${s.typography.bodySize}; line-height: ${s.typography.lineHeight}; margin: 0 0 ${s.spacing.elementGap} 0;">
      ${block.text}
    </p>
  `;
}

function renderList(block: { items: Array<{ title: string; desc?: string; color?: string; link?: string }> }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  const linkStyle = `color: ${c.link}; text-decoration: underline; font-weight: 600;`;
  const items = block.items.map(item => `
    <tr>
      <td style="padding: 14px 0; border-bottom: ${s.borders.width} solid ${c.border};">
        <div style="display: inline-block; width: 10px; height: 10px; background: ${item.color || c.primary}; border-radius: 50%; margin-right: 12px;"></div>
        ${item.link 
          ? `<a href="${SITE_URL}${item.link}" style="${linkStyle}">${item.title}</a>`
          : `<strong style="color: ${c.textPrimary};">${item.title}</strong>`
        }
        ${item.desc ? `<p style="color: ${c.textMuted}; margin: 4px 0 0 22px; font-size: 13px;">${item.desc}</p>` : ''}
      </td>
    </tr>
  `).join('');

  return `
    <div style="background: ${c.cardBgAlt || c.cardBg}; border-radius: ${s.borders.radius}; padding: ${s.spacing.cardPadding}; margin-bottom: ${s.spacing.sectionGap};">
      <table style="width: 100%; border-collapse: collapse;">
        ${items}
      </table>
    </div>
  `;
}

function renderBenefitsList(block: { items: Array<{ title: string; desc: string; color?: string }> }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  const items = block.items.map(item => `
    <tr>
      <td style="padding: 14px 0; border-bottom: ${s.borders.width} solid ${c.border};">
        <div style="display: inline-block; width: 10px; height: 10px; background: ${item.color || c.primary}; border-radius: 50%; margin-right: 12px;"></div>
        <strong style="color: ${c.textPrimary};">${item.title}</strong>
        <p style="color: ${c.textMuted}; margin: 4px 0 0 22px; font-size: 13px;">${item.desc}</p>
      </td>
    </tr>
  `).join('');

  return `
    <div style="background: ${c.cardBgAlt || c.cardBg}; border-radius: ${s.borders.radius}; padding: ${s.spacing.cardPadding}; margin-bottom: ${s.spacing.sectionGap}; text-align: left;">
      <table style="width: 100%; border-collapse: collapse;">
        ${items}
      </table>
    </div>
  `;
}

function renderProductsTable(block: { items: Array<{ name: string; price: string; oldPrice?: string; link?: string }> }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  const linkStyle = `color: ${c.link}; text-decoration: underline; font-weight: 600;`;
  const rows = block.items.map(p => `
    <tr>
      <td style="padding: 14px 0; border-bottom: ${s.borders.width} solid ${c.border};">
        <a href="${SITE_URL}${p.link || '/store'}" style="${linkStyle}">${p.name}</a>
      </td>
      <td style="padding: 14px 0; border-bottom: ${s.borders.width} solid ${c.border}; text-align: right;">
        ${p.oldPrice ? `<span style="color: ${c.textDim}; text-decoration: line-through; font-size: 13px; margin-right: 8px;">${p.oldPrice}</span>` : ''}
        <span style="color: ${c.primary}; font-weight: 700; font-size: ${s.typography.bodySize};">${p.price}</span>
      </td>
    </tr>
  `).join('');

  return `
    <div style="background: ${c.cardBgAlt || c.cardBg}; border-radius: ${s.borders.radiusSmall}; padding: 20px; margin-bottom: ${s.spacing.sectionGap};">
      <table style="width: 100%; border-collapse: collapse;">
        ${rows}
      </table>
    </div>
  `;
}

function renderPricingTiers(block: { items: Array<{ name: string; price: string; interval: string; featured?: boolean }> }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  const tiers = block.items.map(tier => `
    <td style="width: 33%; background: ${tier.featured ? `linear-gradient(135deg, ${c.cardBg}, ${c.cardBgAlt || c.cardBg})` : c.cardBg}; border: ${tier.featured ? `2px solid ${c.primary}` : `${s.borders.width} solid ${c.border}`}; border-radius: ${s.borders.radiusSmall}; padding: 16px; text-align: center;">
      <p style="color: ${tier.featured ? c.primary : c.textMuted}; margin: 0 0 4px 0; font-size: ${s.typography.tinySize};${tier.featured ? ' font-weight: 600;' : ''}">${tier.name}</p>
      <div style="font-size: 24px; font-weight: 700; color: ${c.primary};">${tier.price}</div>
      <p style="color: ${c.textDim}; margin: 0; font-size: 11px;">${tier.interval}</p>
    </td>
  `).join('');

  return `
    <table style="width: 100%; border-collapse: separate; border-spacing: ${s.layout.gridGap}; margin-bottom: ${s.spacing.sectionGap};">
      <tr>${tiers}</tr>
    </table>
  `;
}

function renderLinksGrid(block: { items: Array<{ title: string; subtitle: string; url: string }> }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  const rows: string[] = [];
  for (let i = 0; i < block.items.length; i += s.layout.columns) {
    const pair = block.items.slice(i, i + s.layout.columns);
    const cells = pair.map(item => `
      <td style="width: ${100 / s.layout.columns}%; background: ${c.cardBgAlt || c.cardBg}; border-radius: ${s.borders.radiusSmall}; padding: 20px; text-align: center;">
        <a href="${SITE_URL}${item.url}" style="text-decoration: none;">
          <div style="width: 40px; height: 40px; margin: 0 auto 12px; background: ${s.hero.iconBg}; border-radius: 10px;"></div>
          <p style="color: ${c.textPrimary}; margin: 0 0 4px 0; font-size: ${s.typography.bodySize}; font-weight: 600;">${item.title}</p>
          <p style="color: ${c.primary}; margin: 0; font-size: 13px;">${item.subtitle}</p>
        </a>
      </td>
    `).join('');
    rows.push(`<tr>${cells}</tr>`);
  }

  return `
    <table style="width: 100%; border-collapse: separate; border-spacing: ${s.layout.gridGap}; margin-bottom: ${s.spacing.sectionGap};">
      ${rows.join('')}
    </table>
  `;
}

function renderCategoriesGrid(block: { items: Array<{ name: string; price: string; link?: string }> }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  const rows: string[] = [];
  for (let i = 0; i < block.items.length; i += s.layout.columns) {
    const pair = block.items.slice(i, i + s.layout.columns);
    const cells = pair.map(item => `
      <td style="width: ${100 / s.layout.columns}%; background: ${c.cardBg}; border: ${s.borders.width} solid ${c.border}; border-radius: ${s.borders.radiusSmall}; padding: 20px; text-align: center;">
        <a href="${SITE_URL}${item.link || '/store'}" style="text-decoration: none;">
          <div style="width: 32px; height: 32px; margin: 0 auto 8px; background: ${c.border}; border-radius: ${s.borders.radiusTiny};"></div>
          <p style="color: ${c.textPrimary}; margin: 0; font-size: ${s.typography.smallSize};">${item.name}</p>
          <p style="color: ${BRAND_BLUE}; margin: 4px 0 0 0; font-size: 12px;">${item.price}</p>
        </a>
      </td>
    `).join('');
    rows.push(`<tr>${cells}</tr>`);
  }

  return `
    <table style="width: 100%; margin-top: ${s.spacing.sectionGap}; border-collapse: separate; border-spacing: 12px;">
      ${rows.join('')}
    </table>
  `;
}

function renderPromoCode(block: { code: string; desc?: string }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  return `
    <div style="background: linear-gradient(135deg, ${c.cardBg}, ${c.cardBgAlt || c.cardBg}); border: 2px dashed ${c.primary}; border-radius: ${s.borders.radiusSmall}; padding: 20px; text-align: center; margin-bottom: ${s.spacing.sectionGap};">
      <p style="color: ${c.textMuted}; margin: 0 0 8px 0; font-size: ${s.typography.smallSize};">${block.desc || 'Use code:'}</p>
      <div style="font-size: 28px; font-weight: 700; color: ${c.primary}; letter-spacing: 3px;">
        ${block.code}
      </div>
    </div>
  `;
}

function renderStatsGrid(block: { items: Array<{ label: string; value: string }> }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  const cells = block.items.map(item => `
    <td style="width: 25%; background: ${c.cardBg}; border: ${s.borders.width} solid ${c.border}; border-radius: ${s.borders.radiusTiny}; padding: 16px; text-align: center;">
      <div style="font-size: 20px; font-weight: 700; color: ${c.primary};">${item.value}</div>
      <p style="color: ${c.textMuted}; margin: 4px 0 0 0; font-size: 11px;">${item.label}</p>
    </td>
  `).join('');

  return `
    <table style="width: 100%; border-collapse: separate; border-spacing: ${s.layout.gridGap}; margin-bottom: ${s.spacing.sectionGap};">
      <tr>${cells}</tr>
    </table>
  `;
}

function renderTestimonial(block: { quote: string; author: string }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  return `
    <div style="background: ${c.cardBg}; border: ${s.borders.width} solid ${c.border}; border-radius: ${s.borders.radiusSmall}; padding: 20px; margin-top: ${s.spacing.sectionGap};">
      <p style="color: ${c.textSecondary}; font-style: italic; margin: 0 0 8px 0; font-size: ${s.typography.smallSize};">
        "${block.quote}"
      </p>
      <p style="color: ${c.primary}; margin: 0; font-size: 13px; font-weight: 600;">
        — ${block.author}
      </p>
    </div>
  `;
}

function renderCountdown(block: { text: string }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  return `
    <div style="background: linear-gradient(135deg, ${c.primary}22, ${c.primary}11); border: ${s.borders.width} solid ${c.primary}44; border-radius: ${s.borders.radiusSmall}; padding: 16px; text-align: center; margin-bottom: ${s.spacing.sectionGap};">
      <p style="color: ${c.primary}; margin: 0; font-size: ${s.typography.bodySize}; font-weight: 600;">${block.text}</p>
    </div>
  `;
}

function renderSection(block: { title: string; content: string }, s: EmailStyles, c: ReturnType<typeof getActiveColors>): string {
  return `
    <div style="background: ${c.cardBg}; border: ${s.borders.width} solid ${c.border}; border-radius: ${s.borders.radius}; padding: ${s.spacing.cardPadding}; margin-bottom: ${s.spacing.sectionGap};">
      <h3 style="color: ${c.primary}; margin: 0 0 12px 0; font-size: ${s.typography.bodySize};">${block.title}</h3>
      <p style="color: ${c.textSecondary}; margin: 0; font-size: ${s.typography.smallSize}; line-height: 1.6;">${block.content}</p>
    </div>
  `;
}

// Content block dispatcher
function renderContentBlock(block: any, styles: EmailStyles, colors: ReturnType<typeof getActiveColors>): string {
  switch (block.type) {
    case 'heading': return renderHeading(block, styles, colors);
    case 'paragraph': return renderParagraph(block, styles, colors);
    case 'list': return renderList(block, styles, colors);
    case 'benefits_list': return renderBenefitsList(block, styles, colors);
    case 'products_table': return renderProductsTable(block, styles, colors);
    case 'pricing_tiers': return renderPricingTiers(block, styles, colors);
    case 'links_grid': return renderLinksGrid(block, styles, colors);
    case 'categories_grid': return renderCategoriesGrid(block, styles, colors);
    case 'promo_code': return renderPromoCode(block, styles, colors);
    case 'stats_grid': return renderStatsGrid(block, styles, colors);
    case 'testimonial': return renderTestimonial(block, styles, colors);
    case 'countdown': return renderCountdown(block, styles, colors);
    case 'section': return renderSection(block, styles, colors);
    default: return '';
  }
}

// ============================================================================
// MAIN TEMPLATE RENDERER
// ============================================================================

export function renderEmailTemplate(
  template: EmailTemplateData,
  recipientEmail?: string,
  modeOverride?: 'dark' | 'light'
): { subject: string; html: string; styles: EmailStyles } {
  // Merge custom styles with defaults
  const styles = mergeStyles(template.styles);
  
  // Allow mode override for preview
  if (modeOverride) {
    styles.mode = modeOverride;
  }
  
  // Get active colors based on mode
  const colors = getActiveColors(styles);
  
  const firstName = recipientEmail 
    ? recipientEmail.split('@')[0].charAt(0).toUpperCase() + recipientEmail.split('@')[0].slice(1)
    : 'there';

  const unsubscribeUrl = recipientEmail
    ? `${SITE_URL}/api/store/unsubscribe?email=${encodeURIComponent(recipientEmail)}`
    : '#';

  // Render content blocks with styles
  const contentHtml = (template.content_blocks || [])
    .map(block => renderContentBlock(block, styles, colors))
    .join('');

  // Build hero section
  const heroIcon = ICONS[template.hero_icon || 'check'] || ICONS.check;
  
  const heroSection = `
    <div style="background: linear-gradient(135deg, ${colors.cardBg}, ${colors.cardBgAlt || colors.cardBg}); border: ${styles.borders.width} solid ${colors.border}; border-radius: 20px; padding: ${styles.spacing.containerPadding}; color: ${colors.textPrimary}; text-align: center;">
      <!-- Icon -->
      <div style="width: ${styles.hero.iconSize}; height: ${styles.hero.iconSize}; margin: 0 auto 20px; background: ${styles.hero.iconBg}; border-radius: ${styles.hero.iconRadius}; position: relative;">
        ${heroIcon}
      </div>
      
      <h1 style="margin: 0 0 16px 0; font-size: ${styles.typography.heroSize}; font-weight: 700; color: ${colors.textPrimary};">
        ${template.hero_title.replace('{firstName}', firstName)}
      </h1>
      
      ${template.hero_subtitle ? `
        <p style="color: ${colors.textSecondary}; font-size: 18px; line-height: ${styles.typography.lineHeight}; margin: 0 0 ${styles.spacing.sectionGap} 0;">
          ${template.hero_subtitle.replace('{firstName}', firstName)}
        </p>
      ` : ''}
      
      ${contentHtml}
      
      <!-- CTAs -->
      ${template.primary_cta_text ? `
        <div style="text-align: center; margin-top: ${styles.spacing.sectionGap};">
          <a href="${SITE_URL}${template.primary_cta_url || '/store'}" 
             style="display: inline-block; background: ${styles.buttons.primaryBg}; color: ${styles.buttons.primaryText}; padding: ${styles.buttons.primaryPadding}; 
                    text-decoration: none; border-radius: ${styles.buttons.primaryRadius}; font-weight: 600; font-size: 18px; margin-bottom: 12px;">
            ${template.primary_cta_text}
          </a>
          
          ${template.secondary_cta_text ? `
            <br>
            <a href="${SITE_URL}${template.secondary_cta_url || '/VIP'}" 
               style="display: inline-block; background: ${styles.buttons.secondaryBg}; border: 2px solid ${styles.buttons.secondaryBorder}; color: ${styles.buttons.secondaryText}; padding: ${styles.buttons.secondaryPadding}; 
                      text-decoration: none; border-radius: ${styles.buttons.secondaryRadius || styles.buttons.primaryRadius}; font-weight: 600; font-size: ${styles.typography.bodySize}; margin-top: 8px;">
              ${template.secondary_cta_text}
            </a>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;

  // Wrap with email template
  const fullHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>Bullmoney</title>
  <style type="text/css">
    /* Force dark mode everywhere */
    :root { 
      color-scheme: dark only !important; 
      supported-color-schemes: dark only !important;
      background-color: #000000 !important;
    }
    
    /* Base elements */
    html, body, .body-wrapper, .email-container, table, tr, td, div, p, span, a { 
      background-color: #000000 !important; 
    }
    
    /* Gmail Android/iOS dark mode */
    @media (prefers-color-scheme: dark) {
      html, body, .body-wrapper, .email-container, table, tr, td, div, p { 
        background-color: #000000 !important; 
        background: #000000 !important;
      }
      * { color-scheme: dark only !important; }
    }
    
    /* Gmail app specific - prevents auto color inversion */
    [data-ogsb] body,
    [data-ogsb] .body-wrapper,
    [data-ogsb] table,
    [data-ogsb] td,
    [data-ogsb] div { 
      background-color: #000000 !important; 
    }
    
    /* Gmail web dark mode */
    u + .body { background-color: #000000 !important; }
    u + .body .email-container { background-color: #000000 !important; }
    
    /* Yahoo Mail dark mode */
    [style*="color-scheme: dark"] .body-wrapper { background-color: #000000 !important; }
    
    /* Outlook.com dark mode */
    [data-ogsc] .body-wrapper { background-color: #000000 !important; }
    
    /* Apple Mail dark mode */
    @media (prefers-color-scheme: dark) {
      .darkmode { background-color: #000000 !important; }
    }
    
    /* Force black on iOS Gmail */
    * { -webkit-font-smoothing: antialiased !important; }
    
    /* Prevent Gmail from adding background */
    .gmail-fix { background-color: #000000 !important; min-width: 100% !important; }
  </style>
</head>
<body class="body-wrapper body darkmode gmail-fix" style="margin: 0 !important; padding: 0 !important; background-color: #000000 !important; background: #000000 !important; font-family: ${styles.typography.fontFamily}; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!--[if mso | IE]><table role="presentation" width="100%" bgcolor="#000000" style="background-color:#000000;"><tr><td><![endif]-->
  <div class="gmail-fix" style="background-color: #000000 !important; background: #000000 !important;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background-color: #000000 !important; background: #000000 !important; min-width: 100%;">
    <tr>
      <td align="center" bgcolor="#000000" style="background-color: #000000 !important; background: #000000 !important;">
        <table role="presentation" class="email-container" width="${parseInt(styles.layout.maxWidth)}" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="max-width: ${styles.layout.maxWidth}; background-color: #000000 !important; background: #000000 !important;">
          <tr>
            <td bgcolor="#000000" style="padding: ${styles.spacing.containerPadding} 20px; background-color: #000000 !important; background: #000000 !important;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${SITE_URL}" style="text-decoration: none;">
        <img src="cid:bullmoney-logo" alt="Bullmoney" width="60" height="60" style="width: 60px; height: 60px; border-radius: ${styles.borders.radius};" />
        <div style="margin-top: 8px; font-size: 20px; font-weight: 700; color: ${colors.textPrimary};">
          BULLMONEY
        </div>
      </a>
    </div>
    
    ${heroSection}
    
    <!-- Quick Links -->
    <div style="text-align: center; margin-top: 32px; padding: 20px; background: ${colors.cardBgAlt || colors.cardBg}; border-radius: ${styles.borders.radiusSmall};">
      <p style="color: ${colors.textMuted}; font-size: ${styles.typography.tinySize}; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Quick Links</p>
      <a href="${SITE_URL}/store" style="color: ${colors.primary}; text-decoration: none; margin: 0 12px; font-size: ${styles.typography.smallSize};">Store</a>
      <a href="${SITE_URL}/VIP" style="color: ${colors.primary}; text-decoration: none; margin: 0 12px; font-size: ${styles.typography.smallSize};">VIP</a>
      <a href="${SITE_URL}/course" style="color: ${colors.primary}; text-decoration: none; margin: 0 12px; font-size: ${styles.typography.smallSize};">Course</a>
      <a href="${SITE_URL}/recruit" style="color: ${colors.primary}; text-decoration: none; margin: 0 12px; font-size: ${styles.typography.smallSize};">Earn</a>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: ${styles.spacing.sectionGap}; padding-top: ${styles.spacing.sectionGap}; border-top: ${styles.borders.width} solid ${colors.border};">
      <div style="margin-bottom: 20px;">
        <a href="${SITE_URL}" style="text-decoration: none;">
          <img src="cid:bullmoney-footer" alt="Bullmoney" width="120" height="auto" style="max-width: 120px; height: auto;" />
        </a>
      </div>
      
      <div style="margin-bottom: 20px;">
        <a href="https://instagram.com/bullmoneyfx" style="color: ${colors.textDim}; text-decoration: none; margin: 0 8px;">Instagram</a>
        <a href="https://youtube.com/@bullmoneyfx" style="color: ${colors.textDim}; text-decoration: none; margin: 0 8px;">YouTube</a>
        <a href="https://discord.gg/bullmoney" style="color: ${colors.textDim}; text-decoration: none; margin: 0 8px;">Discord</a>
        <a href="https://t.me/bullmoneyfx" style="color: ${colors.textDim}; text-decoration: none; margin: 0 8px;">Telegram</a>
      </div>
      
      ${template.footer_text ? `<p style="color: ${colors.textMuted}; font-size: 13px; margin: 0 0 12px 0;">${template.footer_text}</p>` : ''}
      
      <p style="color: ${colors.textDim}; font-size: ${styles.typography.tinySize}; margin: 0 0 8px 0;">
        © ${new Date().getFullYear()} Bullmoney. All rights reserved.
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: ${colors.textDim}; font-size: ${styles.typography.tinySize}; text-decoration: underline;">
          Unsubscribe from emails
        </a>
      </p>
    </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  </div>
  <!--[if mso | IE]></td></tr></table><![endif]-->
</body>
</html>
  `;

  return {
    subject: template.subject.replace('{firstName}', firstName),
    html: fullHtml,
    styles,
  };
}

// ============================================================================
// HELPER: Get template from database and render
// ============================================================================

export async function getAndRenderTemplate(
  slug: string,
  recipientEmail?: string,
  modeOverride?: 'dark' | 'light'
): Promise<{ subject: string; html: string; styles: EmailStyles } | null> {
  try {
    const response = await fetch(
      `${SITE_URL}/api/email-templates?slug=${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) return null;
    
    const { data } = await response.json();
    if (!data) return null;
    
    return renderEmailTemplate(data, recipientEmail, modeOverride);
  } catch (error) {
    console.error('Failed to get and render template:', error);
    return null;
  }
}

export default renderEmailTemplate;
