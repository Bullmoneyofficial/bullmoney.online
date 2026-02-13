"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Layers,
  Sparkles,
  Wand2,
  Download,
  Share2,
  Brush,
  PenTool,
  Image as ImageIcon,
  Type,
  Box,
  Zap,
  Monitor,
  Smartphone,
  Globe,
  ArrowRight,
  Check,
  Star,
  Layout,
  Figma,
  Grid3X3,
  CircleDot,
  Shapes,
  MousePointer2,
  Move,
  RotateCcw,
  Eye,
} from "lucide-react";

// ─── ANIMATION VARIANTS ────────────────────────────────────────
const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
};

// ─── TEMPLATE DATA ─────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "social-post",
    title: "Social Media Post",
    size: "1080 × 1080",
    category: "Social",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    border: "border-violet-500/20",
    icon: Smartphone,
  },
  {
    id: "story",
    title: "Instagram Story",
    size: "1080 × 1920",
    category: "Social",
    gradient: "from-rose-500/20 to-orange-500/20",
    border: "border-rose-500/20",
    icon: Smartphone,
  },
  {
    id: "youtube-thumb",
    title: "YouTube Thumbnail",
    size: "1280 × 720",
    category: "Video",
    gradient: "from-red-500/20 to-pink-500/20",
    border: "border-red-500/20",
    icon: Monitor,
  },
  {
    id: "presentation",
    title: "Presentation",
    size: "1920 × 1080",
    category: "Business",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20",
    icon: Monitor,
  },
  {
    id: "logo",
    title: "Logo Design",
    size: "500 × 500",
    category: "Branding",
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    icon: Sparkles,
  },
  {
    id: "banner",
    title: "Web Banner",
    size: "1200 × 628",
    category: "Marketing",
    gradient: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/20",
    icon: Globe,
  },
  {
    id: "poster",
    title: "Event Poster",
    size: "2480 × 3508",
    category: "Print",
    gradient: "from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/20",
    icon: ImageIcon,
  },
  {
    id: "business-card",
    title: "Business Card",
    size: "1050 × 600",
    category: "Print",
    gradient: "from-slate-400/20 to-zinc-500/20",
    border: "border-slate-400/20",
    icon: Layout,
  },
];

type DesignSectionsProps = {
  /** Optional DOM id to scroll to when launching the Design Studio. */
  scrollTargetId?: string;
  /** When true, emit CustomEvents to control the Design Studio. */
  enableStudioEvents?: boolean;
};

// ─── FEATURES DATA ─────────────────────────────────────────────
const FEATURES = [
  {
    icon: Layers,
    title: "Multi-Engine Canvas",
    description:
      "Switch between 11 rendering engines — Fabric.js, Konva, Three.js, PixiJS, Excalidraw, TLDraw and more.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: PenTool,
    title: "Vector & Raster Tools",
    description:
      "Draw precise vector paths, freehand sketches, or import raster images and apply filters instantly.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Type,
    title: "Rich Typography",
    description:
      "Add and style text with full control over fonts, size, weight, spacing, and alignment.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Shapes,
    title: "Shape Library",
    description:
      "Rectangles, circles, triangles, lines, and custom shapes with fill, stroke, and opacity controls.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Move,
    title: "Layer Management",
    description:
      "Full layer panel with reordering, visibility, duplication, and alignment tools.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Download,
    title: "Multi-Format Export",
    description:
      "Export as PNG, SVG, or save/load JSON project files to continue editing later.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: RotateCcw,
    title: "Undo & Redo",
    description:
      "Full history system with unlimited undo/redo so you never lose your progress.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Grid3X3,
    title: "Snap Grid & Guides",
    description:
      "Toggle grid overlay for pixel-perfect alignment and consistent spacing across your designs.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
];

// ─── SHOWCASE / PORTFOLIO DATA ──────────────────────────────────
const SHOWCASE = [
  {
    title: "Brand Identity Kit",
    tags: ["Logo", "Colors", "Typography"],
    gradient: "from-violet-600 to-indigo-600",
  },
  {
    title: "Social Media Campaign",
    tags: ["Instagram", "Reels", "Stories"],
    gradient: "from-rose-600 to-pink-600",
  },
  {
    title: "Product Mockups",
    tags: ["3D", "Packaging", "Web"],
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    title: "UI Kit Components",
    tags: ["Buttons", "Cards", "Forms"],
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    title: "Illustration Series",
    tags: ["Vector", "Characters", "Scenes"],
    gradient: "from-amber-600 to-orange-600",
  },
  {
    title: "Print Materials",
    tags: ["Poster", "Flyer", "Brochure"],
    gradient: "from-fuchsia-600 to-purple-600",
  },
];

// ─── TOOLS HIGHLIGHT ────────────────────────────────────────────
const TOOLS = [
  { icon: MousePointer2, label: "Select" },
  { icon: PenTool, label: "Pen" },
  { icon: Brush, label: "Brush" },
  { icon: Type, label: "Text" },
  { icon: Box, label: "Shapes" },
  { icon: ImageIcon, label: "Image" },
  { icon: Wand2, label: "Effects" },
  { icon: Eye, label: "Preview" },
];

type EngineEditorType =
  | "fabric"
  | "konva"
  | "paper"
  | "p5"
  | "two"
  | "three"
  | "pixi"
  | "excalidraw"
  | "tldraw"
  | "drawing"
  | "html5";

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DesignSections({ scrollTargetId = "design-studio", enableStudioEvents = true }: DesignSectionsProps) {
  const [visible, setVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Social", "Video", "Business", "Branding", "Marketing", "Print"];
  const filteredTemplates =
    activeCategory === "All"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  // Sync with StoreHeader toggle via localStorage + CustomEvent
  useEffect(() => {
    // Read initial value
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("store_show_design_sections");
      setVisible(stored !== "false");
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") {
        setVisible(detail);
      }
    };
    window.addEventListener("store_design_sections_toggle", handler);
    return () => window.removeEventListener("store_design_sections_toggle", handler);
  }, []);

  const scrollToStudio = useCallback(() => {
    if (typeof window === "undefined") return;

    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [scrollTargetId]);

  const dispatchStudioEvent = useCallback(
    (detail: { action: string; editorType?: EngineEditorType }) => {
      if (!enableStudioEvents || typeof window === "undefined") return;

      try {
        window.dispatchEvent(
          new CustomEvent("design_studio_control", {
            detail,
          })
        );
      } catch {
        // Best-effort: ignore if CustomEvent is not available
      }
    },
    [enableStudioEvents]
  );

  if (!visible) return null;

  return (
    <div className="design-sections">
      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section className="ds-hero">
        <motion.div {...fade} className="ds-hero-inner">
          <div className="ds-hero-badge">
            <Sparkles size={14} />
            <span>Design Studio</span>
          </div>
          <h1 className="ds-hero-title">
            Create Stunning<br />
            <span className="ds-hero-gradient">Visual Designs</span>
          </h1>
          <p className="ds-hero-subtitle">
            Professional-grade design tools right in your browser. Choose from
            11 rendering engines, dozens of templates, and powerful editing features.
          </p>
          <div className="ds-hero-actions">
            <button
              className="ds-btn ds-btn-primary"
              onClick={() => {
                dispatchStudioEvent({ action: "open" });
                scrollToStudio();
              }}
            >
              <Palette size={16} />
              Open Studio
            </button>
            <a href="#templates" className="ds-btn ds-btn-secondary">
              Browse Templates
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Floating tool icons */}
          <div className="ds-hero-tools">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={tool.label}
                className="ds-tool-float"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ scale: 1.15, y: -4 }}
              >
                <tool.icon size={18} />
                <span>{tool.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────── */}
      <section className="ds-section" id="features">
        <motion.div {...fade} className="ds-section-header">
          <h2 className="ds-section-title">Powerful Design Features</h2>
          <p className="ds-section-subtitle">
            Everything you need to bring your creative vision to life
          </p>
        </motion.div>

        <div className="ds-features-grid">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="ds-feature-card"
              {...stagger}
              transition={{ delay: i * 0.07, duration: 0.5 }}
            >
              <div className={`ds-feature-icon ${feature.bg}`}>
                <feature.icon size={22} className={feature.color} />
              </div>
              <h3 className="ds-feature-title">{feature.title}</h3>
              <p className="ds-feature-desc">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TEMPLATES SECTION ─────────────────────────────────── */}
      <section className="ds-section" id="templates">
        <motion.div {...fade} className="ds-section-header">
          <h2 className="ds-section-title">Start with a Template</h2>
          <p className="ds-section-subtitle">
            Pre-sized canvases for every platform and project type
          </p>
        </motion.div>

        <div className="ds-category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`ds-tab ${activeCategory === cat ? "ds-tab-active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="ds-templates-grid">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((tpl) => (
              <motion.div
                key={tpl.id}
                className={`ds-template-card ${tpl.border}`}
                onClick={() => {
                  dispatchStudioEvent({ action: "open" });
                  scrollToStudio();
                }}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <div className={`ds-template-preview bg-linear-to-br ${tpl.gradient}`}>
                  <tpl.icon size={32} className="opacity-40" />
                </div>
                <div className="ds-template-info">
                  <h4 className="ds-template-name">{tpl.title}</h4>
                  <span className="ds-template-size">{tpl.size}</span>
                </div>
                <span className="ds-template-badge">{tpl.category}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ── SHOWCASE / PORTFOLIO SECTION ──────────────────────── */}
      <section className="ds-section" id="showcase">
        <motion.div {...fade} className="ds-section-header">
          <h2 className="ds-section-title">Design Inspiration</h2>
          <p className="ds-section-subtitle">
            Explore what you can create with the Design Studio
          </p>
        </motion.div>

        <div className="ds-showcase-grid">
          {SHOWCASE.map((item, i) => (
            <motion.div
              key={item.title}
              className="ds-showcase-card"
              {...stagger}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              <div className={`ds-showcase-visual bg-linear-to-br ${item.gradient}`}>
                <div className="ds-showcase-overlay">
                  <Sparkles size={24} className="opacity-60" />
                </div>
              </div>
              <div className="ds-showcase-body">
                <h4 className="ds-showcase-title">{item.title}</h4>
                <div className="ds-showcase-tags">
                  {item.tags.map((tag) => (
                    <span key={tag} className="ds-showcase-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ENGINE COMPARISON SECTION ─────────────────────────── */}
      <section className="ds-section" id="engines">
        <motion.div {...fade} className="ds-section-header">
          <h2 className="ds-section-title">11 Rendering Engines</h2>
          <p className="ds-section-subtitle">
            Switch engines instantly — each optimized for different workflows
          </p>
        </motion.div>

        <div className="ds-engines-grid">
          {[
            { icon: "🎨", name: "Fabric.js", desc: "Professional vector design with full object manipulation", best: "General Design", editorType: "fabric" as EngineEditorType },
            { icon: "⚡", name: "Konva.js", desc: "High-performance 2D canvas for complex scenes", best: "Interactive Apps", editorType: "konva" as EngineEditorType },
            { icon: "📄", name: "Paper.js", desc: "Vector graphics scripting for precise paths", best: "Illustrations", editorType: "paper" as EngineEditorType },
            { icon: "🎛️", name: "P5.js", desc: "Creative coding for generative art", best: "Creative Coding", editorType: "p5" as EngineEditorType },
            { icon: "✨", name: "Two.js", desc: "Minimal 2D drawing API", best: "Quick Sketches", editorType: "two" as EngineEditorType },
            { icon: "🧊", name: "Three.js", desc: "3D WebGL engine for scenes and objects", best: "3D Design", editorType: "three" as EngineEditorType },
            { icon: "🪄", name: "PixiJS", desc: "Ultra-fast WebGL 2D renderer", best: "Animations", editorType: "pixi" as EngineEditorType },
            { icon: "🧩", name: "Excalidraw", desc: "Collaborative whiteboard with hand-drawn style", best: "Wireframing", editorType: "excalidraw" as EngineEditorType },
            { icon: "✍️", name: "TLDraw", desc: "Infinite canvas whiteboard", best: "Brainstorming", editorType: "tldraw" as EngineEditorType },
            { icon: "✏️", name: "Drawing", desc: "Pure HTML5 Canvas pen & eraser", best: "Quick Notes", editorType: "drawing" as EngineEditorType },
            { icon: "💾", name: "HTML5", desc: "Lightweight fallback mode", best: "Compatibility", editorType: "html5" as EngineEditorType },
          ].map((engine, i) => (
            <motion.div
              key={engine.name}
              className="ds-engine-card"
              onClick={() => {
                if (engine.editorType) {
                  dispatchStudioEvent({ action: "switch-engine", editorType: engine.editorType });
                  scrollToStudio();
                }
              }}
              {...stagger}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
            >
              <span className="ds-engine-icon">{engine.icon}</span>
              <div>
                <h4 className="ds-engine-name">{engine.name}</h4>
                <p className="ds-engine-desc">{engine.desc}</p>
                <span className="ds-engine-badge">{engine.best}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────── */}
      <section className="ds-cta">
        <motion.div {...fade} className="ds-cta-inner">
          <Palette size={40} className="text-white/80 mb-4" />
          <h2 className="ds-cta-title">Ready to Design?</h2>
          <p className="ds-cta-subtitle">
            Jump into the studio and start creating professional-quality graphics
            in minutes — no downloads, no sign-up required.
          </p>
          <button
            className="ds-btn ds-btn-primary ds-btn-large"
            onClick={() => {
              dispatchStudioEvent({ action: "open" });
              scrollToStudio();
            }}
          >
            <Zap size={18} />
            Launch Design Studio
          </button>
        </motion.div>
      </section>
    </div>
  );
}
