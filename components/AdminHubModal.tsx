"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import {
  BarChart3,
  ClipboardList,
  Crown,
  Database,
  Package,
  RefreshCw,
  Save,
  Shield,
  Video,
  X,
  ChevronDown,
  Edit,
  Trash2,
  GraduationCap,
  Users,
  HelpCircle,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";
import CourseAdminPanel from "@/components/CourseAdminPanel";
import AffiliateAdminPanel from "@/app/recruit/AffiliateAdminPanel";
import AdminAffiliateCalculator from "@/components/AdminAffiliateCalculator";

// Generate a reasonably unique id when inserting rows from the client
const safeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

type RowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  onEdit: () => void;
  onDelete: () => void;
};

const Row: React.FC<RowProps> = ({ title, subtitle, meta, onEdit, onDelete }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 gap-3">
    <div className="min-w-0 flex-1">
      <div className="text-white font-semibold text-sm truncate">{title}</div>
      {subtitle ? <div className="text-slate-300 text-xs truncate">{subtitle}</div> : null}
      {meta ? <div className="text-slate-400 text-[11px] truncate">{meta}</div> : null}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={onEdit}
        className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 border border-white/40 text-white transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

type TabButtonProps = {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

const TabButton: React.FC<TabButtonProps> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors flex-shrink-0 whitespace-nowrap scroll-snap-align-start ${
      active
        ? "border-white/70 bg-white/10 text-white"
        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
    }`}
    style={{ scrollSnapAlign: 'start' }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const ImagePreview: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  if (!src) return null;
  return (
    <div className="mt-1 rounded-md border border-slate-800 bg-slate-900/60 p-2">
      <div className="text-xs text-slate-400 mb-1">Preview</div>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full max-h-40 object-cover rounded-md border border-slate-800/60"
      />
    </div>
  );
};

const VideoPreview: React.FC<{ youtubeId?: string; title?: string; skipEmbed?: boolean }> = ({ youtubeId, title, skipEmbed }) => {
  if (!youtubeId) return null;
  const embed = `https://www.youtube.com/embed/${youtubeId}`;
  return (
    <div className="mt-1 rounded-md border border-slate-800 bg-slate-900/60 p-2 space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Video preview</span>
        <a
          href={`https://youtu.be/${youtubeId}`}
          target="_blank"
          rel="noreferrer"
          className="text-white hover:text-white"
        >
          Open
        </a>
      </div>
      {skipEmbed ? (
        <div className="aspect-video w-full overflow-hidden rounded-md border border-slate-800/60 bg-black flex items-center justify-center">
          <a
            href={`https://youtu.be/${youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="text-white hover:text-white text-sm"
          >
            Click to view video →
          </a>
        </div>
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded-md border border-slate-800/60 bg-black">
          <iframe
            src={embed}
            title={title || "Video"}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

const detectYouTubeId = (url?: string) => {
  if (!url) return "";
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
  return match ? match[1] : "";
};

const MediaAttachmentList: React.FC<{ attachments?: any[]; skipEmbed?: boolean }> = ({ attachments, skipEmbed }) => {
  if (!attachments || !attachments.length) return null;
  return (
    <div className="space-y-2">
      {attachments.map((att, idx) => {
        const url = typeof att === "string" ? att : att?.url || att?.href;
        if (!url) return null;
        const yt = detectYouTubeId(url);
        const isImage = /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.avif)$/i.test(url);
        return (
          <div key={`${url}-${idx}`} className="mt-1 rounded-md border border-slate-800 bg-slate-900/60 p-2">
            <div className="text-xs text-slate-400 mb-1 truncate">Attachment {idx + 1}</div>
            {yt ? (
              skipEmbed ? (
                <div className="aspect-video w-full overflow-hidden rounded-md border border-slate-800/60 bg-black flex items-center justify-center">
                  <a
                    href={`https://youtu.be/${yt}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-white text-sm"
                  >
                    Click to view video →
                  </a>
                </div>
              ) : (
                <div className="aspect-video w-full overflow-hidden rounded-md border border-slate-800/60 bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${yt}`}
                    title={`Attachment video ${idx + 1}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )
            ) : isImage ? (
              <img
                src={url}
                alt={`Attachment ${idx + 1}`}
                loading="lazy"
                className="w-full max-h-48 object-cover rounded-md border border-slate-800/60"
              />
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-white text-sm hover:text-white break-words"
              >
                {url}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CollapsiblePreview: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  if (!children) return null;
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 flex items-center justify-between text-sm text-slate-200"
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-300 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      {open ? <div className="px-3 pb-3">{children}</div> : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MAIN ADMIN HUB MODAL
// ---------------------------------------------------------------------------
export function AdminHubModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Mobile performance optimization
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminEmailEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() || "";
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [activeTab, setActiveTab] = useState<
    "products" | "services" | "livestream" | "analysis" | "recruits" | "course" | "affiliate" | "faq"
  >("products");
  const [affiliateView, setAffiliateView] = useState<"calculator" | "admin">("calculator");
  const [busy, setBusy] = useState(false);
  const isSyncing = useRef(false);
  const [toast, setToast] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pagemodeAuthorized, setPagemodeAuthorized] = useState(false);
  const [pagemodeChecked, setPagemodeChecked] = useState(false);
  const isAdmin = (authorized || pagemodeAuthorized) && (authChecked || pagemodeChecked);

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "0",
    category: "",
    imageUrl: "",
    buyUrl: "",
    visible: true,
    displayOrder: 0,
  });

  // VIP (bullmoney_vip)
  const [vipProducts, setVipProducts] = useState<any[]>([]);
  const [vipForm, setVipForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "0",
    imageUrl: "",
    buyUrl: "",
    comingSoon: false,
    sortOrder: 0,
    planOptions: "[]",
  });

  // Services
  const [services, setServices] = useState<any[]>([]);
  const [serviceForm, setServiceForm] = useState({
    id: "",
    title: "",
    description: "",
    icon_name: "",
    price: "",
    features: "",
    cta_text: "",
    cta_url: "",
    is_featured: false,
    is_visible: true,
    display_order: 0,
  });

  // Livestream
  const [videos, setVideos] = useState<any[]>([]);
  const [liveForm, setLiveForm] = useState({
    id: "",
    title: "",
    youtube_id: "",
    is_live: false,
    order_index: 0,
  });
  const [liveConfig, setLiveConfig] = useState({
    id: "",
    channel_url: "",
    current_video_id: "",
    is_live_now: false,
  });

  // Analysis
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [analysisForm, setAnalysisForm] = useState({
    id: "",
    title: "",
    content: "",
    market: "forex",
    direction: "neutral",
    pair: "",
    is_published: true,
  });

  // Recruits / VIP
  const [recruits, setRecruits] = useState<any[]>([]);
  const [recruitForm, setRecruitForm] = useState({
    id: "",
    email: "",
    status: "Pending",
    is_vip: false,
    commission_balance: "0",
    notes: "",
  });

  // FAQ Content
  const [faqCategories, setFaqCategories] = useState<any[]>([]);
  const [faqForm, setFaqForm] = useState({
    categoryId: "",
    categoryName: "",
    itemId: "",
    question: "",
    answer: "",
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);
  const showError = useCallback((msg: string) => {
    console.error(msg);
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadFaqFromDb = useCallback(async () => {
    const { data, error } = await supabase
      .from("faq_content")
      .select("content")
      .eq("id", "main")
      .single();
    if (error) {
      showError(`Load FAQ failed: ${error.message}`);
      return;
    }
    if (data?.content) {
      setFaqCategories(data.content);
      showToast("FAQ content loaded from database");
    }
  }, [supabase, showError, showToast]);

  const saveFaqToDb = useCallback(async () => {
    const payload = { id: "main", content: faqCategories, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from("faq_content")
      .upsert(payload, { onConflict: "id" });
    if (error) {
      showError(`Save FAQ failed: ${error.message}`);
      return;
    }
    showToast("FAQ content saved to database");
  }, [supabase, faqCategories, showError, showToast]);

  // -----------------------------------------------------------------------
  // AUTH GUARD - Only allow configured admin email
  // -----------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    const adminEmail = adminEmailEnv;
    const evaluate = (email?: string | null) => {
      if (!mounted) return;
      setAuthorized(Boolean(adminEmail) && email?.toLowerCase() === adminEmail);
    };
    const run = async () => {
      if (!adminEmail) {
        setAuthChecked(true);
        setAuthorized(false);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Auth session error", error.message);
      evaluate(data?.session?.user?.email || null);
      setAuthChecked(true);
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session?.user?.email || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [adminEmailEnv, supabase]);

  useEffect(() => {
    if (activeTab === "faq" && faqCategories.length === 0) {
      loadFaqFromDb();
    }
  }, [activeTab, faqCategories.length, loadFaqFromDb]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const evaluate = () => {
      try {
        const raw = localStorage.getItem("bullmoney_session");
        if (!raw) {
          setPagemodeAuthorized(false);
          setPagemodeChecked(true);
          return;
        }
        const parsed = JSON.parse(raw);
        const email = (parsed?.email || "").toLowerCase();
        const isAdminFlag = Boolean(parsed?.isAdmin);
        setPagemodeAuthorized(Boolean(adminEmailEnv) && (isAdminFlag || email === adminEmailEnv));
        setPagemodeChecked(true);
      } catch (err) {
        console.error("AdminHub pagemode session parse error", err);
        setPagemodeAuthorized(false);
        setPagemodeChecked(true);
      }
    };

    evaluate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bullmoney_session") evaluate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [adminEmailEnv]);

  const refreshProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) {
      setProducts(
        (data || []).map((p: any) => ({
          ...p,
          id: p._id || p.id,
          imageUrl: p.image_url,
          buyUrl: p.buy_url,
        }))
      );
    } else {
      showError(`Products load failed: ${error.message}`);
    }
  }, [supabase, showError]);

  const refreshVipProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("bullmoney_vip")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("price", { ascending: true });

    if (!error) {
      setVipProducts(
        (data || []).map((p: any) => ({
          ...p,
          planOptions: JSON.stringify(p.plan_options || [], null, 2),
        }))
      );
    } else {
      showError(`VIP load failed: ${error.message}`);
    }
  }, [supabase, showError]);

  const refreshServices = useCallback(async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error) setServices(data || []);
    else showError(`Services load failed: ${error.message}`);
  }, [supabase, showError]);

  const refreshLivestream = useCallback(async () => {
    const client = supabase;
    const { data: vids, error: vidsError } = await client
      .from("livestream_videos")
      .select("*")
      .order("order_index", { ascending: true });
    if (vidsError) showError(`Livestream videos failed: ${vidsError.message}`);
    const { data: cfg, error: cfgError } = await client
      .from("livestream_config")
      .select("*")
      .limit(1)
      .single();
    if (cfgError && cfgError.code !== "PGRST116") showError(`Livestream config failed: ${cfgError.message}`);

    setVideos(vids || []);
    if (cfg) {
      setLiveConfig({
        id: cfg.id,
        channel_url: cfg.channel_url || "",
        current_video_id: cfg.current_video_id || "",
        is_live_now: cfg.is_live_now === true || cfg.is_live_now === "true",
      });
    }
  }, [supabase]);

  const refreshAnalyses = useCallback(async () => {
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAnalyses(data || []);
    else showError(`Analyses load failed: ${error.message}`);
  }, [supabase, showError]);

  const refreshRecruits = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruits")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRecruits(data || []);
    else showError(`Recruits load failed: ${error.message}`);
  }, [supabase, showError]);

  const syncTick = useCallback(async () => {
    if (isSyncing.current) return; // Prevent overlapping fetches during rapid polling
    isSyncing.current = true;
    try {
      await Promise.all([
        refreshProducts(),
        refreshVipProducts(),
        refreshServices(),
        refreshLivestream(),
        refreshAnalyses(),
        refreshRecruits(),
      ]);
    } finally {
      isSyncing.current = false;
    }
  }, [refreshProducts, refreshVipProducts, refreshServices, refreshLivestream, refreshAnalyses, refreshRecruits]);

  const loadAll = useCallback(async () => {
    if (!isAdmin) {
      showError(adminEmailEnv ? `Unauthorized. Sign in as ${adminEmailEnv}.` : "Admin email not configured.");
      return;
    }
    setBusy(true);
    await syncTick();
    setBusy(false);
  }, [isAdmin, adminEmailEnv, syncTick, showError]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadAll();
    }
  }, [isOpen, isAdmin, loadAll]);

  // Auto-refresh every 1s while open (skip on mobile/low-end for better performance)
  useEffect(() => {
    if (!isOpen || !isAdmin || shouldSkipHeavyEffects) return;
    const id = setInterval(() => {
      syncTick();
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen, isAdmin, syncTick, shouldSkipHeavyEffects]);

  // -----------------------------------------------------------------------
  // CRUD HELPERS
  // -----------------------------------------------------------------------
  const upsertProduct = useCallback(async () => {
    const id = productForm.id || safeId();
    const payload = {
      _id: id,
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price || 0),
      category: productForm.category || "General",
      image_url: productForm.imageUrl,
      buy_url: productForm.buyUrl,
      visible: !!productForm.visible,
      display_order: Number(productForm.displayOrder || 0),
    } as any;

    const query = productForm.id
      ? supabase.from("products").update(payload).eq("_id", id)
      : supabase.from("products").insert(payload);

    const { error } = await query;
    if (!error) {
      showToast("Saved product");
      setProductForm({
        id: "",
        name: "",
        description: "",
        price: "0",
        category: "",
        imageUrl: "",
        buyUrl: "",
        visible: true,
        displayOrder: 0,
      });
      refreshProducts();
    } else {
      showError(`Save product failed: ${error.message}`);
    }
  }, [productForm, supabase, refreshProducts, showToast, showError]);

  const upsertVipProduct = useCallback(async () => {
    let parsedPlanOptions: any[] = [];
    try {
      parsedPlanOptions = vipForm.planOptions ? JSON.parse(vipForm.planOptions) : [];
      if (!Array.isArray(parsedPlanOptions)) throw new Error("Plan options must be a JSON array");
    } catch (err: any) {
      showError(`Plan options invalid: ${err?.message || err}`);
      return;
    }

    const payload: any = {
      name: vipForm.name,
      description: vipForm.description,
      price: Number(vipForm.price || 0),
      image_url: vipForm.imageUrl,
      buy_url: vipForm.buyUrl,
      coming_soon: !!vipForm.comingSoon,
      sort_order: Number(vipForm.sortOrder || 0),
      plan_options: parsedPlanOptions,
    };

    const query = vipForm.id
      ? supabase.from("bullmoney_vip").update(payload).eq("id", vipForm.id)
      : supabase.from("bullmoney_vip").insert(payload);

    const { error } = await query;
    if (!error) {
      showToast("Saved VIP item");
      setVipForm({
        id: "",
        name: "",
        description: "",
        price: "0",
        imageUrl: "",
        buyUrl: "",
        comingSoon: false,
        sortOrder: 0,
        planOptions: "[]",
      });
      refreshVipProducts();
    } else {
      showError(`Save VIP failed: ${error.message}`);
    }
  }, [vipForm, supabase, refreshVipProducts, showToast, showError]);

  const removeProduct = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("_id", id);
      if (error) showError(`Delete product failed: ${error.message}`);
      else refreshProducts();
    },
    [supabase, refreshProducts, showError]
  );

  const removeVipProduct = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("bullmoney_vip").delete().eq("id", id);
      if (error) showError(`Delete VIP failed: ${error.message}`);
      else refreshVipProducts();
    },
    [supabase, refreshVipProducts, showError]
  );

  const upsertService = useCallback(async () => {
    const id = serviceForm.id || safeId();
    const payload = {
      id,
      title: serviceForm.title,
      description: serviceForm.description,
      icon_name: serviceForm.icon_name,
      price: serviceForm.price,
      features: serviceForm.features ? serviceForm.features.split("|") : [],
      cta_text: serviceForm.cta_text,
      cta_url: serviceForm.cta_url,
      is_featured: !!serviceForm.is_featured,
      is_visible: !!serviceForm.is_visible,
      display_order: Number(serviceForm.display_order || 0),
    };

    const query = serviceForm.id
      ? supabase.from("services").update(payload).eq("id", id)
      : supabase.from("services").insert(payload);

    const { error } = await query;
    if (!error) {
      showToast("Saved service");
      setServiceForm({
        id: "",
        title: "",
        description: "",
        icon_name: "",
        price: "",
        features: "",
        cta_text: "",
        cta_url: "",
        is_featured: false,
        is_visible: true,
        display_order: 0,
      });
      refreshServices();
    } else {
      showError(`Save service failed: ${error.message}`);
    }
  }, [serviceForm, supabase, refreshServices, showToast, showError]);

  const removeService = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) showError(`Delete service failed: ${error.message}`);
      else refreshServices();
    },
    [supabase, refreshServices, showError]
  );

  const upsertVideo = useCallback(async () => {
    const payload = {
      title: liveForm.title,
      youtube_id: liveForm.youtube_id,
      is_live: !!liveForm.is_live,
      order_index: Number(liveForm.order_index || 0),
    } as any;

    let error;
    if (liveForm.id) {
      ({ error } = await supabase
        .from("livestream_videos")
        .update(payload)
        .eq("id", liveForm.id));
    } else {
      ({ error } = await supabase.from("livestream_videos").insert(payload));
    }

    if (!error) {
      showToast("Saved livestream item");
      setLiveForm({ id: "", title: "", youtube_id: "", is_live: false, order_index: 0 });
      refreshLivestream();
    } else {
      showError(`Save livestream failed: ${error.message}`);
    }
  }, [liveForm, supabase, refreshLivestream, showToast, showError]);

  const removeVideo = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("livestream_videos").delete().eq("id", id);
      if (error) showError(`Delete livestream failed: ${error.message}`);
      else refreshLivestream();
    },
    [supabase, refreshLivestream, showError]
  );

  const saveLiveConfig = useCallback(async () => {
    const payload = {
      channel_url: liveConfig.channel_url,
      current_video_id: liveConfig.current_video_id,
      is_live_now: !!liveConfig.is_live_now,
    } as any;

    let error;
    if (liveConfig.id) {
      ({ error } = await supabase
        .from("livestream_config")
        .update(payload)
        .eq("id", liveConfig.id));
    } else {
      ({ error } = await supabase.from("livestream_config").insert(payload));
    }

    if (!error) {
      showToast("Saved livestream config");
      refreshLivestream();
    } else {
      showError(`Save config failed: ${error.message}`);
    }
  }, [liveConfig, supabase, refreshLivestream, showToast, showError]);

  const upsertAnalysis = useCallback(async () => {
    const id = analysisForm.id || safeId();
    const payload = {
      id,
      title: analysisForm.title,
      content: analysisForm.content,
      market: analysisForm.market,
      direction: analysisForm.direction,
      pair: analysisForm.pair,
      is_published: !!analysisForm.is_published,
    };

    const query = analysisForm.id
      ? supabase.from("analyses").update(payload).eq("id", id)
      : supabase.from("analyses").insert(payload);

    const { error } = await query;
    if (!error) {
      showToast("Saved analysis");
      setAnalysisForm({
        id: "",
        title: "",
        content: "",
        market: "forex",
        direction: "neutral",
        pair: "",
        is_published: true,
      });
      refreshAnalyses();
    } else {
      showError(`Save analysis failed: ${error.message}`);
    }
  }, [analysisForm, supabase, refreshAnalyses, showToast, showError]);

  const removeAnalysis = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("analyses").delete().eq("id", id);
      if (error) showError(`Delete analysis failed: ${error.message}`);
      else refreshAnalyses();
    },
    [supabase, refreshAnalyses, showError]
  );

  const upsertRecruit = useCallback(async () => {
    const id = recruitForm.id || safeId();
    const payload = {
      id,
      email: recruitForm.email,
      status: recruitForm.status,
      is_vip: !!recruitForm.is_vip,
      commission_balance: recruitForm.commission_balance,
      notes: recruitForm.notes,
    };

    const query = recruitForm.id
      ? supabase.from("recruits").update(payload).eq("id", id)
      : supabase.from("recruits").insert(payload);

    const { error } = await query;
    if (!error) {
      showToast("Saved recruit/VIP row");
      setRecruitForm({ id: "", email: "", status: "Pending", is_vip: false, commission_balance: "0", notes: "" });
      refreshRecruits();
    } else {
      showError(`Save recruit failed: ${error.message}`);
    }
  }, [recruitForm, supabase, refreshRecruits, showToast, showError]);

  const removeRecruit = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("recruits").delete().eq("id", id);
      if (error) showError(`Delete recruit failed: ${error.message}`);
      else refreshRecruits();
    },
    [supabase, refreshRecruits, showError]
  );

  // -----------------------------------------------------------------------
  // RENDER HELPERS
  // -----------------------------------------------------------------------
  const renderProducts = () => (
    <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60">
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-white font-semibold text-sm">Store products (products table)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProductForm({
                id: "",
                name: "",
                description: "",
                price: "0",
                category: "",
                imageUrl: "",
                buyUrl: "",
                visible: true,
                displayOrder: 0,
              })}
              className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700"
            >
              New product
            </button>
            <button onClick={refreshProducts} className="p-1 text-slate-300" title="Refresh products">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New product form inline at top when no id set */}
        {productForm.id === "" && productForm.name === "" && (
          <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
            <h4 className="text-white text-sm font-semibold">Create product</h4>
            {renderProductFormFields()}
          </div>
        )}

        {products.map((p) => {
          const pid = p._id || p.id;
          const isEditing = productForm.id === pid;
          const media = <ImagePreview src={p.image_url || p.imageUrl} alt={`Product image: ${p.name || pid}`} />;
          return (
            <div key={pid} className="space-y-2">
              <Row
                title={`${p.name} (${p.category || "N/A"})`}
                subtitle={`$${p.price ?? 0} • Visible: ${p.visible ? "yes" : "no"}`}
                meta={p.buy_url || p.buyUrl ? "Buy URL" : undefined}
                onEdit={() =>
                  setProductForm({
                    id: pid,
                    name: p.name || "",
                    description: p.description || "",
                    price: String(p.price ?? "0"),
                    category: p.category || "",
                    imageUrl: p.image_url || p.imageUrl || "",
                    buyUrl: p.buy_url || p.buyUrl || "",
                    visible: Boolean(p.visible),
                    displayOrder: Number(p.display_order || 0),
                  })
                }
                onDelete={() => removeProduct(pid)}
              />
              {media ? <CollapsiblePreview label="Preview">{media}</CollapsiblePreview> : null}
              {isEditing && (
                <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
                  <h4 className="text-white text-sm font-semibold">Edit product</h4>
                  {renderProductFormFields()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-white font-semibold text-sm">VIP Store (bullmoney_vip)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVipForm({
                id: "",
                name: "",
                description: "",
                price: "0",
                imageUrl: "",
                buyUrl: "",
                comingSoon: false,
                sortOrder: 0,
                planOptions: "[]",
              })}
              className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700"
            >
              New VIP item
            </button>
            <button onClick={refreshVipProducts} className="p-1 text-slate-300" title="Refresh VIP">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {vipForm.id === "" && vipForm.name === "" && (
          <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
            <h4 className="text-white text-sm font-semibold">Create VIP item</h4>
            {renderVipFormFields()}
          </div>
        )}

        {vipProducts.map((p) => {
          const vid = p.id;
          const isEditing = vipForm.id === vid;
          const media = <ImagePreview src={p.image_url || p.imageUrl} alt={`VIP image: ${p.name || vid}`} />;
          const planPreview = p.planOptions ? (
            <pre className="text-xs text-slate-200 bg-slate-900/60 rounded-md border border-slate-700 p-2 whitespace-pre-wrap break-words">{p.planOptions}</pre>
          ) : null;

          return (
            <div key={vid} className="space-y-2">
              <Row
                title={`${p.name}`}
                subtitle={`$${p.price ?? 0} • Coming soon: ${p.coming_soon ? "yes" : "no"}`}
                meta={`Plans: ${Array.isArray(p.plan_options) ? p.plan_options.length : 0}`}
                onEdit={() =>
                  setVipForm({
                    id: vid,
                    name: p.name || "",
                    description: p.description || "",
                    price: String(p.price ?? "0"),
                    imageUrl: p.image_url || p.imageUrl || "",
                    buyUrl: p.buy_url || p.buyUrl || "",
                    comingSoon: !!p.coming_soon,
                    sortOrder: Number(p.sort_order || 0),
                    planOptions: p.planOptions || "[]",
                  })
                }
                onDelete={() => removeVipProduct(vid)}
              />
              {media ? <CollapsiblePreview label="Preview">{media}</CollapsiblePreview> : null}
              {planPreview ? <CollapsiblePreview label="Plan options JSON">{planPreview}</CollapsiblePreview> : null}
              {isEditing && (
                <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
                  <h4 className="text-white text-sm font-semibold">Edit VIP item</h4>
                  {renderVipFormFields()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProductFormFields = () => (
    <>
      <input
        value={productForm.name}
        onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="Name"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <textarea
        value={productForm.description}
        onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Description"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        rows={3}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={productForm.price}
          onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
          placeholder="Price"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <input
          value={productForm.category}
          onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}
          placeholder="Category"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
      </div>
      <input
        value={productForm.imageUrl}
        onChange={(e) => setProductForm((f) => ({ ...f, imageUrl: e.target.value }))}
        placeholder="Image URL"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <input
        value={productForm.buyUrl}
        onChange={(e) => setProductForm((f) => ({ ...f, buyUrl: e.target.value }))}
        placeholder="Buy URL"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={productForm.visible}
            onChange={(e) => setProductForm((f) => ({ ...f, visible: e.target.checked }))}
          />
          Visible
        </label>
        <input
          type="number"
          value={productForm.displayOrder}
          onChange={(e) => setProductForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
          className="w-20 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
          placeholder="Order"
        />
      </div>
      <button
        onClick={upsertProduct}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black py-2 text-sm"
      >
        <Save className="w-4 h-4" /> Save product
      </button>
    </>
  );

    const renderVipFormFields = () => (
      <>
        <input
          value={vipForm.name}
          onChange={(e) => setVipForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Name"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <textarea
          value={vipForm.description}
          onChange={(e) => setVipForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Description"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
          rows={3}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={vipForm.price}
            onChange={(e) => setVipForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="Display price"
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
          />
          <input
            value={vipForm.sortOrder}
            onChange={(e) => setVipForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            placeholder="Sort order"
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
            type="number"
          />
        </div>
        <input
          value={vipForm.imageUrl}
          onChange={(e) => setVipForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="Image URL (Whop)"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <input
          value={vipForm.buyUrl}
          onChange={(e) => setVipForm((f) => ({ ...f, buyUrl: e.target.value }))}
          placeholder="Default buy URL"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <textarea
          value={vipForm.planOptions}
          onChange={(e) => setVipForm((f) => ({ ...f, planOptions: e.target.value }))}
          placeholder='Plan options JSON (array of objects with label, price, interval, buy_url, trial_days)'
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white font-mono"
          rows={5}
        />
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={vipForm.comingSoon}
              onChange={(e) => setVipForm((f) => ({ ...f, comingSoon: e.target.checked }))}
            />
            Coming soon
          </label>
        </div>
        <button
          onClick={upsertVipProduct}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black py-2 text-sm"
        >
          <Save className="w-4 h-4" /> Save VIP item
        </button>
      </>
    );

  const renderServices = () => (
    <div className="space-y-2 overflow-y-auto overflow-x-hidden max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]" style={{ touchAction: 'pan-y' }}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-white font-semibold text-sm">Services</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setServiceForm({
              id: "",
              title: "",
              description: "",
              icon_name: "",
              price: "",
              features: "",
              cta_text: "",
              cta_url: "",
              is_featured: false,
              is_visible: true,
              display_order: 0,
            })}
            className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700"
          >
            New service
          </button>
          <button onClick={refreshServices} className="p-1 text-slate-300" title="Refresh services">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {serviceForm.id === "" && serviceForm.title === "" && (
        <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
          <h4 className="text-white text-sm font-semibold">Create service</h4>
          {renderServiceFormFields()}
        </div>
      )}

      {services.map((s) => {
        const sid = s.id;
        const isEditing = serviceForm.id === sid;
        const media = <ImagePreview src={s.icon_url || undefined} alt={`Service image: ${s.title || sid}`} />;
        return (
          <div key={sid} className="space-y-2">
            <Row
              title={s.title}
              subtitle={`${s.price || ""} • ${s.icon_name || ""}`}
              meta={`Visible: ${s.is_visible ? "yes" : "no"}`}
              onEdit={() =>
                setServiceForm({
                  id: sid,
                  title: s.title || "",
                  description: s.description || "",
                  icon_name: s.icon_name || "",
                  price: s.price || "",
                  features: Array.isArray(s.features) ? s.features.join("|") : s.features || "",
                  cta_text: s.cta_text || "",
                  cta_url: s.cta_url || "",
                  is_featured: !!s.is_featured,
                  is_visible: !!s.is_visible,
                  display_order: Number(s.display_order || 0),
                })
              }
              onDelete={() => removeService(sid)}
            />
            {media ? <CollapsiblePreview label="Preview">{media}</CollapsiblePreview> : null}
            {isEditing && (
              <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
                <h4 className="text-white text-sm font-semibold">Edit service</h4>
                {renderServiceFormFields()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderServiceFormFields = () => (
    <>
      <input
        value={serviceForm.title}
        onChange={(e) => setServiceForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Title"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <textarea
        value={serviceForm.description}
        onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Description"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        rows={3}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={serviceForm.price}
          onChange={(e) => setServiceForm((f) => ({ ...f, price: e.target.value }))}
          placeholder="Price"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <input
          value={serviceForm.icon_name}
          onChange={(e) => setServiceForm((f) => ({ ...f, icon_name: e.target.value }))}
          placeholder="Icon name"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
      </div>
      <input
        value={serviceForm.features}
        onChange={(e) => setServiceForm((f) => ({ ...f, features: e.target.value }))}
        placeholder="Features (use | to split)"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={serviceForm.cta_text}
          onChange={(e) => setServiceForm((f) => ({ ...f, cta_text: e.target.value }))}
          placeholder="CTA text"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <input
          value={serviceForm.cta_url}
          onChange={(e) => setServiceForm((f) => ({ ...f, cta_url: e.target.value }))}
          placeholder="CTA URL"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={serviceForm.is_visible}
            onChange={(e) => setServiceForm((f) => ({ ...f, is_visible: e.target.checked }))}
          />
          Visible
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={serviceForm.is_featured}
            onChange={(e) => setServiceForm((f) => ({ ...f, is_featured: e.target.checked }))}
          />
          Featured
        </label>
        <input
          type="number"
          value={serviceForm.display_order}
          onChange={(e) => setServiceForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
          className="w-20 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
          placeholder="Order"
        />
      </div>
      <button
        onClick={upsertService}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black py-2 text-sm"
      >
        <Save className="w-4 h-4" /> Save service
      </button>
    </>
  );

  const renderLivestream = () => (
    <div className="space-y-3 overflow-y-auto overflow-x-hidden max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]" style={{ touchAction: 'pan-y' }}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-white font-semibold text-sm">Livestream videos</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiveForm({ id: "", title: "", youtube_id: "", is_live: false, order_index: 0 })}
            className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700"
          >
            New video
          </button>
          <button onClick={refreshLivestream} className="p-1 text-slate-300" title="Refresh livestream">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {liveForm.id === "" && liveForm.title === "" && (
        <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
          <h4 className="text-white text-sm font-semibold">Create video</h4>
          {renderLiveFormFields()}
        </div>
      )}

      {videos.map((v) => {
        const vid = v.id;
        const isEditing = liveForm.id === vid;
        const youtubeId = v.youtube_id || detectYouTubeId(v.youtube_url);
        const videoPreview = youtubeId ? <VideoPreview youtubeId={youtubeId} title={v.title} skipEmbed={shouldSkipHeavyEffects} /> : null;
        return (
          <div key={vid} className="space-y-2">
            <Row
              title={`${v.title || "Untitled"}`}
              subtitle={`YouTube: ${v.youtube_id}`}
              meta={`Live: ${v.is_live ? "yes" : "no"}`}
              onEdit={() =>
                setLiveForm({
                  id: vid,
                  title: v.title || "",
                  youtube_id: v.youtube_id || "",
                  is_live: !!v.is_live,
                  order_index: Number(v.order_index || 0),
                })
              }
              onDelete={() => removeVideo(vid)}
            />
            {videoPreview ? <CollapsiblePreview label="Video preview">{videoPreview}</CollapsiblePreview> : null}
            {isEditing && (
              <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
                <h4 className="text-white text-sm font-semibold">Edit video</h4>
                {renderLiveFormFields()}
              </div>
            )}
          </div>
        );
      })}

      <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
        <h4 className="text-white font-semibold text-sm flex items-center gap-2">
          <SettingsIcon /> Livestream config
        </h4>
        <input
          value={liveConfig.channel_url}
          onChange={(e) => setLiveConfig((f) => ({ ...f, channel_url: e.target.value }))}
          placeholder="Channel URL"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <input
          value={liveConfig.current_video_id}
          onChange={(e) => setLiveConfig((f) => ({ ...f, current_video_id: e.target.value }))}
          placeholder="Current video id"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={liveConfig.is_live_now}
            onChange={(e) => setLiveConfig((f) => ({ ...f, is_live_now: e.target.checked }))}
          />
          Streaming now
        </label>
        <button
          onClick={saveLiveConfig}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600 text-white py-2 text-sm"
        >
          <Save className="w-4 h-4" /> Save config
        </button>
      </div>
    </div>
  );

  const renderLiveFormFields = () => (
    <>
      <input
        value={liveForm.title}
        onChange={(e) => setLiveForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Title"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <input
        value={liveForm.youtube_id}
        onChange={(e) => setLiveForm((f) => ({ ...f, youtube_id: e.target.value }))}
        placeholder="YouTube video id"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={liveForm.is_live}
            onChange={(e) => setLiveForm((f) => ({ ...f, is_live: e.target.checked }))}
          />
          Live now
        </label>
        <input
          type="number"
          value={liveForm.order_index}
          onChange={(e) => setLiveForm((f) => ({ ...f, order_index: Number(e.target.value) }))}
          className="w-20 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
          placeholder="Order"
        />
      </div>
      <button
        onClick={upsertVideo}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black py-2 text-sm"
      >
        <Save className="w-4 h-4" /> Save video
      </button>
    </>
  );

  const renderAnalyses = () => (
    <div className="space-y-2 overflow-y-auto overflow-x-hidden max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]" style={{ touchAction: 'pan-y' }}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-white font-semibold text-sm">Analyses</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnalysisForm({
              id: "",
              title: "",
              content: "",
              market: "forex",
              direction: "neutral",
              pair: "",
              is_published: true,
            })}
            className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700"
          >
            New analysis
          </button>
          <button onClick={refreshAnalyses} className="p-1 text-slate-300" title="Refresh analyses">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {analysisForm.id === "" && analysisForm.title === "" && (
        <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
          <h4 className="text-white text-sm font-semibold">Create analysis</h4>
          {renderAnalysisFormFields()}
        </div>
      )}

      {analyses.map((a) => {
        const aid = a.id;
        const isEditing = analysisForm.id === aid;
        const attachments = Array.isArray(a.attachments)
          ? a.attachments
          : (() => {
              try {
                return a.attachments ? JSON.parse(a.attachments) : [];
              } catch {
                return [];
              }
            })();
        const youtubeId = detectYouTubeId(a.content || "") || detectYouTubeId(a.video_url || "");
        const videoPreview = youtubeId ? <VideoPreview youtubeId={youtubeId} title={a.title} skipEmbed={shouldSkipHeavyEffects} /> : null;
        const attachmentPreview = attachments && attachments.length ? <MediaAttachmentList attachments={attachments} skipEmbed={shouldSkipHeavyEffects} /> : null;
        return (
          <div key={aid} className="space-y-2">
            <Row
              title={a.title || "Untitled"}
              subtitle={`${a.market || ""} • ${a.direction || ""}`}
              meta={`Published: ${a.is_published ? "yes" : "no"}`}
              onEdit={() =>
                setAnalysisForm({
                  id: aid,
                  title: a.title || "",
                  content: a.content || "",
                  market: a.market || "forex",
                  direction: a.direction || "neutral",
                  pair: a.pair || "",
                  is_published: !!a.is_published,
                })
              }
              onDelete={() => removeAnalysis(aid)}
            />
            {videoPreview ? <CollapsiblePreview label="Video preview">{videoPreview}</CollapsiblePreview> : null}
            {attachmentPreview ? <CollapsiblePreview label="Attachments">{attachmentPreview}</CollapsiblePreview> : null}
            {isEditing && (
              <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
                <h4 className="text-white text-sm font-semibold">Edit analysis</h4>
                {renderAnalysisFormFields()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderAnalysisFormFields = () => (
    <>
      <input
        value={analysisForm.title}
        onChange={(e) => setAnalysisForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Title"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <textarea
        value={analysisForm.content}
        onChange={(e) => setAnalysisForm((f) => ({ ...f, content: e.target.value }))}
        placeholder="Content"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        rows={4}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={analysisForm.market}
          onChange={(e) => setAnalysisForm((f) => ({ ...f, market: e.target.value }))}
          placeholder="Market"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
        <input
          value={analysisForm.direction}
          onChange={(e) => setAnalysisForm((f) => ({ ...f, direction: e.target.value }))}
          placeholder="Direction"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        />
      </div>
      <input
        value={analysisForm.pair}
        onChange={(e) => setAnalysisForm((f) => ({ ...f, pair: e.target.value }))}
        placeholder="Pair (e.g. BTC/USD)"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={analysisForm.is_published}
          onChange={(e) => setAnalysisForm((f) => ({ ...f, is_published: e.target.checked }))}
        />
        Published
      </label>
      <button
        onClick={upsertAnalysis}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black py-2 text-sm"
      >
        <Save className="w-4 h-4" /> Save analysis
      </button>
    </>
  );

  const renderRecruits = () => (
    <div className="space-y-2 overflow-y-auto overflow-x-hidden max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]" style={{ touchAction: 'pan-y' }}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-white font-semibold text-sm">Recruits / VIP</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRecruitForm({ id: "", email: "", status: "Pending", is_vip: false, commission_balance: "0", notes: "" })}
            className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700"
          >
            New recruit
          </button>
          <button onClick={refreshRecruits} className="p-1 text-slate-300" title="Refresh recruits">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {recruitForm.id === "" && recruitForm.email === "" && (
        <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
          <h4 className="text-white text-sm font-semibold">Create recruit</h4>
          {renderRecruitFormFields()}
        </div>
      )}

      {recruits.map((r) => {
        const rid = r.id;
        const isEditing = recruitForm.id === rid;
        const media = <ImagePreview src={r.image_url} alt={`Recruit image: ${r.email || rid}`} />;
        return (
          <div key={rid} className="space-y-2">
            <Row
              title={r.email || "No email"}
              subtitle={`${r.status || ""} • VIP: ${r.is_vip ? "yes" : "no"}`}
              meta={`Commission: ${r.commission_balance || "0"}`}
              onEdit={() =>
                setRecruitForm({
                  id: rid,
                  email: r.email || "",
                  status: r.status || "Pending",
                  is_vip: !!r.is_vip,
                  commission_balance: r.commission_balance || "0",
                  notes: r.notes || "",
                })
              }
              onDelete={() => removeRecruit(rid)}
            />
            {media ? <CollapsiblePreview label="Preview">{media}</CollapsiblePreview> : null}
            {isEditing && (
              <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-900/70">
                <h4 className="text-white text-sm font-semibold">Edit recruit</h4>
                {renderRecruitFormFields()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderRecruitFormFields = () => (
    <>
      <input
        value={recruitForm.email}
        onChange={(e) => setRecruitForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="Email"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <input
        value={recruitForm.status}
        onChange={(e) => setRecruitForm((f) => ({ ...f, status: e.target.value }))}
        placeholder="Status"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          checked={recruitForm.is_vip}
          onChange={(e) => setRecruitForm((f) => ({ ...f, is_vip: e.target.checked }))}
        />
        VIP
      </label>
      <input
        value={recruitForm.commission_balance}
        onChange={(e) => setRecruitForm((f) => ({ ...f, commission_balance: e.target.value }))}
        placeholder="Commission balance"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
      />
      <textarea
        value={recruitForm.notes}
        onChange={(e) => setRecruitForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Notes"
        className="w-full rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
        rows={3}
      />
      <button
        onClick={upsertRecruit}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black py-2 text-sm"
      >
        <Save className="w-4 h-4" /> Save recruit/VIP
      </button>
    </>
  );

  const renderFaq = () => (
    <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-white font-semibold text-sm">FAQ Content Editor</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadFaqFromDb}
            className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700"
          >
            Load FAQ
          </button>
          <button
            onClick={saveFaqToDb}
            className="px-2 py-1 text-xs rounded-md bg-white text-black border border-white/60"
          >
            Save FAQ
          </button>
        </div>
      </div>

      <div className="p-3 rounded-lg border border-white/30 bg-slate-900/50">
        <p className="text-xs text-slate-300">
          Edit FAQ categories and items below. Changes save directly to the live FAQ content.
        </p>
      </div>

      {faqCategories.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>Click &quot;Load Current FAQ&quot; to start editing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqCategories.map((category, catIdx) => (
            <div key={catIdx} className="p-2 rounded-lg border border-slate-700 bg-slate-900/70">
              <div className="flex items-center justify-between mb-2">
                <input
                  value={category.category}
                  onChange={(e) => {
                    const updated = [...faqCategories];
                    updated[catIdx] = { ...updated[catIdx], category: e.target.value };
                    setFaqCategories(updated);
                  }}
                  className="flex-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-white font-semibold"
                  placeholder="Category Name"
                />
                <button
                  onClick={() => {
                    const updated = faqCategories.filter((_, i) => i !== catIdx);
                    setFaqCategories(updated);
                  }}
                  className="ml-2 p-1.5 rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {category.items?.map((item: any, itemIdx: number) => (
                  <div key={itemIdx} className="p-2 rounded-md border border-slate-600 bg-slate-800/50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <input
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...faqCategories];
                          updated[catIdx].items[itemIdx] = { ...item, name: e.target.value };
                          setFaqCategories(updated);
                        }}
                        className="flex-1 rounded-md bg-slate-700 border border-slate-600 px-2 py-1 text-sm text-white"
                        placeholder="Question"
                      />
                      <button
                        onClick={() => {
                          const updated = [...faqCategories];
                          updated[catIdx].items = updated[catIdx].items.filter((_: any, i: number) => i !== itemIdx);
                          setFaqCategories(updated);
                        }}
                        className="p-1.5 rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <textarea
                      value={typeof item.answer === 'string' ? item.answer : ''}
                      onChange={(e) => {
                        const updated = [...faqCategories];
                        updated[catIdx].items[itemIdx] = { ...item, answer: e.target.value };
                        setFaqCategories(updated);
                      }}
                      className="w-full rounded-md bg-slate-700 border border-slate-600 px-2 py-1 text-sm text-slate-200"
                      placeholder="Answer"
                      rows={2}
                    />
                  </div>
                ))}

                <button
                  onClick={() => {
                    const updated = [...faqCategories];
                    if (!updated[catIdx].items) updated[catIdx].items = [];
                    updated[catIdx].items.push({ name: '', answer: '' });
                    setFaqCategories(updated);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-md bg-white/20 hover:bg-white/30 border border-white/40 text-white"
                >
                  + Add Question
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setFaqCategories([...faqCategories, { category: 'New Category', items: [] }]);
            }}
            className="w-full px-4 py-2 text-sm rounded-md bg-white text-black border border-white/60"
          >
            + Add Category
          </button>

          <button
            onClick={() => {
              const json = JSON.stringify(faqCategories, null, 2);
              navigator.clipboard.writeText(json);
              showToast('FAQ JSON copied to clipboard!');
            }}
            className="w-full px-4 py-2 text-sm rounded-md bg-white text-black border border-white/60"
          >
            Copy JSON to Clipboard
          </button>
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // MAIN RENDER
  // -----------------------------------------------------------------------
  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={animations.modalBackdrop.initial}
            animate={animations.modalBackdrop.animate as TargetAndTransition}
            exit={animations.modalBackdrop.exit}
            transition={animations.modalBackdrop.transition}
            className="fixed inset-0 z-[2147483647] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md"
            onClick={onClose}
          >
          <motion.div
            initial={animations.modalContent.initial}
            animate={animations.modalContent.animate as TargetAndTransition}
            exit={animations.modalContent.exit}
            transition={animations.modalContent.transition}
            onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-6xl sm:max-w-5xl md:max-w-6xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/40 bg-gradient-to-b from-slate-950 via-slate-900 to-black [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain] ${
                shouldSkipHeavyEffects ? '' : 'shadow-2xl shadow-white/40'
              }`}
              style={{ touchAction: 'auto' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/30 bg-white/10">
              <div className="flex items-center gap-2 text-white font-bold">
                <Shield className="w-5 h-5 text-white" /> Admin Control Panel
                {(!supabaseUrl || !supabaseAnon) && (
                  <span className="text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/40">
                    Supabase env missing
                  </span>
                )}
                {busy ? (
                  <span className="text-[11px] text-slate-300 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> syncing
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadAll}
                  className="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <Database className="w-4 h-4" /> Sync
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

              <div className="px-3 sm:px-4 py-2 flex flex-nowrap sm:flex-wrap gap-1 sm:gap-2 overflow-x-auto overflow-y-hidden border-b border-slate-800 bg-slate-900/60 scrollbar-none [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain] [scroll-snap-type:x_mandatory]" style={{ touchAction: 'pan-x pinch-zoom', WebkitOverflowScrolling: 'touch' }}>
              <TabButton
                label="Products"
                icon={<Package className="w-4 h-4" />}
                active={activeTab === "products"}
                onClick={() => setActiveTab("products")}
              />
              <TabButton
                label="Services"
                icon={<ClipboardList className="w-4 h-4" />}
                active={activeTab === "services"}
                onClick={() => setActiveTab("services")}
              />
              <TabButton
                label="Livestream"
                icon={<Video className="w-4 h-4" />}
                active={activeTab === "livestream"}
                onClick={() => setActiveTab("livestream")}
              />
              <TabButton
                label="Analysis"
                icon={<BarChart3 className="w-4 h-4" />}
                active={activeTab === "analysis"}
                onClick={() => setActiveTab("analysis")}
              />
              <TabButton
                label="VIP / Recruits"
                icon={<Crown className="w-4 h-4" />}
                active={activeTab === "recruits"}
                onClick={() => setActiveTab("recruits")}
              />
              <TabButton
                label="Trading Course"
                icon={<GraduationCap className="w-4 h-4" />}
                active={activeTab === "course"}
                onClick={() => setActiveTab("course")}
              />
              <TabButton
                label="Affiliate Admin"
                icon={<Users className="w-4 h-4" />}
                active={activeTab === "affiliate"}
                onClick={() => setActiveTab("affiliate")}
              />
              <TabButton
                label="FAQ Editor"
                icon={<HelpCircle className="w-4 h-4" />}
                active={activeTab === "faq"}
                onClick={() => setActiveTab("faq")}
              />
            </div>

              <div className="p-3 sm:p-4 bg-slate-950/70 overflow-hidden [overscroll-behavior:contain]">
                {!authChecked ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-slate-300 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Checking admin access...
                  </div>
                ) : isAdmin ? (
                  <>
                    {activeTab === "products" && renderProducts()}
                    {activeTab === "services" && renderServices()}
                    {activeTab === "livestream" && renderLivestream()}
                    {activeTab === "analysis" && renderAnalyses()}
                    {activeTab === "recruits" && renderRecruits()}
                    {activeTab === "course" && <CourseAdminPanel />}
                    {activeTab === "faq" && renderFaq()}
                    {activeTab === "affiliate" && (
                      <div className="space-y-4">
                        {/* Toggle between Calculator and Admin Panel */}
                        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800 w-fit">
                          <button
                            onClick={() => setAffiliateView("calculator")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              affiliateView === "calculator"
                                ? "bg-white text-black"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            Calculator
                          </button>
                          <button
                            onClick={() => setAffiliateView("admin")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              affiliateView === "admin"
                                ? "bg-white text-black"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            Admin Panel
                          </button>
                        </div>

                        {/* Content */}
                        {affiliateView === "calculator" ? (
                          <AdminAffiliateCalculator />
                        ) : (
                          <AffiliateAdminPanel />
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-slate-200">
                    <Shield className="w-6 h-6 text-amber-300" />
                    <div className="text-lg font-semibold">Access restricted</div>
                    <div className="text-xs text-slate-400">
                      {adminEmailEnv
                        ? `Sign in with admin email: ${adminEmailEnv}`
                        : "Set NEXT_PUBLIC_ADMIN_EMAIL in your environment to enable admin access."}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="/login"
                        className="px-3 py-1.5 rounded-md bg-white text-black text-sm border border-white/60"
                      >
                        Go to login
                      </a>
                      <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 text-sm border border-slate-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

            {toast ? (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800/90 text-white px-3 py-2 text-sm border border-white/40 shadow-lg">
                {toast}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Small inline settings icon to avoid extra lucide import weight
function SettingsIcon() {
  return <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
}

export default AdminHubModal;
