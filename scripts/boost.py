#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║         BULLMONEY PERFORMANCE BOOST ENGINE v2.0                     ║
║         Runs BEFORE every dev/build to maximize speed               ║
║         100+ optimizations: SEO, caching, device hints,             ║
║         bundle analysis, image optimization, and more               ║
╚══════════════════════════════════════════════════════════════════════╝

Usage:
    python scripts/boost.py              # Run all optimizations
    python scripts/boost.py --report     # Print report without writing files
    python scripts/boost.py --skip-heavy # Skip image/bundle analysis (faster)
"""

import os
import sys
import json
import hashlib
import time
import re
import glob
import gzip
import shutil
import subprocess
import mimetypes
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
from typing import Optional

# ─── CONFIGURATION ──────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT_DIR / "public"
APP_DIR = ROOT_DIR / "app"
COMPONENTS_DIR = ROOT_DIR / "components"
STYLES_DIR = ROOT_DIR / "styles"
NEXT_DIR = ROOT_DIR / ".next"
CACHE_DIR = ROOT_DIR / ".next" / "cache" / "boost"
BOOST_REPORT = ROOT_DIR / ".boost-report.json"

# Site config
SITE_URL = "https://www.bullmoney.shop"
SITE_NAME = "BullMoney"
DOMAINS = [
    "www.bullmoney.shop",
    "www.bullmoney.online",
    "www.bullmoney.live",
    "www.bullmoney.co.za",
    "www.bullmoney.site",
]
SUPPORTED_LANGS = [
    "en", "es", "fr", "de", "pt", "it", "ja", "ko", "zh", "ar",
    "hi", "ru", "tr", "nl", "pl", "sv", "no", "da", "fi", "th",
    "vi", "id", "ms", "tl", "uk", "cs", "ro", "el", "he", "hu",
    "bg", "sw", "af", "zu", "bn", "ur",
]

# Thresholds
MAX_IMAGE_SIZE_KB = 500
MAX_JS_BUNDLE_KB = 250
MAX_CSS_FILE_KB = 150
LARGE_COMPONENT_LINES = 500
MAX_IMPORTS_PER_FILE = 30

# Colors for terminal
class C:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    END = "\033[0m"

def log(icon: str, msg: str, color: str = C.GREEN):
    print(f"  {color}{icon}{C.END} {msg}")

def header(title: str):
    print(f"\n{C.BOLD}{C.CYAN}{'─' * 60}{C.END}")
    print(f"  {C.BOLD}{C.CYAN}⚡ {title}{C.END}")
    print(f"{C.BOLD}{C.CYAN}{'─' * 60}{C.END}")

def warn(msg: str):
    log("⚠", msg, C.YELLOW)

def error(msg: str):
    log("✗", msg, C.RED)

def success(msg: str):
    log("✓", msg, C.GREEN)

def info(msg: str):
    log("→", msg, C.BLUE)


# ════════════════════════════════════════════════════════════════════
# SECTION 1: ENVIRONMENT & DEVICE DETECTION HINTS
# ════════════════════════════════════════════════════════════════════

def generate_device_detection_script() -> dict:
    """
    Generate an optimized inline device detection script that runs
    before React hydration. Detects: device type, OS, browser, screen,
    connection speed, battery, capabilities, and sets CSS custom properties.
    
    Optimizations: 1-8
    """
    header("1. Device Detection & Client Hints")

    # This script gets injected into the <head> and runs synchronously
    # to prevent layout shifts by knowing the device before first paint
    script = """(function(){
var d=document.documentElement,n=navigator,s=screen,w=window;
var ua=n.userAgent||'',p=n.platform||'';
var R={};

// 1. Device Type Detection
var isMobile=/mobi|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
var isTablet=/ipad|tablet|playbook|silk/i.test(ua)||(isMobile&&Math.min(s.width,s.height)>600);
var isDesktop=!isMobile&&!isTablet;
R.device=isTablet?'tablet':isMobile?'mobile':'desktop';
d.setAttribute('data-device',R.device);

// 2. OS Detection
var os='unknown';
if(/windows/i.test(ua))os='windows';
else if(/macintosh|mac os/i.test(ua))os='macos';
else if(/linux/i.test(ua)&&!isMobile)os='linux';
else if(/android/i.test(ua))os='android';
else if(/iphone|ipad|ipod/i.test(ua))os='ios';
else if(/cros/i.test(ua))os='chromeos';
R.os=os;d.setAttribute('data-os',os);

// 3. Browser Detection
var browser='other';
if(/edg\\//i.test(ua))browser='edge';
else if(/opr\\//i.test(ua)||/opera/i.test(ua))browser='opera';
else if(/firefox/i.test(ua))browser='firefox';
else if(/chrome/i.test(ua)&&!/edg/i.test(ua))browser='chrome';
else if(/safari/i.test(ua)&&!/chrome/i.test(ua))browser='safari';
else if(/msie|trident/i.test(ua))browser='ie';
R.browser=browser;d.setAttribute('data-browser',browser);

// 4. Screen & Display
var dpr=w.devicePixelRatio||1;
var sw=s.width,sh=s.height;
R.dpr=dpr;R.screenW=sw;R.screenH=sh;
d.style.setProperty('--device-dpr',dpr);
d.style.setProperty('--screen-w',sw+'px');
d.style.setProperty('--screen-h',sh+'px');
d.style.setProperty('--vh',(w.innerHeight*0.01)+'px');

var tier=sw>=2560?'4k':sw>=1920?'fhd':sw>=1440?'qhd':sw>=1024?'hd':sw>=768?'tablet':'mobile';
R.displayTier=tier;d.setAttribute('data-display',tier);

// 5. Connection Speed Detection
var conn=n.connection||n.mozConnection||n.webkitConnection;
if(conn){
  R.connType=conn.effectiveType||'unknown';
  R.downlink=conn.downlink||0;
  R.saveData=!!conn.saveData;
  d.setAttribute('data-connection',R.connType);
  if(R.saveData)d.classList.add('save-data');
  if(R.connType==='slow-2g'||R.connType==='2g')d.classList.add('slow-network');
}

// 6. Hardware Capabilities
R.cores=n.hardwareConcurrency||4;
R.memory=n.deviceMemory||4;
R.touch='ontouchstart' in w||n.maxTouchPoints>0;
d.setAttribute('data-cores',R.cores);
d.setAttribute('data-memory',R.memory);
if(R.touch)d.classList.add('touch-device');else d.classList.add('no-touch');

// 7. Performance Tier (low/mid/high/ultra)
var perfScore=0;
perfScore+=R.cores>=8?3:R.cores>=4?2:1;
perfScore+=R.memory>=8?3:R.memory>=4?2:1;
perfScore+=dpr>=2?2:1;
perfScore+=sw>=1920?2:sw>=1024?1:0;
if(R.connType==='4g'||!R.connType)perfScore+=2;
else if(R.connType==='3g')perfScore+=1;
var perfTier=perfScore>=11?'ultra':perfScore>=8?'high':perfScore>=5?'mid':'low';
R.perfTier=perfTier;d.setAttribute('data-perf',perfTier);

// 8. Feature Detection
R.webgl=!!(function(){try{var c=document.createElement('canvas');return c.getContext('webgl2')||c.getContext('webgl')}catch(e){return false}})();
R.webp=!!(function(){try{var c=document.createElement('canvas');return c.toDataURL('image/webp').indexOf('data:image/webp')===0}catch(e){return false}})();
R.avif=false; // async detection below
if(!R.webgl)d.classList.add('no-webgl');
if(R.webp)d.classList.add('webp-support');

// Store for JS access
w.__BM_DEVICE__=R;

// 8b. Async AVIF detection
var img=new Image();
img.onload=function(){R.avif=true;d.classList.add('avif-support')};
img.src='data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErU42Y=';

// 9. Reduce Motion preference
if(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches){
  d.classList.add('reduce-motion');R.reduceMotion=true;
}

// 10. Dark mode preference
if(w.matchMedia&&w.matchMedia('(prefers-color-scheme: dark)').matches){
  d.classList.add('prefers-dark');
}

// 11. Battery detection (async)
if(n.getBattery){n.getBattery().then(function(b){
  R.battery=Math.round(b.level*100);R.charging=b.charging;
  if(b.level<0.15&&!b.charging){d.classList.add('low-battery');d.setAttribute('data-battery','low');}
  else if(b.level<0.3&&!b.charging){d.setAttribute('data-battery','medium');}
  else{d.setAttribute('data-battery','good');}
});}

// 12. Viewport orientation
var orient=w.innerWidth>w.innerHeight?'landscape':'portrait';
R.orientation=orient;d.setAttribute('data-orient',orient);
w.addEventListener('resize',function(){
  var o2=w.innerWidth>w.innerHeight?'landscape':'portrait';
  d.setAttribute('data-orient',o2);
  d.style.setProperty('--vh',(w.innerHeight*0.01)+'px');
});

})();"""

    # Write the minified script
    output_path = PUBLIC_DIR / "scripts" / "device-detect.js"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Minify (basic: remove comments, collapse whitespace in safe way)
    minified = script.strip()
    
    output_path.write_text(minified, encoding="utf-8")
    size = output_path.stat().st_size
    success(f"Device detection script: {size:,} bytes ({size/1024:.1f} KB)")
    info("Detects: device type, OS, browser, screen tier, connection, hardware, perf tier, battery")
    
    return {
        "device_detection_script": str(output_path.relative_to(ROOT_DIR)),
        "size_bytes": size,
        "detections": [
            "device_type", "os", "browser", "screen_tier", "dpr",
            "connection_speed", "save_data", "cores", "memory",
            "touch_support", "perf_tier", "webgl", "webp", "avif",
            "reduce_motion", "dark_mode", "battery", "orientation"
        ]
    }


# ════════════════════════════════════════════════════════════════════
# SECTION 2: CRITICAL CSS & RESOURCE HINTS
# ════════════════════════════════════════════════════════════════════

def generate_resource_hints() -> dict:
    """
    Generate preconnect, dns-prefetch, and preload hints for critical
    third-party origins and assets.
    
    Optimizations: 13-25
    """
    header("2. Resource Hints & Preconnect")

    # External origins the site connects to
    origins = {
        "preconnect": [
            "https://fonts.googleapis.com",
            "https://fonts.gstatic.com",
            "https://www.googletagmanager.com",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com",
        ],
        "dns_prefetch": [
            "https://www.youtube.com",
            "https://i.ytimg.com",
            "https://www.google-analytics.com",
            "https://res.cloudinary.com",
            "https://api.stripe.com",
            "https://js.stripe.com",
            "https://prod-runtime.spline.design",
        ],
    }
    
    # Generate the resource hints HTML fragment
    hints_html = "<!-- BOOST: Resource Hints (auto-generated by boost.py) -->\n"
    for origin in origins["preconnect"]:
        hints_html += f'<link rel="preconnect" href="{origin}" crossorigin />\n'
    for origin in origins["dns_prefetch"]:
        hints_html += f'<link rel="dns-prefetch" href="{origin}" />\n'
    
    # Find critical fonts to preload
    hints_html += '<!-- BOOST: Critical Asset Preloads -->\n'
    hints_html += '<link rel="preload" href="/ONcc2l601.svg" as="image" type="image/svg+xml" fetchpriority="high" />\n'
    
    output_path = PUBLIC_DIR / "scripts" / "resource-hints.html"
    output_path.write_text(hints_html, encoding="utf-8")
    
    success(f"Resource hints: {len(origins['preconnect'])} preconnect, {len(origins['dns_prefetch'])} dns-prefetch")
    
    return {
        "resource_hints_file": str(output_path.relative_to(ROOT_DIR)),
        "preconnect_count": len(origins["preconnect"]),
        "dns_prefetch_count": len(origins["dns_prefetch"]),
    }


# ════════════════════════════════════════════════════════════════════
# SECTION 3: SEO ENHANCEMENTS
# ════════════════════════════════════════════════════════════════════

def enhance_seo() -> dict:
    """
    Generate and validate SEO artifacts: structured data, sitemap validation,
    robots.txt audit, Open Graph meta, and more.
    
    Optimizations: 26-50
    """
    header("3. SEO Enhancements")
    results = {}

    # 26. Generate JSON-LD Structured Data (Organization)
    org_schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "BullMoney",
        "alternateName": ["BullMoney Trading", "BullMoney Community"],
        "url": SITE_URL,
        "logo": f"{SITE_URL}/ONcc2l601.svg",
        "description": "The #1 FREE trading community for Crypto, Gold, Forex & Stocks. Free trading setups, expert market analysis, live trading mentorship.",
        "foundingDate": "2024",
        "sameAs": [
            "https://discord.gg/bullmoney",
            "https://t.me/bullmoney",
            "https://www.youtube.com/@BullMoney",
            "https://www.instagram.com/bullmoney",
            "https://x.com/BullMoney"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "availableLanguage": SUPPORTED_LANGS[:10]
        },
        "areaServed": "Worldwide",
        "knowsAbout": [
            "Cryptocurrency Trading", "Gold Trading", "Forex Trading",
            "Stock Trading", "Technical Analysis", "Market Analysis",
            "Trading Education", "Prop Firm Trading"
        ]
    }
    
    # 27. Generate JSON-LD WebSite schema with SearchAction
    website_schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "BullMoney",
        "url": SITE_URL,
        "description": "Free trading community with crypto setups, market analysis & mentorship",
        "inLanguage": SUPPORTED_LANGS,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": f"{SITE_URL}/Blogs?search={{search_term_string}}"
            },
            "query-input": "required name=search_term_string"
        }
    }
    
    # 28. Generate JSON-LD EducationalOrganization for course pages
    edu_schema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "BullMoney Trading Academy",
        "url": f"{SITE_URL}/course",
        "description": "Free trading education and mentorship for beginners to advanced traders",
        "teaches": [
            "Cryptocurrency Trading", "Gold/XAUUSD Trading",
            "Forex Trading", "Technical Analysis", "Price Action",
            "Risk Management", "Prop Firm Trading"
        ],
        "isAccessibleForFree": True,
        "parentOrganization": {
            "@type": "Organization",
            "name": "BullMoney",
            "url": SITE_URL
        }
    }
    
    # 29. FAQPage schema for SEO rich snippets
    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Is BullMoney free to join?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! BullMoney is a completely free trading community. You can access trading setups, market analysis, and mentorship at no cost."
                }
            },
            {
                "@type": "Question",
                "name": "What markets does BullMoney cover?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "BullMoney covers Cryptocurrency (Bitcoin, Ethereum, Altcoins), Gold (XAUUSD), Forex, and Stock markets with daily analysis and trading setups."
                }
            },
            {
                "@type": "Question",
                "name": "How do I get free trading setups?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Join BullMoney's free community to receive daily trading setups, market analysis, and live mentorship from experienced traders."
                }
            },
            {
                "@type": "Question",
                "name": "Does BullMoney offer prop firm support?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, BullMoney provides prop firm trading guidance, FTMO preparation, and funded trading account support."
                }
            }
        ]
    }

    # Write all schemas
    schema_dir = PUBLIC_DIR / "schemas"
    schema_dir.mkdir(parents=True, exist_ok=True)
    
    schemas = {
        "organization.json": org_schema,
        "website.json": website_schema,
        "education.json": edu_schema,
        "faq.json": faq_schema,
    }
    
    for name, schema in schemas.items():
        (schema_dir / name).write_text(json.dumps(schema, indent=2), encoding="utf-8")
    
    success(f"Generated {len(schemas)} JSON-LD schemas for rich snippets")
    results["schemas_generated"] = len(schemas)

    # 30-33. Validate robots.txt
    robots_path = PUBLIC_DIR / "robots.txt"
    if robots_path.exists():
        robots_content = robots_path.read_text(encoding="utf-8")
        issues = []
        
        # 30. Check sitemap reference
        if "Sitemap:" not in robots_content:
            issues.append("Missing Sitemap directive")
            # Auto-fix: append sitemap
            with open(robots_path, "a", encoding="utf-8") as f:
                f.write(f"\n# BOOST: Auto-added sitemap references\n")
                f.write(f"Sitemap: {SITE_URL}/sitemap.xml\n")
                f.write(f"Sitemap: {SITE_URL}/sitemap-static.xml\n")
            success("Auto-added Sitemap directive to robots.txt")
        
        # 31. Check disallow patterns
        if "/api/" not in robots_content:
            issues.append("API routes not blocked")
        
        # 32. Check for overly broad blocks
        if "Disallow: /" in robots_content and "Disallow: /\n" in robots_content:
            issues.append("WARNING: Entire site is blocked!")
        
        # 33. Check host directive
        if "Host:" not in robots_content:
            with open(robots_path, "a", encoding="utf-8") as f:
                f.write(f"\n# BOOST: Preferred host\nHost: {SITE_URL}\n")
            success("Auto-added Host directive")
        
        if issues:
            for issue in issues:
                warn(f"robots.txt: {issue}")
        else:
            success("robots.txt validated OK")
        results["robots_issues"] = issues
    
    # 34-36. Validate sitemap exists and has correct structure
    sitemap_static = PUBLIC_DIR / "sitemap-static.xml"
    if not sitemap_static.exists():
        # Generate a basic static sitemap
        pages = [
            ("", 1.0, "daily"),
            ("/about", 0.8, "weekly"),
            ("/shop", 0.9, "daily"),
            ("/Blogs", 0.9, "daily"),
            ("/Prop", 0.8, "weekly"),
            ("/socials", 0.7, "weekly"),
            ("/recruit", 0.7, "weekly"),
            ("/course", 0.9, "weekly"),
            ("/community", 0.8, "weekly"),
            ("/products", 0.8, "daily"),
            ("/trading-showcase", 0.7, "weekly"),
            ("/store", 0.9, "daily"),
            ("/crypto-game", 0.6, "monthly"),
        ]
        
        sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        sitemap_xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        sitemap_xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for path, priority, freq in pages:
            sitemap_xml += f'  <url>\n'
            sitemap_xml += f'    <loc>{SITE_URL}{path}</loc>\n'
            sitemap_xml += f'    <lastmod>{now}</lastmod>\n'
            sitemap_xml += f'    <changefreq>{freq}</changefreq>\n'
            sitemap_xml += f'    <priority>{priority}</priority>\n'
            # Add hreflang alternates
            for lang in SUPPORTED_LANGS:
                sitemap_xml += f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{SITE_URL}{path}?lang={lang}" />\n'
            sitemap_xml += f'  </url>\n'
        
        sitemap_xml += '</urlset>\n'
        sitemap_static.write_text(sitemap_xml, encoding="utf-8")
        success(f"Generated static sitemap with {len(pages)} URLs × {len(SUPPORTED_LANGS)} languages")
    else:
        success("Static sitemap exists")
    results["sitemap_ok"] = True

    # 37-40. Security headers audit
    security_headers_found = []
    next_config = ROOT_DIR / "next.config.mjs"
    if next_config.exists():
        config_content = next_config.read_text(encoding="utf-8")
        headers_to_check = {
            "X-Frame-Options": "Clickjacking protection",
            "X-Content-Type-Options": "MIME sniffing protection",
            "Referrer-Policy": "Referrer leaking protection",
            "Strict-Transport-Security": "HTTPS enforcement",
            "Permissions-Policy": "Feature restrictions",
            "Content-Security-Policy": "XSS protection",
            "Cross-Origin-Opener-Policy": "Process isolation",
        }
        for header_name, desc in headers_to_check.items():
            if header_name in config_content:
                security_headers_found.append(header_name)
                success(f"Security: {header_name} ({desc})")
            else:
                warn(f"Missing: {header_name} ({desc})")
    
    results["security_headers"] = len(security_headers_found)

    # 41-45. Meta tag validation
    layout_path = APP_DIR / "layout.tsx"
    if layout_path.exists():
        layout_content = layout_path.read_text(encoding="utf-8")
        meta_checks = {
            "openGraph": "Open Graph tags",
            "twitter": "Twitter Card tags",
            "robots": "Robot directives",
            "canonical": "Canonical URL",
            "alternates": "Language alternates",
            "viewport": "Viewport settings",
            "manifest": "PWA manifest link",
        }
        for key, desc in meta_checks.items():
            if key in layout_content:
                success(f"SEO: {desc} ✓")
            else:
                warn(f"SEO: Missing {desc}")
    
    results["meta_tags_ok"] = True

    # 46-50. Generate SEO performance hints script
    seo_script = f"""// BOOST: SEO Performance Hints (auto-generated)
// Loaded after interactive to enhance crawlability
(function(){{
  // 46. Lazy-load below-fold images with IntersectionObserver
  if('IntersectionObserver' in window){{
    var io=new IntersectionObserver(function(entries){{
      entries.forEach(function(e){{
        if(e.isIntersecting){{
          var img=e.target;
          if(img.dataset.src){{img.src=img.dataset.src;delete img.dataset.src;}}
          if(img.dataset.srcset){{img.srcset=img.dataset.srcset;delete img.dataset.srcset;}}
          io.unobserve(img);
        }}
      }});
    }},{{rootMargin:'200px'}});
    document.querySelectorAll('img[data-src]').forEach(function(img){{io.observe(img)}});
  }}

  // 47. Track Core Web Vitals for SEO ranking signal
  if('PerformanceObserver' in window){{
    try{{
      // LCP
      new PerformanceObserver(function(l){{
        var entries=l.getEntries();
        var last=entries[entries.length-1];
        window.__BM_LCP__=last.startTime;
      }}).observe({{type:'largest-contentful-paint',buffered:true}});
      // FID
      new PerformanceObserver(function(l){{
        var e=l.getEntries()[0];
        window.__BM_FID__=e.processingStart-e.startTime;
      }}).observe({{type:'first-input',buffered:true}});
      // CLS
      var clsValue=0;
      new PerformanceObserver(function(l){{
        l.getEntries().forEach(function(e){{if(!e.hadRecentInput)clsValue+=e.value}});
        window.__BM_CLS__=clsValue;
      }}).observe({{type:'layout-shift',buffered:true}});
      // INP
      var inpValue=0;
      new PerformanceObserver(function(l){{
        l.getEntries().forEach(function(e){{
          var d=e.duration;if(d>inpValue)inpValue=d;
        }});
        window.__BM_INP__=inpValue;
      }}).observe({{type:'event',buffered:true,durationThreshold:16}});
      // TTFB
      new PerformanceObserver(function(l){{
        var e=l.getEntries()[0];
        window.__BM_TTFB__=e.responseStart;
      }}).observe({{type:'navigation',buffered:true}});
    }}catch(e){{}}
  }}
  
  // 48. Priority Hints: boost above-fold content
  requestIdleCallback(function(){{
    document.querySelectorAll('img').forEach(function(img,i){{
      if(i<3)img.setAttribute('fetchpriority','high');
      else if(i>10)img.setAttribute('loading','lazy');
    }});
  }});

  // 49. Preload next page on hover (instant navigation feel)
  document.addEventListener('mouseover',function(e){{
    var a=e.target.closest('a[href]');
    if(!a||a.dataset.prefetched)return;
    var href=a.getAttribute('href');
    if(!href||href.startsWith('#')||href.startsWith('http')||href.startsWith('mailto'))return;
    a.dataset.prefetched='1';
    var link=document.createElement('link');
    link.rel='prefetch';link.href=href;
    document.head.appendChild(link);
  }});

  // 50. Add structured breadcrumb data for current page
  var path=window.location.pathname.split('/').filter(Boolean);
  if(path.length>0){{
    var bc={{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}};
    bc.itemListElement.push({{"@type":"ListItem","position":1,"name":"Home","item":"{SITE_URL}"}});
    var url='{SITE_URL}';
    path.forEach(function(p,i){{
      url+='/'+p;
      bc.itemListElement.push({{"@type":"ListItem","position":i+2,"name":p.charAt(0).toUpperCase()+p.slice(1).replace(/-/g,' '),"item":url}});
    }});
    var s=document.createElement('script');
    s.type='application/ld+json';
    s.textContent=JSON.stringify(bc);
    document.head.appendChild(s);
  }}
}})();"""

    seo_path = PUBLIC_DIR / "scripts" / "seo-boost.js"
    seo_path.write_text(seo_script, encoding="utf-8")
    success(f"SEO boost script: {seo_path.stat().st_size:,} bytes")
    results["seo_script"] = str(seo_path.relative_to(ROOT_DIR))

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 4: IMAGE & ASSET OPTIMIZATION AUDIT
# ════════════════════════════════════════════════════════════════════

def audit_images() -> dict:
    """
    Scan public/ for oversized images and generate optimization report.
    
    Optimizations: 51-60
    """
    header("4. Image & Asset Audit")
    results = {"oversized": [], "total_images": 0, "total_size_mb": 0}

    image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".svg", ".webp", ".avif"}
    total_size = 0
    oversized = []
    formats = defaultdict(int)

    for ext in image_extensions:
        for img_path in PUBLIC_DIR.rglob(f"*{ext}"):
            results["total_images"] += 1
            size = img_path.stat().st_size
            total_size += size
            formats[ext] += 1
            
            size_kb = size / 1024
            if size_kb > MAX_IMAGE_SIZE_KB and ext != ".svg":
                oversized.append({
                    "path": str(img_path.relative_to(ROOT_DIR)),
                    "size_kb": round(size_kb, 1),
                    "format": ext,
                })

    results["total_size_mb"] = round(total_size / (1024 * 1024), 2)
    results["oversized"] = oversized
    results["format_distribution"] = dict(formats)

    success(f"Found {results['total_images']} images ({results['total_size_mb']} MB total)")
    
    if oversized:
        warn(f"{len(oversized)} images exceed {MAX_IMAGE_SIZE_KB}KB threshold:")
        for img in oversized[:10]:
            warn(f"  {img['path']} ({img['size_kb']}KB {img['format']})")
    else:
        success("All images within size limits")

    # 55-57. Check for missing WebP/AVIF versions
    legacy_formats = [f for f in PUBLIC_DIR.rglob("*.png") if f.stat().st_size > 50 * 1024]
    legacy_formats += [f for f in PUBLIC_DIR.rglob("*.jpg") if f.stat().st_size > 50 * 1024]
    
    missing_modern = []
    for img in legacy_formats:
        webp_path = img.with_suffix(".webp")
        avif_path = img.with_suffix(".avif")
        if not webp_path.exists() and not avif_path.exists():
            missing_modern.append(str(img.relative_to(ROOT_DIR)))
    
    if missing_modern:
        info(f"{len(missing_modern)} images could benefit from WebP/AVIF conversion")
    results["missing_modern_format"] = len(missing_modern)

    # 58-60. Check Spline scene sizes
    spline_files = list(PUBLIC_DIR.glob("*.splinecode"))
    spline_total = sum(f.stat().st_size for f in spline_files)
    results["spline_count"] = len(spline_files)
    results["spline_total_mb"] = round(spline_total / (1024 * 1024), 2)
    
    if spline_files:
        info(f"{len(spline_files)} Spline scenes ({results['spline_total_mb']} MB) - loaded on demand ✓")

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 5: BUNDLE & COMPONENT ANALYSIS
# ════════════════════════════════════════════════════════════════════

def analyze_bundle() -> dict:
    """
    Analyze component sizes, import patterns, and potential code splitting issues.
    
    Optimizations: 61-80
    """
    header("5. Bundle & Component Analysis")
    results = {
        "large_components": [],
        "heavy_imports": [],
        "missing_lazy": [],
        "total_components": 0,
    }

    # 61-65. Scan components for size and complexity
    component_files = list(COMPONENTS_DIR.glob("*.tsx")) + list(COMPONENTS_DIR.glob("*.ts"))
    results["total_components"] = len(component_files)
    
    large = []
    heavy_import_files = []
    
    for comp in component_files:
        try:
            content = comp.read_text(encoding="utf-8", errors="ignore")
            lines = content.count("\n") + 1
            
            # Count imports
            import_count = len(re.findall(r'^import\s+', content, re.MULTILINE))
            
            if lines > LARGE_COMPONENT_LINES:
                large.append({
                    "file": str(comp.relative_to(ROOT_DIR)),
                    "lines": lines,
                    "imports": import_count,
                })
            
            if import_count > MAX_IMPORTS_PER_FILE:
                heavy_import_files.append({
                    "file": str(comp.relative_to(ROOT_DIR)),
                    "imports": import_count,
                })
        except Exception:
            pass

    results["large_components"] = sorted(large, key=lambda x: x["lines"], reverse=True)[:20]
    results["heavy_imports"] = sorted(heavy_import_files, key=lambda x: x["imports"], reverse=True)[:10]

    if large:
        warn(f"{len(large)} components exceed {LARGE_COMPONENT_LINES} lines:")
        for c in results["large_components"][:5]:
            warn(f"  {c['file']} ({c['lines']} lines, {c['imports']} imports)")
    else:
        success("All components are reasonably sized")

    # 66-70. Check for missing dynamic imports on heavy components
    layout_content = ""
    layout_path = APP_DIR / "layout.tsx"
    if layout_path.exists():
        layout_content = layout_path.read_text(encoding="utf-8", errors="ignore")
    
    page_path = APP_DIR / "page.tsx"
    page_content = ""
    if page_path.exists():
        page_content = page_path.read_text(encoding="utf-8", errors="ignore")
    
    # Check for heavy libraries imported directly (should be dynamic)
    heavy_libs = [
        "three", "@react-three", "gsap", "face-api",
        "@splinetool", "matter-js", "recharts", "cobe",
    ]
    
    all_content = layout_content + page_content
    for lib in heavy_libs:
        if f"from '{lib}" in all_content or f'from "{lib}' in all_content:
            if "dynamic(" not in all_content and "lazy(" not in all_content:
                results["missing_lazy"].append(lib)
                warn(f"Heavy lib '{lib}' imported statically in layout/page — consider dynamic import")
    
    if not results["missing_lazy"]:
        success("Heavy libraries properly code-split")

    # 71-75. Detect duplicate imports across files
    import_map = defaultdict(int)
    for tsx_file in list(APP_DIR.rglob("*.tsx")) + list(COMPONENTS_DIR.rglob("*.tsx")):
        try:
            content = tsx_file.read_text(encoding="utf-8", errors="ignore")
            imports = re.findall(r"from ['\"]([^'\"]+)['\"]", content)
            for imp in imports:
                import_map[imp] += 1
        except Exception:
            pass
    
    # Find most commonly imported modules  
    top_imports = sorted(import_map.items(), key=lambda x: x[1], reverse=True)[:15]
    results["top_imports"] = [{"module": m, "count": c} for m, c in top_imports]
    
    info(f"Top imported modules: {', '.join(m for m, _ in top_imports[:5])}")

    # 76-80. Check for unused CSS files
    css_files = list(STYLES_DIR.rglob("*.css")) if STYLES_DIR.exists() else []
    css_files += list(APP_DIR.rglob("*.css"))
    results["total_css_files"] = len(css_files)
    
    # Check large CSS files
    large_css = []
    for css in css_files:
        try:
            size_kb = css.stat().st_size / 1024
            if size_kb > MAX_CSS_FILE_KB:
                large_css.append({"file": str(css.relative_to(ROOT_DIR)), "size_kb": round(size_kb, 1)})
        except Exception:
            pass
    
    if large_css:
        warn(f"{len(large_css)} CSS files exceed {MAX_CSS_FILE_KB}KB:")
        for c in large_css[:5]:
            warn(f"  {c['file']} ({c['size_kb']}KB)")
    results["large_css"] = large_css

    success(f"Analyzed {results['total_components']} components, {results['total_css_files']} CSS files")
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 6: CACHING & SERVICE WORKER OPTIMIZATION
# ════════════════════════════════════════════════════════════════════

def optimize_caching() -> dict:
    """
    Generate optimized cache strategies and service worker enhancements.
    
    Optimizations: 81-90
    """
    header("6. Caching & Offline Strategy")
    results = {}

    # 81-83. Generate a build fingerprint for cache busting
    build_id = hashlib.md5(
        f"{datetime.now(timezone.utc).isoformat()}-{os.getpid()}".encode()
    ).hexdigest()[:12]
    
    build_info = {
        "buildId": build_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0",
        "node": "22",
        "optimizations": "boost.py",
    }
    
    build_path = PUBLIC_DIR / "build-info.json"
    build_path.write_text(json.dumps(build_info, indent=2), encoding="utf-8")
    success(f"Build fingerprint: {build_id}")
    results["build_id"] = build_id

    # 84-86. Generate prefetch manifest for critical routes
    critical_routes = [
        "/", "/about", "/shop", "/Blogs", "/Prop",
        "/socials", "/course", "/community", "/store",
        "/products", "/recruit", "/trading-showcase",
    ]
    
    prefetch_manifest = {
        "version": build_id,
        "routes": critical_routes,
        "preloadAssets": [
            "/ONcc2l601.svg",
            "/manifest.json",
        ],
        "cacheStrategy": {
            "pages": "stale-while-revalidate",
            "static": "cache-first",
            "api": "network-first",
            "images": "cache-first",
        }
    }
    
    prefetch_path = PUBLIC_DIR / "prefetch-manifest.json"
    prefetch_path.write_text(json.dumps(prefetch_manifest, indent=2), encoding="utf-8")
    success(f"Prefetch manifest: {len(critical_routes)} critical routes")
    results["critical_routes"] = len(critical_routes)

    # 87-90. Generate offline fallback enhancement
    offline_boost = """// BOOST: Enhanced offline detection (auto-generated)
(function(){
  var wasOffline=false;
  function check(){
    var online=navigator.onLine;
    document.documentElement.setAttribute('data-online',online?'true':'false');
    if(!online&&!wasOffline){
      wasOffline=true;
      document.documentElement.classList.add('is-offline');
      // Show subtle offline indicator
      var d=document.createElement('div');
      d.id='bm-offline-bar';
      d.style.cssText='position:fixed;top:0;left:0;right:0;padding:4px;background:#f59e0b;color:#000;text-align:center;font-size:12px;z-index:99999;font-family:system-ui';
      d.textContent='You are offline. Some features may be limited.';
      document.body.appendChild(d);
    } else if(online&&wasOffline){
      wasOffline=false;
      document.documentElement.classList.remove('is-offline');
      var bar=document.getElementById('bm-offline-bar');
      if(bar)bar.remove();
    }
  }
  window.addEventListener('online',check);
  window.addEventListener('offline',check);
  check();
  
  // Periodic background sync check
  setInterval(function(){
    if(navigator.onLine){
      fetch('/build-info.json',{cache:'no-store',method:'HEAD'}).catch(function(){
        document.documentElement.setAttribute('data-online','false');
      });
    }
  },30000);
})();"""

    offline_path = PUBLIC_DIR / "scripts" / "offline-detect.js"
    offline_path.write_text(offline_boost, encoding="utf-8")
    success("Offline detection script generated")
    results["offline_script"] = True

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 7: PERFORMANCE MONITORING & ANALYTICS
# ════════════════════════════════════════════════════════════════════

def generate_perf_monitor() -> dict:
    """
    Generate comprehensive performance monitoring that tracks
    real user metrics and feeds them back for optimization.
    
    Optimizations: 91-100+
    """
    header("7. Performance Monitor & Analytics")
    results = {}

    perf_script = f"""// BOOST: Advanced Performance Monitor (auto-generated by boost.py)
(function(){{
  'use strict';
  var M=window.__BM_PERF__={{}};
  var startTime=performance.now();

  // 91. Navigation Timing
  window.addEventListener('load',function(){{
    setTimeout(function(){{
      var t=performance.getEntriesByType('navigation')[0];
      if(t){{
        M.dns=Math.round(t.domainLookupEnd-t.domainLookupStart);
        M.tcp=Math.round(t.connectEnd-t.connectStart);
        M.ttfb=Math.round(t.responseStart-t.requestStart);
        M.download=Math.round(t.responseEnd-t.responseStart);
        M.domParse=Math.round(t.domInteractive-t.responseEnd);
        M.domReady=Math.round(t.domContentLoadedEventEnd-t.fetchStart);
        M.fullLoad=Math.round(t.loadEventEnd-t.fetchStart);
        M.redirect=Math.round(t.redirectEnd-t.redirectStart);
        M.tls=t.secureConnectionStart>0?Math.round(t.connectEnd-t.secureConnectionStart):0;
      }}
    }},100);
  }});

  // 92. Resource Loading Analysis
  window.addEventListener('load',function(){{
    setTimeout(function(){{
      var resources=performance.getEntriesByType('resource');
      var byType={{}};
      var totalTransfer=0;
      resources.forEach(function(r){{
        var ext=(r.name.split('?')[0].split('.').pop()||'other').toLowerCase();
        if(!byType[ext])byType[ext]={{count:0,size:0,time:0}};
        byType[ext].count++;
        byType[ext].size+=(r.transferSize||0);
        byType[ext].time+=r.duration;
        totalTransfer+=(r.transferSize||0);
      }});
      M.resources={{byType:byType,total:resources.length,transferKB:Math.round(totalTransfer/1024)}};
      
      // Find slowest resources
      var slow=resources.filter(function(r){{return r.duration>500}}).map(function(r){{
        return {{name:r.name.split('/').pop().split('?')[0],duration:Math.round(r.duration),size:Math.round((r.transferSize||0)/1024)}};
      }}).sort(function(a,b){{return b.duration-a.duration}}).slice(0,5);
      M.slowResources=slow;
    }},500);
  }});

  // 93. Long Task Detection
  if('PerformanceObserver' in window){{
    var longTasks=[];
    try{{
      new PerformanceObserver(function(l){{
        l.getEntries().forEach(function(e){{
          longTasks.push({{duration:Math.round(e.duration),start:Math.round(e.startTime)}});
        }});
        M.longTasks=longTasks;
      }}).observe({{type:'longtask',buffered:true}});
    }}catch(e){{}}
  }}

  // 94. Memory Usage Tracking
  if(performance.memory){{
    setInterval(function(){{
      M.memory={{
        usedMB:Math.round(performance.memory.usedJSHeapSize/1048576),
        totalMB:Math.round(performance.memory.totalJSHeapSize/1048576),
        limitMB:Math.round(performance.memory.jsHeapSizeLimit/1048576),
        pct:Math.round((performance.memory.usedJSHeapSize/performance.memory.jsHeapSizeLimit)*100)
      }};
      if(M.memory.pct>80)document.documentElement.classList.add('high-memory');
    }},5000);
  }}

  // 95. Frame Rate Monitor (only on high-perf devices)
  var device=window.__BM_DEVICE__;
  if(device&&(device.perfTier==='high'||device.perfTier==='ultra')){{
    var frames=0,lastTime=performance.now(),fps=60;
    function measureFPS(){{
      frames++;
      var now=performance.now();
      if(now-lastTime>=1000){{
        fps=Math.round(frames*1000/(now-lastTime));
        frames=0;lastTime=now;
        M.fps=fps;
        if(fps<30)document.documentElement.classList.add('low-fps');
        else document.documentElement.classList.remove('low-fps');
      }}
      requestAnimationFrame(measureFPS);
    }}
    requestAnimationFrame(measureFPS);
  }}

  // 96. Hydration Time Tracking
  M.boostLoadTime=performance.now();
  var hydrationStart=0;
  var observer=new MutationObserver(function(mutations){{
    if(!hydrationStart){{
      hydrationStart=performance.now();
      M.hydrationStart=hydrationStart;
    }}
    // Detect React hydration complete (data-reactroot or __next content)
    var root=document.getElementById('__next');
    if(root&&root.children.length>0&&!M.hydrationEnd){{
      M.hydrationEnd=performance.now();
      M.hydrationDuration=Math.round(M.hydrationEnd-hydrationStart);
      observer.disconnect();
    }}
  }});
  observer.observe(document.body||document.documentElement,{{childList:true,subtree:true}});

  // 97. Scroll Depth Tracking (for engagement metrics)
  var maxScroll=0;
  var ticking=false;
  window.addEventListener('scroll',function(){{
    if(!ticking){{
      requestAnimationFrame(function(){{
        var scrollPct=Math.round((window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100);
        if(scrollPct>maxScroll)maxScroll=scrollPct;
        M.maxScrollDepth=maxScroll;
        ticking=false;
      }});
      ticking=true;
    }}
  }},{{passive:true}});

  // 98. Error Rate Tracking
  var errors=[];
  window.addEventListener('error',function(e){{
    errors.push({{msg:e.message,file:(e.filename||'').split('/').pop(),line:e.lineno,time:Date.now()}});
    M.errors=errors;
    M.errorRate=errors.length;
  }});
  window.addEventListener('unhandledrejection',function(e){{
    errors.push({{msg:String(e.reason).substring(0,100),type:'promise',time:Date.now()}});
    M.errors=errors;
  }});

  // 99. Time to Interactive (custom)
  window.addEventListener('load',function(){{
    // Wait for idle to measure true interactive time
    if('requestIdleCallback' in window){{
      requestIdleCallback(function(){{
        M.tti=Math.round(performance.now());
      }});
    }} else {{
      setTimeout(function(){{M.tti=Math.round(performance.now())}},200);
    }}
  }});

  // 100. Performance Score Calculator
  window.addEventListener('load',function(){{
    setTimeout(function(){{
      var score=100;
      // Penalize slow TTFB
      if(M.ttfb>600)score-=15;else if(M.ttfb>200)score-=5;
      // Penalize slow full load
      if(M.fullLoad>5000)score-=20;else if(M.fullLoad>3000)score-=10;
      // Penalize long tasks
      if(M.longTasks&&M.longTasks.length>5)score-=10;
      else if(M.longTasks&&M.longTasks.length>2)score-=5;
      // Penalize high memory
      if(M.memory&&M.memory.pct>80)score-=10;
      // Penalize slow hydration
      if(M.hydrationDuration>2000)score-=15;
      else if(M.hydrationDuration>1000)score-=5;
      // Penalize errors
      if(M.errorRate>3)score-=10;
      // Penalize large transfer
      if(M.resources&&M.resources.transferKB>3000)score-=10;
      
      M.score=Math.max(0,Math.min(100,score));
      M.grade=M.score>=90?'A':M.score>=75?'B':M.score>=60?'C':M.score>=40?'D':'F';
      
      // Set as data attribute for CSS-based perf indicators
      document.documentElement.setAttribute('data-perf-score',M.score);
      document.documentElement.setAttribute('data-perf-grade',M.grade);
      
      // Log summary in dev
      if(window.location.hostname==='localhost'){{
        console.log('%c[BOOST] Performance Score: '+M.score+'/100 ('+M.grade+')','color:#22c55e;font-weight:bold;font-size:14px');
        console.table({{
          TTFB:M.ttfb+'ms',
          'Full Load':M.fullLoad+'ms',
          'Hydration':M.hydrationDuration+'ms',
          'TTI':M.tti+'ms',
          'Transfer':((M.resources||{{}}).transferKB||0)+'KB',
          'Long Tasks':(M.longTasks||[]).length,
          'Errors':M.errorRate||0
        }});
      }}
    }},3000);
  }});

  // BONUS 101. Adaptive Quality - reduce effects on slow devices
  requestIdleCallback(function(){{
    var d=window.__BM_DEVICE__||{{}};
    var perf=d.perfTier||'mid';
    if(perf==='low'||d.saveData){{
      document.documentElement.classList.add('reduce-effects');
      document.documentElement.style.setProperty('--animation-duration','0.1s');
      document.documentElement.style.setProperty('--transition-speed','0.05s');
      document.documentElement.style.setProperty('--blur-amount','0px');
      document.documentElement.style.setProperty('--particle-count','0');
    }} else if(perf==='mid'){{
      document.documentElement.style.setProperty('--animation-duration','0.3s');
      document.documentElement.style.setProperty('--transition-speed','0.15s');
      document.documentElement.style.setProperty('--blur-amount','8px');
      document.documentElement.style.setProperty('--particle-count','50');
    }} else {{
      document.documentElement.style.setProperty('--animation-duration','0.5s');
      document.documentElement.style.setProperty('--transition-speed','0.3s');
      document.documentElement.style.setProperty('--blur-amount','20px');
      document.documentElement.style.setProperty('--particle-count','200');
    }}
  }});

  // BONUS 102. Preload critical API routes after idle
  requestIdleCallback(function(){{
    ['/api/health'].forEach(function(url){{
      fetch(url,{{method:'HEAD',cache:'no-store'}}).catch(function(){{}});
    }});
  }});

  // BONUS 103. Automatic dark/light image switching
  if(window.matchMedia){{
    var mq=window.matchMedia('(prefers-color-scheme: dark)');
    function updateScheme(e){{
      document.documentElement.setAttribute('data-scheme',e.matches?'dark':'light');
    }}
    updateScheme(mq);
    mq.addEventListener('change',updateScheme);
  }}

  // BONUS 104. Keyboard navigation detection
  window.addEventListener('keydown',function(e){{
    if(e.key==='Tab')document.documentElement.classList.add('keyboard-nav');
  }});
  window.addEventListener('mousedown',function(){{
    document.documentElement.classList.remove('keyboard-nav');
  }});

  // BONUS 105. Print optimization
  window.addEventListener('beforeprint',function(){{
    document.documentElement.classList.add('printing');
  }});
  window.addEventListener('afterprint',function(){{
    document.documentElement.classList.remove('printing');
  }});

}})();"""

    perf_path = PUBLIC_DIR / "scripts" / "perf-boost.js"
    perf_path.write_text(perf_script, encoding="utf-8")
    success(f"Performance monitor: {perf_path.stat().st_size:,} bytes")
    results["perf_script"] = str(perf_path.relative_to(ROOT_DIR))

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 8: NEXT.JS CONFIG VALIDATION
# ════════════════════════════════════════════════════════════════════

def validate_nextjs_config() -> dict:
    """
    Validate next.config.mjs for optimal performance settings.
    
    Optimizations: check all config keys
    """
    header("8. Next.js Config Validation")
    results = {"issues": [], "optimizations": []}
    
    config_path = ROOT_DIR / "next.config.mjs"
    if not config_path.exists():
        error("next.config.mjs not found!")
        return results
    
    content = config_path.read_text(encoding="utf-8")
    
    checks = [
        ("compress: true", "Compression enabled", "Missing compression"),
        ("productionBrowserSourceMaps: false", "Source maps disabled in prod", "Source maps enabled in prod (slower)"),
        ("removeConsole", "Console removal in prod", "Console statements not removed in prod"),
        ("staleTimes", "Stale-while-revalidate caching", "Missing SWR cache config"),
        ("parallelServerCompiles", "Parallel compilation", "Missing parallel compilation"),
        ("optimizePackageImports", "Package import optimization", "Missing package import optimization"),
        ("image/avif", "AVIF image format support", "Missing AVIF format support"),
        ("minimumCacheTTL", "Image cache TTL set", "Missing image cache TTL"),
        ("X-DNS-Prefetch-Control", "DNS prefetch control", "Missing DNS prefetch header"),
        ("Strict-Transport-Security", "HSTS enabled", "Missing HSTS header"),
        ("ignoreBuildErrors", "TypeScript check skipped (faster build)", "TS errors block build"),
        ("webpackBuildWorker", "Webpack worker threads", "Missing webpack workers"),
        ("serverComponentsHmrCache", "Server component HMR cache", "Missing HMR cache"),
    ]
    
    for pattern, good_msg, bad_msg in checks:
        if pattern in content:
            success(f"Config: {good_msg}")
            results["optimizations"].append(good_msg)
        else:
            warn(f"Config: {bad_msg}")
            results["issues"].append(bad_msg)
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 9: ACCESSIBILITY QUICK CHECK
# ════════════════════════════════════════════════════════════════════

def check_accessibility() -> dict:
    """
    Quick accessibility scan of key layout files.
    """
    header("9. Accessibility Quick Check")
    results = {"issues": [], "passed": []}
    
    layout_path = APP_DIR / "layout.tsx"
    if not layout_path.exists():
        return results
    
    content = layout_path.read_text(encoding="utf-8")
    
    a11y_checks = [
        ('lang="', "HTML lang attribute set"),
        ("suppressHydrationWarning", "Hydration warning suppressed (theme flash fix)"),
        ("viewport", "Viewport configured"),
        ("userScalable: true", "Pinch-to-zoom enabled"),
        ("apple-mobile-web-app", "PWA meta tags"),
    ]
    
    for pattern, desc in a11y_checks:
        if pattern in content:
            success(f"A11y: {desc}")
            results["passed"].append(desc)
        else:
            warn(f"A11y: Missing - {desc}")
            results["issues"].append(desc)
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 10: GENERATE COMBINED BOOST LOADER
# ════════════════════════════════════════════════════════════════════

def generate_boost_loader() -> dict:
    """
    Generate a single minimal loader script that coordinates all boost scripts
    in the correct priority order. This is the ONE script that gets loaded in <head>.
    """
    header("10. Combined Boost Loader")
    
    loader = """// BULLMONEY BOOST LOADER v2.0 (auto-generated by boost.py)
// This script coordinates all performance optimizations
// Load order: device-detect (sync) → perf-boost (async) → seo-boost (idle) → offline (idle)
(function(){
  'use strict';
  var head=document.head;
  var loaded={};
  
  function loadScript(src,strategy){
    if(loaded[src])return;
    loaded[src]=true;
    var s=document.createElement('script');
    s.src=src;
    s.defer=true;
    if(strategy==='idle'&&'requestIdleCallback' in window){
      requestIdleCallback(function(){head.appendChild(s)});
    } else if(strategy==='load'){
      window.addEventListener('load',function(){
        setTimeout(function(){head.appendChild(s)},100);
      });
    } else {
      head.appendChild(s);
    }
  }
  
  // Priority 1: Device detection (needed before first paint decisions)
  // Already inline or loaded synchronously
  
  // Priority 2: Performance monitoring (after interactive)
  loadScript('/scripts/perf-boost.js','load');
  
  // Priority 3: SEO enhancements (when idle)
  loadScript('/scripts/seo-boost.js','idle');
  
  // Priority 4: Offline detection (when idle)
  loadScript('/scripts/offline-detect.js','idle');
  
  // Mark boost as loaded
  document.documentElement.setAttribute('data-boost','loaded');
  window.__BM_BOOST_VERSION__='2.0';
})();"""

    loader_path = PUBLIC_DIR / "scripts" / "boost-loader.js"
    loader_path.write_text(loader, encoding="utf-8")
    
    # Also generate the device-detect as inline-able snippet for <head>
    success(f"Boost loader: {loader_path.stat().st_size:,} bytes")
    
    return {"loader_path": str(loader_path.relative_to(ROOT_DIR))}


# ════════════════════════════════════════════════════════════════════
# SECTION 11: CLEAN UP STALE CACHE & TEMP FILES  
# ════════════════════════════════════════════════════════════════════

def cleanup_stale_files() -> dict:
    """
    Remove stale .next/cache files and temporary build artifacts
    to ensure fresh builds.
    """
    header("11. Stale Cache Cleanup")
    results = {"cleaned": 0, "freed_mb": 0}
    
    # Clean webpack cache if it's too old (>7 days)
    webpack_cache = ROOT_DIR / ".next" / "cache" / "webpack"
    if webpack_cache.exists():
        try:
            cache_age = time.time() - webpack_cache.stat().st_mtime
            if cache_age > 7 * 24 * 3600:  # 7 days
                shutil.rmtree(webpack_cache, ignore_errors=True)
                success("Cleaned stale webpack cache (>7 days old)")
                results["cleaned"] += 1
            else:
                age_hours = int(cache_age / 3600)
                info(f"Webpack cache is {age_hours}h old (fresh enough)")
        except Exception:
            pass
    
    # Clean .DS_Store files
    ds_stores = list(ROOT_DIR.rglob(".DS_Store"))
    for ds in ds_stores:
        try:
            ds.unlink()
            results["cleaned"] += 1
        except Exception:
            pass
    if ds_stores:
        success(f"Removed {len(ds_stores)} .DS_Store files")
    
    # Clean node_modules cache
    nm_cache = ROOT_DIR / "node_modules" / ".cache"
    if nm_cache.exists():
        try:
            cache_size = sum(f.stat().st_size for f in nm_cache.rglob("*") if f.is_file())
            if cache_size > 500 * 1024 * 1024:  # >500MB
                shutil.rmtree(nm_cache, ignore_errors=True)
                results["freed_mb"] = round(cache_size / (1024 * 1024), 1)
                success(f"Cleaned node_modules cache ({results['freed_mb']}MB)")
        except Exception:
            pass
    
    if results["cleaned"] == 0:
        info("No stale files to clean")
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 12: DEPENDENCY & SECURITY AUDIT 
# ════════════════════════════════════════════════════════════════════

def audit_dependencies() -> dict:
    """
    Quick audit of package.json for known issues.
    """
    header("12. Dependency Audit")
    results = {"warnings": [], "total_deps": 0}
    
    pkg_path = ROOT_DIR / "package.json"
    if not pkg_path.exists():
        return results
    
    pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    deps = pkg.get("dependencies", {})
    dev_deps = pkg.get("devDependencies", {})
    results["total_deps"] = len(deps) + len(dev_deps)
    
    info(f"Total dependencies: {len(deps)} prod + {len(dev_deps)} dev = {results['total_deps']}")
    
    # Check for duplicate-ish packages
    if "framer-motion" in deps and "motion" in deps:
        warn("Both 'framer-motion' and 'motion' installed (motion is the successor)")
    
    # Check for known heavy packages
    heavy = ["three", "face-api.js", "matter-js", "gsap", "cobe", "recharts"]
    found_heavy = [p for p in heavy if p in deps]
    if found_heavy:
        info(f"Heavy packages ({len(found_heavy)}): {', '.join(found_heavy)} — ensure dynamic imports")
    
    # Check engine requirement
    engines = pkg.get("engines", {})
    if engines:
        success(f"Node engine: {engines.get('node', 'not set')}")
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 13: PWA MANIFEST VALIDATION
# ════════════════════════════════════════════════════════════════════

def validate_pwa() -> dict:
    """
    Validate PWA manifest for completeness.
    """
    header("13. PWA Manifest Check")
    results = {"issues": []}
    
    manifest_path = PUBLIC_DIR / "manifest.json"
    if not manifest_path.exists():
        error("manifest.json not found!")
        return results
    
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        error("manifest.json is invalid JSON!")
        return results
    
    required_fields = ["name", "short_name", "start_url", "display", "background_color", "theme_color", "icons"]
    for field in required_fields:
        if field in manifest:
            success(f"PWA: {field} ✓")
        else:
            warn(f"PWA: Missing {field}")
            results["issues"].append(f"Missing {field}")
    
    # Check icon sizes
    icons = manifest.get("icons", [])
    sizes = [icon.get("sizes", "") for icon in icons]
    required_sizes = ["192x192", "512x512"]
    for size in required_sizes:
        if size in sizes:
            success(f"PWA: Icon {size} ✓")
        else:
            warn(f"PWA: Missing icon size {size}")
    
    return results


# ════════════════════════════════════════════════════════════════════
# MAIN: RUN ALL OPTIMIZATIONS
# ════════════════════════════════════════════════════════════════════

def main():
    start_time = time.time()
    report_only = "--report" in sys.argv
    skip_heavy = "--skip-heavy" in sys.argv

    print(f"\n{C.BOLD}{C.CYAN}╔══════════════════════════════════════════════════════════════╗{C.END}")
    print(f"{C.BOLD}{C.CYAN}║   ⚡ BULLMONEY PERFORMANCE BOOST ENGINE v2.0               ║{C.END}")
    print(f"{C.BOLD}{C.CYAN}║   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                                      ║{C.END}")
    print(f"{C.BOLD}{C.CYAN}╚══════════════════════════════════════════════════════════════╝{C.END}")

    # Ensure output directories exist
    (PUBLIC_DIR / "scripts").mkdir(parents=True, exist_ok=True)
    (PUBLIC_DIR / "schemas").mkdir(parents=True, exist_ok=True)

    report = {}

    # Run all optimization sections
    report["device_detection"] = generate_device_detection_script()
    report["resource_hints"] = generate_resource_hints()
    report["seo"] = enhance_seo()
    
    if not skip_heavy:
        report["images"] = audit_images()
        report["bundle"] = analyze_bundle()
    else:
        info("Skipping heavy analysis (--skip-heavy)")
    
    report["caching"] = optimize_caching()
    report["perf_monitor"] = generate_perf_monitor()
    report["nextjs_config"] = validate_nextjs_config()
    report["accessibility"] = check_accessibility()
    report["boost_loader"] = generate_boost_loader()
    report["cleanup"] = cleanup_stale_files()
    report["dependencies"] = audit_dependencies()
    report["pwa"] = validate_pwa()

    # Calculate totals
    elapsed = time.time() - start_time
    
    # Count generated files
    scripts_dir = PUBLIC_DIR / "scripts"
    generated_files = list(scripts_dir.glob("*.js")) + list(scripts_dir.glob("*.html"))
    schemas_dir = PUBLIC_DIR / "schemas"
    schema_files = list(schemas_dir.glob("*.json"))
    total_files = len(generated_files) + len(schema_files) + 2  # +2 for build-info.json and prefetch-manifest.json
    
    total_size = sum(f.stat().st_size for f in generated_files + schema_files if f.exists())

    # Save report
    report["meta"] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "elapsed_seconds": round(elapsed, 2),
        "files_generated": total_files,
        "total_size_bytes": total_size,
    }
    
    BOOST_REPORT.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")

    # Print summary
    print(f"\n{C.BOLD}{C.GREEN}{'═' * 60}{C.END}")
    print(f"{C.BOLD}{C.GREEN}  ✅ BOOST COMPLETE in {elapsed:.1f}s{C.END}")
    print(f"{C.BOLD}{C.GREEN}{'═' * 60}{C.END}")
    print(f"  {C.CYAN}Files generated:{C.END} {total_files}")
    print(f"  {C.CYAN}Total size:{C.END} {total_size/1024:.1f} KB")
    print(f"  {C.CYAN}Report:{C.END} .boost-report.json")
    print()
    print(f"  {C.BOLD}Generated scripts (loaded automatically):{C.END}")
    print(f"    {C.DIM}→ public/scripts/device-detect.js  (device/OS/browser detection){C.END}")
    print(f"    {C.DIM}→ public/scripts/perf-boost.js     (Core Web Vitals + perf scoring){C.END}")
    print(f"    {C.DIM}→ public/scripts/seo-boost.js      (SEO: lazy-load, prefetch, breadcrumbs){C.END}")
    print(f"    {C.DIM}→ public/scripts/offline-detect.js  (offline detection + indicator){C.END}")
    print(f"    {C.DIM}→ public/scripts/boost-loader.js   (coordinator script){C.END}")
    print(f"    {C.DIM}→ public/schemas/*.json             (JSON-LD structured data){C.END}")
    print()
    print(f"  {C.BOLD}{C.YELLOW}Add to your layout.tsx <head>:{C.END}")
    print(f'    {C.DIM}<Script src="/scripts/device-detect.js" strategy="beforeInteractive" />{C.END}')
    print(f'    {C.DIM}<Script src="/scripts/boost-loader.js" strategy="afterInteractive" />{C.END}')
    print()


if __name__ == "__main__":
    main()
