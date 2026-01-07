import type { Theme } from '@/components/Mainpage/ThemeComponents';

// ----------------------------------------------------------------------
// 1. DATA CONFIGURATION
// ----------------------------------------------------------------------
export const PAGE_CONFIG = [
  { 
    id: 1, 
    type: 'full', 
    scene: "/scene1.splinecode", 
    label: "HERO",
    encryptedTitle: "X39yRz1_HERO",
    infoTitle: "The Hero Moment",
    infoDesc: "This scene establishes the visual language. We use high-fidelity PBR textures and dramatic lighting to create an unforgettable first impression.",
    funFact: "Did you know? This scene renders at 60fps using advanced GPU optimization techniques!"
  },
  { 
    id: 2, 
    type: 'tsx',
    component: 'ChartNews',
    label: "NEWS",
    encryptedTitle: "N3ws_D4t4_F33d",
    infoTitle: "Latest Market Intelligence",
    infoDesc: "Real-time chart analysis and breaking news from the financial frontier.",
    funFact: "Our AI scans 10,000+ sources per second to bring you the most relevant updates!"
  },
  { 
    id: 3, 
    type: 'full', 
    scene: "/scene.splinecode", 
    label: "SHOWCASE",
    encryptedTitle: "Pr0duct_360_V1ew",
    infoTitle: "Product Showcase",
    infoDesc: "A 360-degree interactive view. Users can drag to rotate and explore every angle of our premium offerings.",
    funFact: "Each model contains over 2 million polygons for photorealistic detail!"
  },
  { 
    id: 4, 
    type: 'tsx',
    component: 'HeroMain',
    label: "VIP ACCESS",
    encryptedTitle: "V1P_Acc3ss_P0rt4l",
    infoTitle: "Exclusive VIP Experience",
    infoDesc: "Enter the world of premium membership. Unlock features that transform your trading journey.",
    funFact: "VIP members gain access to algorithms that predict market movements 72 hours in advance!"
  },
  { 
    id: 5, 
    type: 'full', 
    scene: "/scene3.splinecode", 
    label: "CONCEPT",
    encryptedTitle: "C0nc3pt_Abs7ract",
    infoTitle: "Conceptual Abstraction",
    infoDesc: "Pure form. Physics are ignored in favor of aesthetic balance. This is where art meets technology.",
    disableInteraction: true,
    funFact: "This scene was inspired by non-Euclidean geometry and M.C. Escher's impossible architectures!"
  },
  { 
    id: 6, 
    type: 'split', 
    sceneA: "/scene5.splinecode", 
    sceneB: "/scene4.splinecode", 
    labelA: "WIREFRAME", 
    labelB: "PROTOTYPE",
    encryptedTitle: "D3s1gn_Pr0c3ss",
    infoTitle: "The Split Process",
    infoDesc: "Drag the slider to compare low-fidelity wireframe vs high-fidelity prototype. Witness the transformation from concept to reality.",
    funFact: "This comparison shows 6 months of iterative design compressed into a single interactive moment!"
  },
  { 
    id: 7, 
    type: 'tsx',
    component: 'ProductsSection',
    label: "PRODUCTS",
    encryptedTitle: "Pr0d_C4t4l0g_X1",
    infoTitle: "Product Gallery",
    infoDesc: "Browse our curated collection of trading tools, signals, and automation systems.",
    funFact: "Our products have generated over $100M in combined user profits!"
  },
  { 
    id: 8, 
    type: 'full', 
    scene: "/scene2.splinecode", 
    label: "FINAL",
    encryptedTitle: "F1n4l_R3nd3r",
    infoTitle: "Production Ready",
    infoDesc: "Baked lighting and optimized geometry. Runs at 60fps on devices from 2018 onwards.",
    funFact: "We compressed 8GB of raw assets into just 12MB without quality loss!"
  },
  { 
    id: 9, 
    type: 'tsx',
    component: 'ShopScrollFunnel',
    label: "SHOP",
    encryptedTitle: "Sh0p_Funn3l_V2",
    infoTitle: "Shopping Experience",
    infoDesc: "A scroll-driven funnel that guides you through our offerings with precision.",
    funFact: "This funnel converts 3x better than traditional e-commerce layouts!"
  },
  { 
    id: 10, 
    type: 'full', 
    scene: "/scene6.splinecode", 
    label: "INTERACTIVE",
    encryptedTitle: "1nt3r4ct_M0de",
    infoTitle: "User Agency",
    infoDesc: "The final playground. Physics are enabled. Click, drag, and discover hidden interactions.",
    funFact: "Try throwing objects at 45°—there's a secret Easter egg waiting for you!"
  },
];

export const CRITICAL_SPLINE_SCENES = ["/scene1.splinecode", "/scene5.splinecode", "/scene4.splinecode"];
export const CRITICAL_SCENE_BLOB_MAP: Record<string, string> = {};

// --- FALLBACK THEME ---
export const FALLBACK_THEME: Partial<Theme> = {
  id: 'default',
  name: 'Loading...',
  filter: 'none',
  mobileFilter: 'none',
};

// --- THEME COLOR MAPPING ---
export const THEME_ACCENTS: Record<string, string> = {
  't01': '#3b82f6', // Blue
  't02': '#a855f7', // Purple
  't03': '#22c55e', // Green
  't04': '#ef4444', // Red
  't05': '#f59e0b', // Amber
  't06': '#ec4899', // Pink
  't07': '#06b6d4', // Cyan
  'default': '#3b82f6'
};

export const getThemeColor = (id: string) => THEME_ACCENTS[id] || THEME_ACCENTS['default'];
