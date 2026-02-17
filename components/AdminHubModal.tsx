"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Clock,
  Coins,
  Crown,
  Database,
  Globe,
  Mail,
  Package,
  RefreshCw,
  RotateCcw,
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
  ShoppingBag,
  Upload,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";
import CourseAdminPanel from "@/components/CourseAdminPanel";
import AffiliateAdminPanel from "@/app/recruit/AffiliateAdminPanel";
import AdminAffiliateCalculator from "@/components/AdminAffiliateCalculator";
import EmailAdminPanel from "@/components/EmailAdminPanel";
import StoreAnalyticsPanel from "@/components/StoreAnalyticsPanel";
import StorePromoManager from "@/components/StorePromoManager";
import RewardsAdminPanel from "@/components/RewardsAdminPanel";
import NewsletterMessagesPanel from "@/components/NewsletterMessagesPanel";
import CryptoPaymentsAdminPanel from "@/components/CryptoPaymentsAdminPanel";
import CryptoRefundsAdminPanel from "@/components/CryptoRefundsAdminPanel";
import AffiliateQRPosterPanel from "@/components/admin/AffiliateQRPosterPanel";
import AffiliateContentAdminPanel from "@/components/admin/AffiliateContentAdminPanel";
import NetworkAdminPanel from "@/components/admin/NetworkAdminPanel";
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { useCartStore } from '@/stores/cart-store';

// Generate a reasonably unique id when inserting rows from the client
const safeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const MAX_IMAGE_SIZE = 200 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

type RowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  isEditing?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const Row: React.FC<RowProps> = ({ title, subtitle, meta, isEditing, onEdit, onDelete }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onEdit}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onEdit();
    }}
    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 gap-3 transition-colors cursor-pointer select-none ${
      isEditing
        ? "border-blue-500/50 bg-blue-950/30 ring-1 ring-blue-500/20"
        : "border-slate-800 bg-slate-900/70"
    }`}
  >
    <div className="min-w-0 flex-1">
      <div className="text-white font-semibold text-sm truncate">{title}</div>
      {subtitle ? <div className="text-slate-300 text-xs truncate">{subtitle}</div> : null}
      {meta ? <div className="text-slate-400 text-[11px] truncate">{meta}</div> : null}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={`p-2 rounded-md border transition-colors ${
          isEditing
            ? "bg-blue-500/30 hover:bg-blue-500/40 border-blue-400/50 text-blue-200"
            : "bg-white/20 hover:bg-white/30 border-white/40 text-white"
        }`}
        title={isEditing ? "Close editor" : "Edit"}
      >
        {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 transition-colors"
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
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors shrink-0 whitespace-nowrap scroll-snap-align-start ${
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
                className="text-white text-sm hover:text-white wrap-break-word"
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
  embedded = false,
  showHeader = true,
  bwMode = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
  showHeader?: boolean;
  bwMode?: boolean;
}) {
  // Performance optimization – always skip heavy render effects in admin panel on ALL devices
  const { isMobile } = useMobilePerformance();
  const shouldSkipHeavyEffects = true; // Admin panel always lightweight
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const normalizeEmail = (value: unknown) =>
    String(value ?? '')
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .trim()
      .toLowerCase();
  const adminEmailEnv = normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL);
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [activeTab, setActiveTab] = useState<
    "products" | "services" | "livestream" | "analysis" | "recruits" | "course" | "affiliate" | "email" | "faq" | "store" | "store_settings" | "crypto" | "crypto_refunds" | "network"
  >("products");
  const [tabsListOpen, setTabsListOpen] = useState(false);
  const [affiliateView, setAffiliateView] = useState<"calculator" | "admin" | "qr-posters" | "content-editor">("calculator");
  const [storeView, setStoreView] = useState<"analytics" | "promos" | "rewards" | "messages">("analytics");
  const [storeDisplayMode, setStoreDisplayMode] = useState<"global" | "vip" | "timer">("global");
  const [displayModeLoading, setDisplayModeLoading] = useState(false);
  const [vipShippingCharged, setVipShippingCharged] = useState(true);
  const [vipShippingLoading, setVipShippingLoading] = useState(false);
  const [timerEnd, setTimerEnd] = useState<string>("");
  const [timerHeadline, setTimerHeadline] = useState<string>("Something big is coming");
  const [timerSubtext, setTimerSubtext] = useState<string>("New products dropping soon. Stay tuned.");
  const [busy, setBusy] = useState(false);
  const isSyncing = useRef(false);
  const [toast, setToast] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pagemodeAuthorized, setPagemodeAuthorized] = useState(false);
  const [pagemodeChecked, setPagemodeChecked] = useState(false);
  const [adminAccessToken, setAdminAccessToken] = useState<string>("");
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [vipImageUploading, setVipImageUploading] = useState(false);
  const isDevBypass = process.env.NODE_ENV === "development";
  const isAdmin = isDevBypass || ((authorized || pagemodeAuthorized) && (authChecked || pagemodeChecked));
  const accessCheckComplete = isDevBypass || authChecked || pagemodeChecked;

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    id: "__closed__",
    name: "",
    description: "",
    price: "0",
    category: "",
    imageUrl: "",
    buyUrl: "",
    visible: true,
    displayOrder: 0,
  });
  const closeProductForm = () => setProductForm(f => ({ ...f, id: "__closed__" }));

  // VIP (bullmoney_vip)
  const [vipProducts, setVipProducts] = useState<any[]>([]);
  const [vipForm, setVipForm] = useState({
    id: "__closed__",
    name: "",
    description: "",
    price: "0",
    imageUrl: "",
    buyUrl: "",
    comingSoon: false,
    sortOrder: 0,
    planOptions: "[]",
  });
  const closeVipForm = () => setVipForm(f => ({ ...f, id: "__closed__" }));

  // Services
  const [services, setServices] = useState<any[]>([]);
  const [serviceForm, setServiceForm] = useState({
    id: "__closed__",
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
  const closeServiceForm = () => setServiceForm(f => ({ ...f, id: "__closed__" }));

  // Livestream
  const [videos, setVideos] = useState<any[]>([]);
  const [liveForm, setLiveForm] = useState({
    id: "__closed__",
    title: "",
    youtube_id: "",
    is_live: false,
    order_index: 0,
  });
  const closeLiveForm = () => setLiveForm(f => ({ ...f, id: "__closed__" }));
  const [liveConfig, setLiveConfig] = useState({
    id: "",
    channel_url: "",
    current_video_id: "",
    is_live_now: false,
  });

  // Analysis
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [analysisForm, setAnalysisForm] = useState({
    id: "__closed__",
    title: "",
    content: "",
    market: "forex",
    direction: "neutral",
    pair: "",
    is_published: true,
  });
  const closeAnalysisForm = () => setAnalysisForm(f => ({ ...f, id: "__closed__" }));

  // Recruits / VIP
  const [recruits, setRecruits] = useState<any[]>([]);
  const [recruitForm, setRecruitForm] = useState({
    id: "__closed__",
    email: "",
    status: "Pending",
    is_vip: false,
    commission_balance: "0",
    notes: "",
  });
  const closeRecruitForm = () => setRecruitForm(f => ({ ...f, id: "__closed__" }));

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

  const uploadAdminImage = useCallback(
    async (file: File, folder: string) => {
      if (file.size > MAX_IMAGE_SIZE) {
        showError("Image must be less than 200MB.");
        return "";
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        showError("Unsupported image type. Use JPG, PNG, WebP, GIF, or AVIF.");
        return "";
      }

      const fileExt = file.name.split(".").pop() || "jpg";
      const baseName = slugify(file.name.replace(/\.[^/.]+$/, "")) || "image";
      const fileName = `${folder}/${safeId()}-${baseName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("store-products")
        .upload(fileName, file, { cacheControl: "3600", upsert: true, contentType: file.type });

      if (uploadError) {
        showError("Image upload failed.");
        return "";
      }

      const { data } = supabase.storage.from("store-products").getPublicUrl(fileName);
      return data?.publicUrl || "";
    },
    [supabase, showError]
  );

  const handleProductImageFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setProductImageUploading(true);
      const url = await uploadAdminImage(file, "admin-products");
      if (url) {
        setProductForm((f) => ({ ...f, imageUrl: url }));
        showToast("Product image uploaded.");
      }
      setProductImageUploading(false);
      event.target.value = "";
    },
    [uploadAdminImage, showToast]
  );

  const handleVipImageFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setVipImageUploading(true);
      const url = await uploadAdminImage(file, "admin-vip");
      if (url) {
        setVipForm((f) => ({ ...f, imageUrl: url }));
        showToast("VIP image uploaded.");
      }
      setVipImageUploading(false);
      event.target.value = "";
    },
    [uploadAdminImage, showToast]
  );

  const getAdminHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (adminEmailEnv) headers["x-admin-email"] = adminEmailEnv;

    // Prefer a real Supabase session access token when available.
    // (Validated server-side via supabase.auth.getUser(token))
    if (adminAccessToken) {
      headers["x-admin-token"] = adminAccessToken;
      return headers;
    }

    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("crypto_admin_token") ||
        "";
      if (token) headers["x-admin-token"] = token;
    }
    return headers;
  }, [adminEmailEnv, adminAccessToken]);

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
      setAuthorized(Boolean(adminEmail) && normalizeEmail(email) === adminEmail);
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
      setAdminAccessToken(data?.session?.access_token || "");
      setAuthChecked(true);
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session?.user?.email || null);
      setAdminAccessToken(session?.access_token || "");
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
        const email = normalizeEmail(parsed?.email);
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
      .select("*, category:categories(id, name, slug), images:product_images(url, is_primary, sort_order)")
      .order("created_at", { ascending: false });
    if (!error) {
      setProducts(
        (data || []).map((p: any) => {
          const images = Array.isArray(p.images) ? p.images : [];
          const primaryImage =
            images.find((img: any) => img.is_primary) ||
            images.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))[0];
          const categoryLabel = p.category?.name || p.category?.slug || "";

          return {
            ...p,
            id: p.id,
            price: p.base_price ?? 0,
            category: categoryLabel,
            image_url: primaryImage?.url || "",
            imageUrl: primaryImage?.url || "",
            buy_url: p.buy_url || "",
            buyUrl: p.buy_url || "",
            visible: p.status === "ACTIVE",
            display_order: p.details?.display_order ?? 0,
          };
        })
      );
    } else {
      showError(`Products load failed: ${error.message}`);
    }
  }, [supabase, showError]);

  const resolveCategoryId = useCallback(
    async (categoryValue: string) => {
      const trimmed = categoryValue.trim();
      if (!trimmed) return null;

      const slug = slugify(trimmed);
      const { data: bySlug } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (bySlug?.id) return bySlug.id;

      const { data: byName } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", `%${trimmed}%`)
        .maybeSingle();

      return byName?.id || null;
    },
    [supabase]
  );

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

  // Store display mode fetch
  const fetchDisplayMode = useCallback(async () => {
    try {
      const res = await fetch('/api/store/settings/display-mode');
      const data = await res.json();
      if (data?.mode) {
        setStoreDisplayMode(data.mode);
        if (data.timer_end) setTimerEnd(data.timer_end);
        if (data.timer_headline) setTimerHeadline(data.timer_headline);
        if (data.timer_subtext) setTimerSubtext(data.timer_subtext);
      }
    } catch (err) {
      console.error('Failed to fetch display mode:', err);
    }
  }, []);

  // Store display mode setter (supports all 3 modes)
  const changeDisplayMode = useCallback(async (newMode: 'global' | 'vip' | 'timer') => {
    setDisplayModeLoading(true);
    try {
      const payload: Record<string, unknown> = { mode: newMode };
      if (newMode === 'timer') {
        if (!timerEnd) {
          showError('Please set a countdown end date/time before enabling Timer mode.');
          setDisplayModeLoading(false);
          return;
        }
        payload.timer_end = timerEnd;
        payload.timer_headline = timerHeadline;
        payload.timer_subtext = timerSubtext;
      }
      const res = await fetch('/api/store/settings/display-mode', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setStoreDisplayMode(newMode);
        showToast(data.message || `Store switched to ${newMode} mode`);
      } else {
        showError(data?.error || 'Failed to update display mode');
      }
    } catch (err) {
      showError('Failed to update display mode');
    } finally {
      setDisplayModeLoading(false);
    }
  }, [timerEnd, timerHeadline, timerSubtext, getAdminHeaders, showToast, showError]);

  const fetchVipShipping = useCallback(async () => {
    try {
      const res = await fetch('/api/store/settings/vip-shipping', { cache: 'no-store' });
      const data = await res.json();
      if (typeof data?.charged === 'boolean') {
        setVipShippingCharged(data.charged);
        try {
          useCartStore.getState().setVipShippingCharged(data.charged);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to fetch VIP shipping setting:', err);
    }
  }, []);

  const changeVipShipping = useCallback(async (charged: boolean) => {
    setVipShippingLoading(true);
    try {
      const res = await fetch('/api/store/settings/vip-shipping', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ charged }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setVipShippingCharged(Boolean(data.charged));
        try {
          useCartStore.getState().setVipShippingCharged(Boolean(data.charged));
        } catch {}
        showToast(data.message || 'VIP shipping setting updated');
      } else {
        showError(data?.error || 'Failed to update VIP shipping setting');
      }
    } catch (err) {
      showError('Failed to update VIP shipping setting');
    } finally {
      setVipShippingLoading(false);
    }
  }, [getAdminHeaders, showToast, showError]);

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
        fetchDisplayMode(),
        fetchVipShipping(),
      ]);
    } finally {
      isSyncing.current = false;
    }
  }, [refreshProducts, refreshVipProducts, refreshServices, refreshLivestream, refreshAnalyses, refreshRecruits, fetchDisplayMode, fetchVipShipping]);

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

  // Auto-refresh disabled – admin panel skips heavy polling on all devices.
  // Data is loaded once on open and can be manually refreshed via the Sync button.

  // -----------------------------------------------------------------------
  // CRUD HELPERS
  // -----------------------------------------------------------------------
  const upsertProduct = useCallback(async () => {
    const isUpdate = Boolean(productForm.id && productForm.id !== "__closed__");
    const trimmedName = productForm.name.trim();
    if (!trimmedName) {
      showError("Product name is required.");
      return;
    }

    const existing = products.find((p) => p.id === productForm.id);
    const displayOrder = Number(productForm.displayOrder || 0);
    const categoryId = productForm.category
      ? await resolveCategoryId(productForm.category)
      : (existing?.category_id || null);

    if (productForm.category && !categoryId) {
      showError(`Category not found: ${productForm.category}`);
      return;
    }

    const payload = {
      name: trimmedName,
      slug: isUpdate && existing?.slug ? existing.slug : slugify(trimmedName),
      description: productForm.description || null,
      base_price: Number(productForm.price || 0),
      category_id: categoryId,
      status: productForm.visible ? "ACTIVE" : "DRAFT",
      buy_url: productForm.buyUrl || null,
      details: {
        ...(existing?.details || {}),
        display_order: displayOrder,
      },
    } as any;

    const productId = productForm.id;
    const response = await fetch("/api/store/admin/products/manage", {
      method: isUpdate ? "PATCH" : "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({
        id: isUpdate ? productId : undefined,
        payload,
        imageUrl: productForm.imageUrl,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      showError(`Save product failed: ${result?.error || "Unknown error"}`);
      return;
    }

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
  }, [productForm, products, resolveCategoryId, refreshProducts, showToast, showError, getAdminHeaders]);

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
      const response = await fetch(`/api/store/admin/products/manage?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        showError(`Delete product failed: ${result?.error || "Unknown error"}`);
        return;
      }

      refreshProducts();
    },
    [refreshProducts, showError, getAdminHeaders]
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
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-white font-semibold text-sm">Store products (products table)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (productForm.id === "") {
                  closeProductForm();
                } else {
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
                }
              }}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${productForm.id === "" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-800 text-slate-200 border-slate-700"}`}
            >
              {productForm.id === "" ? "✕ Cancel" : "+ New product"}
            </button>
            <button onClick={refreshProducts} className="p-1 text-slate-300" title="Refresh products">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New product form inline at top when no id set */}
        {productForm.id === "" && (
          <div className="space-y-2 p-3 rounded-lg border border-blue-500/30 bg-blue-950/20">
            <div className="flex items-center justify-between">
              <h4 className="text-white text-sm font-semibold">Create product</h4>
              <button onClick={closeProductForm} className="p-1 rounded-md hover:bg-white/10 text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            {renderProductFormFields()}
          </div>
        )}

        {products.map((p) => {
          const pid = p.id;
          const isEditing = productForm.id === pid;
          const media = <ImagePreview src={p.image_url || p.imageUrl} alt={`Product image: ${p.name || pid}`} />;
          return (
            <div key={pid} className="space-y-2">
              <Row
                title={`${p.name} (${p.category || "Uncategorized"})`}
                subtitle={`${useCurrencyLocaleStore.getState().formatPrice(p.price ?? 0)} • Status: ${p.status || (p.visible ? "ACTIVE" : "DRAFT")}`}
                meta={p.buy_url || p.buyUrl ? "Buy URL" : undefined}
                isEditing={isEditing}
                onEdit={() => {
                  if (isEditing) {
                    closeProductForm();
                  } else {
                    setProductForm({
                      id: pid,
                      name: p.name || "",
                      description: p.description || "",
                      price: String(p.price ?? "0"),
                      category: p.category || "",
                      imageUrl: p.image_url || p.imageUrl || "",
                      buyUrl: p.buy_url || p.buyUrl || "",
                      visible: p.status ? p.status === "ACTIVE" : Boolean(p.visible),
                      displayOrder: Number(p.display_order || p.details?.display_order || 0),
                    });
                  }
                }}
                onDelete={() => removeProduct(pid)}
              />
              {media ? <CollapsiblePreview label="Preview">{media}</CollapsiblePreview> : null}
              {isEditing && (
                <div className="space-y-2 p-3 rounded-lg border border-blue-500/30 bg-blue-950/20 animate-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white text-sm font-semibold">Edit product</h4>
                    <button onClick={closeProductForm} className="p-1 rounded-md hover:bg-white/10 text-slate-300"><X className="w-4 h-4" /></button>
                  </div>
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
              onClick={() => {
                if (vipForm.id === "") {
                  closeVipForm();
                } else {
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
                }
              }}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${vipForm.id === "" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-800 text-slate-200 border-slate-700"}`}
            >
              {vipForm.id === "" ? "✕ Cancel" : "+ New VIP item"}
            </button>
            <button onClick={refreshVipProducts} className="p-1 text-slate-300" title="Refresh VIP">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {vipForm.id === "" && (
          <div className="space-y-2 p-3 rounded-lg border border-blue-500/30 bg-blue-950/20">
            <div className="flex items-center justify-between">
              <h4 className="text-white text-sm font-semibold">Create VIP item</h4>
              <button onClick={closeVipForm} className="p-1 rounded-md hover:bg-white/10 text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            {renderVipFormFields()}
          </div>
        )}

        {vipProducts.map((p) => {
          const vid = p.id;
          const isEditing = vipForm.id === vid;
          const media = <ImagePreview src={p.image_url || p.imageUrl} alt={`VIP image: ${p.name || vid}`} />;
          const planPreview = p.planOptions ? (
            <pre className="text-xs text-slate-200 bg-slate-900/60 rounded-md border border-slate-700 p-2 whitespace-pre-wrap wrap-break-word">{p.planOptions}</pre>
          ) : null;

          return (
            <div key={vid} className="space-y-2">
              <Row
                title={`${p.name}`}
                subtitle={`${useCurrencyLocaleStore.getState().formatPrice(p.price ?? 0)} • Coming soon: ${p.coming_soon ? "yes" : "no"}`}
                meta={`Plans: ${Array.isArray(p.plan_options) ? p.plan_options.length : 0}`}
                isEditing={isEditing}
                onEdit={() => {
                  if (isEditing) {
                    closeVipForm();
                  } else {
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
                    });
                  }
                }}
                onDelete={() => removeVipProduct(vid)}
              />
              {media ? <CollapsiblePreview label="Preview">{media}</CollapsiblePreview> : null}
              {planPreview ? <CollapsiblePreview label="Plan options JSON">{planPreview}</CollapsiblePreview> : null}
              {isEditing && (
                <div className="space-y-2 p-3 rounded-lg border border-blue-500/30 bg-blue-950/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white text-sm font-semibold">Edit VIP item</h4>
                    <button onClick={closeVipForm} className="p-1 rounded-md hover:bg-white/10 text-slate-300"><X className="w-4 h-4" /></button>
                  </div>
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
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm cursor-pointer md:text-xs md:px-2 md:py-1">
          <Upload className="w-4 h-4 md:w-3 md:h-3" />
          <span>{productImageUploading ? "Uploading..." : "Upload image"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={handleProductImageFile}
            className="hidden"
            disabled={productImageUploading}
          />
        </label>
        <span className="text-[11px] text-slate-400">Max 200MB</span>
      </div>
      <ImagePreview src={productForm.imageUrl} alt="Product image preview" />
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
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm cursor-pointer md:text-xs md:px-2 md:py-1">
            <Upload className="w-4 h-4 md:w-3 md:h-3" />
            <span>{vipImageUploading ? "Uploading..." : "Upload image"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleVipImageFile}
              className="hidden"
              disabled={vipImageUploading}
            />
          </label>
          <span className="text-[11px] text-slate-400">Max 200MB</span>
        </div>
        <ImagePreview src={vipForm.imageUrl} alt="VIP image preview" />
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
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-white font-semibold text-sm">Services</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (serviceForm.id === "") {
                closeServiceForm();
              } else {
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
              }
            }}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${serviceForm.id === "" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-800 text-slate-200 border-slate-700"}`}
          >
            {serviceForm.id === "" ? "✕ Cancel" : "+ New service"}
          </button>
          <button onClick={refreshServices} className="p-1 text-slate-300" title="Refresh services">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {serviceForm.id === "" && (
        <div className="space-y-2 p-3 rounded-lg border border-blue-500/30 bg-blue-950/20">
          <div className="flex items-center justify-between">
            <h4 className="text-white text-sm font-semibold">Create service</h4>
            <button onClick={closeServiceForm} className="p-1 rounded-md hover:bg-white/10 text-slate-300"><X className="w-4 h-4" /></button>
          </div>
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
              isEditing={isEditing}
              onEdit={() => {
                if (isEditing) {
                  closeServiceForm();
                } else {
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
                  });
                }
              }}
              onDelete={() => removeService(sid)}
            />
            {media ? <CollapsiblePreview label="Preview">{media}</CollapsiblePreview> : null}
            {isEditing && (
              <div className="space-y-2 p-3 rounded-lg border border-blue-500/30 bg-blue-950/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-sm font-semibold">Edit service</h4>
                  <button onClick={closeServiceForm} className="p-1 rounded-md hover:bg-white/10 text-slate-300"><X className="w-4 h-4" /></button>
                </div>
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
    <div className="space-y-3">
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
    <div className="space-y-2">
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
    <div className="space-y-2">
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
    <div className="space-y-2">
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
  const chromeHeader = (
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
            <RefreshCw className="w-3 h-3" /> syncing
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
  );

  const TAB_DEFS: Array<{ key: typeof activeTab; label: string; icon: React.ReactNode }> = [
    { key: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { key: 'services', label: 'Services', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'livestream', label: 'Livestream', icon: <Video className="w-4 h-4" /> },
    { key: 'analysis', label: 'Analysis', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'recruits', label: 'VIP / Recruits', icon: <Crown className="w-4 h-4" /> },
    { key: 'course', label: 'Trading Course', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'affiliate', label: 'Affiliate Admin', icon: <Users className="w-4 h-4" /> },
    { key: 'email', label: 'Emails', icon: <Mail className="w-4 h-4" /> },
    { key: 'store', label: 'Store Analytics', icon: <ShoppingBag className="w-4 h-4" /> },
    { key: 'store_settings', label: 'Store Display', icon: <SettingsIcon /> },
    { key: 'crypto', label: 'Crypto Payments', icon: <Coins className="w-4 h-4" /> },
    { key: 'crypto_refunds', label: 'Crypto Refunds', icon: <RotateCcw className="w-4 h-4" /> },
    { key: 'faq', label: 'FAQ Editor', icon: <HelpCircle className="w-4 h-4" /> },
    { key: 'network', label: 'Network', icon: <Globe className="w-4 h-4" /> },
  ];

  const activeTabLabel = TAB_DEFS.find(t => t.key === activeTab)?.label || 'Sections';

  const tabsAndContent = (
    <>
      {/* Sections list (no horizontal scrolling) */}
      <div
        className="px-3 sm:px-4 py-2 border-b relative z-10"
        style={
          bwMode
            ? { background: '#ffffff', borderColor: 'rgba(0,0,0,0.10)' }
            : { background: 'rgba(15,23,42,0.60)', borderColor: 'rgba(30,41,59,1)' }
        }
      >
        <button
          type="button"
          onClick={() => setTabsListOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border"
          style={
            bwMode
              ? {
                  background: '#ffffff',
                  borderColor: 'rgba(0,0,0,0.12)',
                  color: '#111111',
                }
              : {
                  background: 'rgba(2,6,23,0.40)',
                  borderColor: 'rgba(30,41,59,1)',
                  color: 'rgb(226,232,240)',
                }
          }
          aria-expanded={tabsListOpen}
        >
          <span className="text-sm font-semibold">Sections: {activeTabLabel}</span>
          <span
            className="text-xs"
            style={bwMode ? { color: 'rgba(0,0,0,0.45)' } : { color: 'rgba(148,163,184,1)' }}
          >
            {tabsListOpen ? '▲' : '▼'}
          </span>
        </button>

        {tabsListOpen ? (
          <div className="mt-2 grid gap-1 max-h-80 overflow-y-auto">
            {TAB_DEFS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setTabsListOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors"
                  style={
                    bwMode
                      ? {
                          background: isActive ? 'rgba(0,0,0,0.06)' : '#ffffff',
                          borderColor: isActive ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.12)',
                          color: '#111111',
                        }
                      : undefined
                  }
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div
        className="p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-0"
        style={
          bwMode
            ? {
                background: '#ffffff',
                color: '#111111',
                WebkitOverflowScrolling: 'touch',
              }
            : {
                background: 'rgba(2,6,23,0.70)',
                WebkitOverflowScrolling: 'touch',
              }
        }
      >
                {!accessCheckComplete ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-slate-300 text-sm">
                    <RefreshCw className="w-4 h-4" /> Checking admin access...
                  </div>
                ) : isAdmin ? (
                  <div className="relative">
                    {/* All sub-panels render without heavy effects */}
                    {activeTab === "products" && renderProducts()}
                    {activeTab === "services" && renderServices()}
                    {activeTab === "livestream" && renderLivestream()}
                    {activeTab === "analysis" && renderAnalyses()}
                    {activeTab === "recruits" && renderRecruits()}
                    {activeTab === "course" && <CourseAdminPanel />}
                    {activeTab === "faq" && renderFaq()}
                    {activeTab === "email" && <EmailAdminPanel />}
                    {activeTab === "network" && <NetworkAdminPanel />}
                    {activeTab === "crypto" && <CryptoPaymentsAdminPanel />}
                    {activeTab === "crypto_refunds" && <CryptoRefundsAdminPanel />}
                    {activeTab === "store" && (
                      <div className="space-y-4">
                        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800 w-fit">
                          <button
                            onClick={() => setStoreView?.("analytics")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              (storeView || "analytics") === "analytics"
                                ? "bg-white text-black"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            Analytics
                          </button>
                          <button
                            onClick={() => setStoreView?.("promos")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              storeView === "promos"
                                ? "bg-white text-black"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            Promos & Gift Cards
                          </button>
                          <button
                            onClick={() => setStoreView?.("rewards")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              storeView === "rewards"
                                ? "bg-white text-black"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            Rewards
                          </button>
                          <button
                            onClick={() => setStoreView?.("messages")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              storeView === "messages"
                                ? "bg-white text-black"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            Messages
                          </button>
                        </div>
                        {(storeView || "analytics") === "analytics" && <StoreAnalyticsPanel />}
                        {storeView === "promos" && <StorePromoManager />}
                        {storeView === "rewards" && <RewardsAdminPanel />}
                        {storeView === "messages" && <NewsletterMessagesPanel />}
                      </div>
                    )}
                    {activeTab === "store_settings" && (
                      <div className="space-y-6">
                        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/70">
                          <h3 className="text-white font-semibold text-base mb-1">Store Display Mode</h3>
                          <p className="text-slate-400 text-sm mb-4">
                            Control what all users see on the store page. This changes the store for everyone visiting the website.
                          </p>

                          {/* Current status indicator */}
                          <div className="flex items-center gap-3 mb-5">
                            <div className={`w-3 h-3 rounded-full ${
                              storeDisplayMode === 'vip'
                                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : storeDisplayMode === 'timer'
                                  ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]'
                                  : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                            }`} />
                            <div>
                              <span className="text-white font-medium text-sm">
                                {storeDisplayMode === 'vip' ? 'VIP Products Only'
                                  : storeDisplayMode === 'timer' ? 'Countdown Timer Active'
                                  : 'Global Products (All Users)'}
                              </span>
                              <p className="text-slate-500 text-xs mt-0.5">
                                {storeDisplayMode === 'vip'
                                  ? 'Store is showing VIP products from the bullmoney_vip table to all visitors'
                                  : storeDisplayMode === 'timer'
                                    ? 'All products are hidden — visitors see a countdown timer teaser'
                                    : 'Store is showing regular products from the products table to all visitors'
                                }
                              </p>
                            </div>
                          </div>

                          {/* Mode selector cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Global card */}
                            <button
                              onClick={() => changeDisplayMode('global')}
                              disabled={displayModeLoading || storeDisplayMode === 'global'}
                              className={`p-4 rounded-xl border-2 transition-all text-left ${
                                storeDisplayMode === 'global'
                                  ? 'border-emerald-400 bg-emerald-950/30 ring-1 ring-emerald-400/20'
                                  : 'border-slate-700 bg-slate-800/50 hover:border-emerald-600 hover:bg-emerald-950/10 cursor-pointer'
                              } ${displayModeLoading ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="w-5 h-5 text-emerald-400" />
                                <span className="text-white text-sm font-bold">Global</span>
                                {storeDisplayMode === 'global' && (
                                  <span className="ml-auto text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                                )}
                              </div>
                              <p className="text-slate-400 text-xs leading-relaxed">Shows regular store products to all visitors</p>
                            </button>

                            {/* VIP card */}
                            <button
                              onClick={() => changeDisplayMode('vip')}
                              disabled={displayModeLoading || storeDisplayMode === 'vip'}
                              className={`p-4 rounded-xl border-2 transition-all text-left ${
                                storeDisplayMode === 'vip'
                                  ? 'border-amber-400 bg-amber-950/30 ring-1 ring-amber-400/20'
                                  : 'border-slate-700 bg-slate-800/50 hover:border-amber-600 hover:bg-amber-950/10 cursor-pointer'
                              } ${displayModeLoading ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Crown className="w-5 h-5 text-amber-400" />
                                <span className="text-white text-sm font-bold">VIP</span>
                                {storeDisplayMode === 'vip' && (
                                  <span className="ml-auto text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                                )}
                              </div>
                              <p className="text-slate-400 text-xs leading-relaxed">Shows VIP products to all visitors</p>
                            </button>

                            {/* Timer card */}
                            <button
                              onClick={() => changeDisplayMode('timer')}
                              disabled={displayModeLoading || storeDisplayMode === 'timer'}
                              className={`p-4 rounded-xl border-2 transition-all text-left ${
                                storeDisplayMode === 'timer'
                                  ? 'border-purple-400 bg-purple-950/30 ring-1 ring-purple-400/20'
                                  : 'border-slate-700 bg-slate-800/50 hover:border-purple-600 hover:bg-purple-950/10 cursor-pointer'
                              } ${displayModeLoading ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-purple-400" />
                                <span className="text-white text-sm font-bold">Timer</span>
                                {storeDisplayMode === 'timer' && (
                                  <span className="ml-auto text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                                )}
                              </div>
                              <p className="text-slate-400 text-xs leading-relaxed">Hides all products &amp; shows a countdown timer teaser</p>
                            </button>
                          </div>

                          {displayModeLoading && (
                            <div className="flex items-center justify-center gap-2 mt-3 text-slate-400 text-sm">
                              <RefreshCw className="w-4 h-4 animate-spin" /> Switching mode...
                            </div>
                          )}
                        </div>

                        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/70">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-white font-semibold text-base mb-1">VIP Shipping Cost</h3>
                              <p className="text-slate-400 text-sm">
                                Toggle whether VIP products are charged shipping in the cart.
                              </p>
                            </div>

                            <button
                              onClick={() => changeVipShipping(!vipShippingCharged)}
                              disabled={vipShippingLoading}
                              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                                vipShippingCharged
                                  ? 'bg-white text-black border-white/20'
                                  : 'bg-slate-800 text-white border-slate-600'
                              } ${vipShippingLoading ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                              {vipShippingLoading
                                ? 'Saving...'
                                : vipShippingCharged
                                  ? 'Shipping ON'
                                  : 'Shipping OFF'}
                            </button>
                          </div>

                          <div className="mt-3 text-xs text-slate-500">
                            {vipShippingCharged
                              ? 'VIP items follow normal shipping rules (free over $150).'
                              : 'VIP items do not contribute to shipping charges (cart shipping is based on non-VIP items only).'}
                          </div>
                        </div>

                        {/* Timer configuration panel */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          storeDisplayMode === 'timer'
                            ? 'border-purple-600 bg-purple-950/20'
                            : 'border-slate-700 bg-slate-900/70'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <h3 className="text-white font-semibold text-sm">Countdown Timer Settings</h3>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-slate-400 text-xs block mb-1.5">Timer End Date &amp; Time</label>
                              <input
                                type="datetime-local"
                                value={timerEnd ? new Date(timerEnd).toISOString().slice(0, 16) : ''}
                                onChange={(e) => setTimerEnd(e.target.value ? new Date(e.target.value).toISOString() : '')}
                                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm w-full focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-slate-400 text-xs block mb-1.5">Headline</label>
                              <input
                                type="text"
                                value={timerHeadline}
                                onChange={(e) => setTimerHeadline(e.target.value)}
                                placeholder="Something big is coming"
                                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm w-full focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-slate-400 text-xs block mb-1.5">Subtext</label>
                              <input
                                type="text"
                                value={timerSubtext}
                                onChange={(e) => setTimerSubtext(e.target.value)}
                                placeholder="New products dropping soon. Stay tuned."
                                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm w-full focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
                              />
                            </div>

                            {storeDisplayMode === 'timer' && (
                              <button
                                onClick={() => changeDisplayMode('timer')}
                                disabled={displayModeLoading}
                                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
                              >
                                {displayModeLoading ? 'Saving...' : 'Update Timer Settings'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                          <p className="text-xs text-slate-500">
                            All settings take effect immediately for every visitor. <strong className="text-slate-400">Global</strong> shows regular products. <strong className="text-slate-400">VIP</strong> shows VIP products from <span className="text-slate-300">bullmoney_vip</span>. <strong className="text-slate-400">Timer</strong> hides all products and shows a fullscreen countdown timer to tease upcoming drops.
                          </p>
                        </div>
                      </div>
                    )}
                    {activeTab === "affiliate" && (
                      <div className="space-y-4">
                        {/* Toggle between Calculator, Admin Panel, and QR Posters */}
                        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800 w-fit flex-wrap">
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
                          <button
                            onClick={() => setAffiliateView("qr-posters")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              affiliateView === "qr-posters"
                                ? "bg-white text-black"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            QR Posters
                          </button>
                          <button
                            onClick={() => setAffiliateView("content-editor")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              affiliateView === "content-editor"
                                ? "bg-white text-black"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            Content Editor
                          </button>
                        </div>

                        {/* Content */}
                        {affiliateView === "calculator" && <AdminAffiliateCalculator />}
                        {affiliateView === "admin" && <AffiliateAdminPanel />}
                        {affiliateView === "qr-posters" && <AffiliateQRPosterPanel />}
                        {affiliateView === "content-editor" && <AffiliateContentAdminPanel />}
                      </div>
                    )}
                  </div>
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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800/90 text-white px-3 py-2 text-sm border border-white/40">
          {toast}
        </div>
      ) : null}
    </>
  );

  const embeddedBody = (
    <div
      className="flex flex-col min-h-0 h-full w-full relative"
      data-adminhub-embedded={embedded ? 'true' : 'false'}
      data-adminhub-bw={bwMode ? 'true' : 'false'}
      style={bwMode ? { background: '#ffffff', color: '#111111' } : undefined}
    >
      {bwMode ? (
        <style
          // Scoped BW overrides (inline) — keeps Admin Hub black/white inside the drawer.
          // This intentionally overrides legacy slate/gradient utility classes used across subpanels.
          dangerouslySetInnerHTML={{
            __html: `
              [data-adminhub-bw="true"] { color: #111111; background: #ffffff; }
              [data-adminhub-bw="true"] * { color: inherit; }
              [data-adminhub-bw="true"] [class*="bg-"] { background: #ffffff !important; background-image: none !important; }
              [data-adminhub-bw="true"] [class*="from-"][class*="to-"] { background-image: none !important; }
              [data-adminhub-bw="true"] [class*="text-"] { color: #111111 !important; }
              [data-adminhub-bw="true"] [class*="border-"] { border-color: rgba(0,0,0,0.12) !important; }
              [data-adminhub-bw="true"] a { color: #111111 !important; }
              [data-adminhub-bw="true"] input,
              [data-adminhub-bw="true"] textarea,
              [data-adminhub-bw="true"] select {
                background: #ffffff !important;
                color: #111111 !important;
                border-color: rgba(0,0,0,0.18) !important;
              }
              [data-adminhub-bw="true"] button { color: #111111 !important; }
              [data-adminhub-bw="true"] svg { color: currentColor !important; }
            `,
          }}
        />
      ) : null}
      {showHeader ? chromeHeader : null}
      {tabsAndContent}
    </div>
  );

  if (!isOpen) return null;

  if (embedded) {
    return embeddedBody;
  }

  return (
    <div
      className="fixed inset-0 z-[2147483647] bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] overflow-y-auto border border-white/10 bg-linear-to-b from-slate-950 via-slate-900 to-black flex flex-col"
      >
        {embeddedBody}
      </div>
    </div>
  );
}

// Small inline settings icon to avoid extra lucide import weight
function SettingsIcon() {
  return <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
}

export default AdminHubModal;
