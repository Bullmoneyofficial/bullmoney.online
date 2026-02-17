"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Mail,
  QrCode,
  RefreshCw,
  Search,
  Save,
  Send,
  Image as ImageIcon,
  FileText,
  Edit3,
  Eye,
  Copy,
  CheckCircle2,
  AlertTriangle,
  User,
  Palette,
  X,
} from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { createSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Constants
const LOGO_URL = "/bullmoney-logo.png";
const BASE_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://bullmoney.online";

interface AffiliateRecord {
  id: string | number;
  email: string;
  full_name?: string;
  affiliate_code?: string;
  image_url?: string;
  custom_referral_link?: string;
  created_at?: string;
}

interface PosterConfig {
  title: string;
  subtitle: string;
  showLogo: boolean;
  logoPosition: "left" | "right" | "top";
  qrSize: number;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  includeEmail: boolean;
  includeName: boolean;
  includeCode: boolean;
  borderRadius: number;
  padding: number;
}

const DEFAULT_POSTER_CONFIG: PosterConfig = {
  title: "Affiliate",
  subtitle: "BullMoney Partner",
  showLogo: true,
  logoPosition: "left",
  qrSize: 200,
  backgroundColor: "#ffffff",
  textColor: "#000000",
  accentColor: "#111111",
  includeEmail: true,
  includeName: true,
  includeCode: true,
  borderRadius: 16,
  padding: 32,
};

export default function AffiliateQRPosterPanel() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  
  // State
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateRecord | null>(null);
  const [posterConfig, setPosterConfig] = useState<PosterConfig>(DEFAULT_POSTER_CONFIG);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingQrUrl, setEditingQrUrl] = useState("");
  const [showQrEditor, setShowQrEditor] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  
  // Refs
  const posterRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  // Helper: load an image as a promise
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }, []);

  // Helper: generate a business card canvas for a given affiliate QR canvas
  const createBusinessCardCanvas = useCallback(async (
    qrCanvas: HTMLCanvasElement,
    affiliateCode: string,
    affiliateName: string,
    templateImg: HTMLImageElement,
  ): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = templateImg.naturalWidth;
    canvas.height = templateImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Draw the business card template
    ctx.drawImage(templateImg, 0, 0);

    // QR code overlay — aligned to QR box in template
    const qrX = 795;
    const qrY = 985;
    const qrSize = 215;
    const padding = 8;
    const radius = 16;

    // White background behind QR
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.roundRect(qrX - padding, qrY - padding, qrSize + padding * 2, qrSize + padding * 2, radius);
    ctx.fill();

    // Draw the QR code
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Draw affiliate code and name
    const codeLabel = affiliateCode ? affiliateCode.toUpperCase() : 'PARTNER';
    ctx.save();
    ctx.font = 'bold 28px Inter, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 5;
    ctx.fillText(`Code: ${codeLabel}`, 60, 1310);
    if (affiliateName) {
      ctx.font = '600 24px Inter, Arial, sans-serif';
      ctx.fillText(affiliateName, 60, 1345);
    }
    ctx.restore();

    return canvas;
  }, []);

  // Bulk download all affiliate QR codes + business cards bundled into a single ZIP file
  const handleBulkDownloadAllQRCodes = useCallback(async () => {
    if (affiliates.length === 0) {
      showToast('No affiliates to download', 'error');
      return;
    }
    setBulkDownloading(true);
    setBulkProgress({ current: 0, total: affiliates.length });
    try {
      const [JSZip, QRCodeLib] = await Promise.all([
        import('jszip').then(m => m.default || m),
        import('qrcode').then(m => m.default || m),
      ]);
      const zip = new JSZip();
      const qrFolder = zip.folder('qr-codes')!;
      const cardFolder = zip.folder('business-cards')!;

      // Pre-load the business card template once
      let businessCardTemplate: HTMLImageElement | null = null;
      try {
        businessCardTemplate = await loadImage('/F39D4E5B-1521-401C-9788-C44AA3A574FF.JPG');
      } catch {
        console.warn('Business card template not found — skipping business cards');
      }

      for (let i = 0; i < affiliates.length; i++) {
        const affiliate = affiliates[i];
        const code = affiliate.affiliate_code || 'no-code';
        const name = (affiliate.full_name || affiliate.email || code).replace(/[^a-zA-Z0-9_-]/g, '_');
        // Use same link format as affiliate dashboard — points to homepage pagemode
        const link = getReferralLink(affiliate);

        // Render QR to an offscreen canvas
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = 512;
        qrCanvas.height = 512;
        await QRCodeLib.toCanvas(qrCanvas, link, {
          width: 512,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });

        // Add QR code PNG to ZIP
        const qrBlob: Blob = await new Promise((resolve) =>
          qrCanvas.toBlob((b) => resolve(b!), 'image/png')
        );
        qrFolder.file(`bullmoney-qr-${code}-${name}.png`, qrBlob);

        // Generate business card and add to ZIP
        if (businessCardTemplate) {
          try {
            const cardCanvas = await createBusinessCardCanvas(
              qrCanvas,
              code,
              affiliate.full_name || '',
              businessCardTemplate,
            );
            const cardBlob: Blob = await new Promise((resolve) =>
              cardCanvas.toBlob((b) => resolve(b!), 'image/png')
            );
            cardFolder.file(`bullmoney-card-${code}-${name}.png`, cardBlob);
          } catch (cardErr) {
            console.warn(`Business card failed for ${code}:`, cardErr);
          }
        }

        setBulkProgress({ current: i + 1, total: affiliates.length });
      }

      // Generate ZIP and trigger single download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `bullmoney-all-qr-and-cards-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      showToast(`Downloaded ${affiliates.length} QR codes & business cards as ZIP`, 'success');
    } catch (err) {
      console.error('Bulk QR download failed:', err);
      showToast('Bulk download failed — check console for details', 'error');
    } finally {
      setBulkDownloading(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  }, [affiliates, loadImage, createBusinessCardCanvas, getReferralLink]);

  // Fetch affiliates
  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recruits")
        .select("id, email, full_name, affiliate_code, image_url, custom_referral_link, created_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setAffiliates((data || []) as AffiliateRecord[]);
    } catch (err) {
      console.error("Failed to fetch affiliates:", err);
      showToast("Failed to load affiliates", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // Generate referral link — matches affiliate dashboard format so QR scans land on homepage pagemode
  const getReferralLink = useCallback((affiliate: AffiliateRecord) => {
    if (affiliate.custom_referral_link) return affiliate.custom_referral_link;
    const code = affiliate.affiliate_code || "";
    if (!code) return `${BASE_URL}/`;
    
    const params = new URLSearchParams();
    params.set("ref", code);
    if (affiliate.id) params.set("aff_id", String(affiliate.id));
    if (affiliate.full_name) params.set("aff_name", affiliate.full_name);
    if (affiliate.email) params.set("aff_email", affiliate.email);
    params.set("aff_code", code);
    params.set("utm_source", "affiliate");
    params.set("utm_medium", "qr_poster");
    params.set("utm_campaign", "partner_link");
    
    return `${BASE_URL}/?${params.toString()}`;
  }, []);

  // Toast helper
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Filtered affiliates
  const filteredAffiliates = useMemo(() => {
    const s = search.toLowerCase();
    return affiliates.filter((a) =>
      a.email?.toLowerCase().includes(s) ||
      a.full_name?.toLowerCase().includes(s) ||
      a.affiliate_code?.toLowerCase().includes(s)
    );
  }, [affiliates, search]);

  // Copy affiliate code
  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, []);

  // Update affiliate's custom QR link
  const handleUpdateQrLink = useCallback(async () => {
    if (!selectedAffiliate) return;
    
    try {
      const { error } = await supabase
        .from("recruits")
        .update({ custom_referral_link: editingQrUrl || null })
        .eq("id", selectedAffiliate.id);
      
      if (error) throw error;
      
      // Update local state
      setAffiliates(prev => prev.map(a => 
        a.id === selectedAffiliate.id 
          ? { ...a, custom_referral_link: editingQrUrl || undefined }
          : a
      ));
      setSelectedAffiliate(prev => prev ? { ...prev, custom_referral_link: editingQrUrl || undefined } : null);
      
      showToast("QR link updated successfully", "success");
      setShowQrEditor(false);
    } catch (err) {
      console.error("Failed to update QR link:", err);
      showToast("Failed to update QR link", "error");
    }
  }, [selectedAffiliate, editingQrUrl, supabase]);

  // Generate poster as canvas
  const generatePosterCanvas = useCallback(async (format: "png" | "jpeg" = "png"): Promise<HTMLCanvasElement | null> => {
    if (!selectedAffiliate) return null;
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    const { 
      qrSize, backgroundColor, textColor, accentColor, 
      padding, borderRadius, showLogo, logoPosition,
      title, subtitle, includeEmail, includeName, includeCode 
    } = posterConfig;
    
    // Calculate dimensions
    const logoSize = 60;
    const headerHeight = showLogo ? logoSize + 20 : 0;
    const qrSectionHeight = qrSize + 40;
    const detailsHeight = 100;
    const width = Math.max(qrSize + padding * 2, 350);
    const height = padding + headerHeight + qrSectionHeight + detailsHeight + padding;
    
    canvas.width = width * 2; // 2x for high resolution
    canvas.height = height * 2;
    ctx.scale(2, 2);
    
    // Background with rounded corners
    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, borderRadius);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = accentColor + "30";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    let yOffset = padding;
    
    // Header with logo
    if (showLogo) {
      try {
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = reject;
          logo.src = LOGO_URL;
        });
        
        const logoX = logoPosition === "left" ? padding : (logoPosition === "right" ? width - padding - logoSize : (width - logoSize) / 2);
        ctx.drawImage(logo, logoX, yOffset, logoSize, logoSize);
      } catch (e) {
        // Draw placeholder if logo fails
        ctx.fillStyle = accentColor + "20";
        ctx.beginPath();
        ctx.roundRect(padding, yOffset, logoSize, logoSize, 8);
        ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.font = "bold 10px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("BULL", padding + logoSize / 2, yOffset + 30);
        ctx.fillText("MONEY", padding + logoSize / 2, yOffset + 42);
      }
      
      // Title next to logo
      if (logoPosition === "left") {
        ctx.fillStyle = textColor;
        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "left";
        ctx.fillText(title, padding + logoSize + 16, yOffset + 35);
        ctx.font = "14px system-ui";
        ctx.fillStyle = textColor + "99";
        ctx.fillText(subtitle, padding + logoSize + 16, yOffset + 55);
      }
      
      yOffset += headerHeight;
    } else {
      // Just title without logo
      ctx.fillStyle = textColor;
      ctx.font = "bold 28px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(title, width / 2, yOffset + 30);
      yOffset += 50;
    }
    
    // QR Code section
    const referralLink = getReferralLink(selectedAffiliate);
    
    // Create temp QR code canvas
    const tempCanvas = document.createElement("canvas");
    const qrElement = document.createElement("div");
    qrElement.style.display = "none";
    document.body.appendChild(qrElement);
    
    // Use QRCodeCanvas to render
    const qrCanvas = document.createElement("canvas");
    qrCanvas.width = qrSize;
    qrCanvas.height = qrSize;
    
    // Draw QR code manually using a simple approach
    // For actual QR generation, we'll capture from the visible QRCodeCanvas
    if (qrCanvasRef.current) {
      const qrX = (width - qrSize) / 2;
      ctx.drawImage(qrCanvasRef.current, qrX, yOffset, qrSize, qrSize);
    }
    
    yOffset += qrSize + 20;
    
    // Affiliate details under QR
    ctx.textAlign = "center";
    const detailsX = width / 2;
    
    if (includeName && selectedAffiliate.full_name) {
      ctx.fillStyle = textColor;
      ctx.font = "bold 16px system-ui";
      ctx.fillText(selectedAffiliate.full_name, detailsX, yOffset);
      yOffset += 22;
    }
    
    if (includeEmail && selectedAffiliate.email) {
      ctx.fillStyle = textColor + "BB";
      ctx.font = "14px system-ui";
      ctx.fillText(selectedAffiliate.email, detailsX, yOffset);
      yOffset += 20;
    }
    
    if (includeCode && selectedAffiliate.affiliate_code) {
      ctx.fillStyle = accentColor;
      ctx.font = "bold 14px system-ui";
      ctx.fillText(`Code: ${selectedAffiliate.affiliate_code}`, detailsX, yOffset);
    }
    
    return canvas;
  }, [selectedAffiliate, posterConfig, getReferralLink]);

  // Download poster
  const handleDownloadPoster = useCallback(async (format: "png" | "jpeg" | "svg") => {
    if (!selectedAffiliate) return;
    
    try {
      if (format === "svg") {
        // For SVG, we'll create a simple SVG representation
        const referralLink = getReferralLink(selectedAffiliate);
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <rect width="400" height="500" fill="${posterConfig.backgroundColor}" rx="${posterConfig.borderRadius}"/>
  <text x="200" y="40" text-anchor="middle" font-family="system-ui" font-size="24" font-weight="bold" fill="${posterConfig.textColor}">${posterConfig.title}</text>
  <text x="200" y="60" text-anchor="middle" font-family="system-ui" font-size="12" fill="${posterConfig.textColor}99">${posterConfig.subtitle}</text>
  <rect x="100" y="80" width="200" height="200" fill="#f0f0f0" rx="8"/>
  <text x="200" y="180" text-anchor="middle" font-family="system-ui" font-size="10" fill="#666">QR Code: ${referralLink}</text>
  ${posterConfig.includeName && selectedAffiliate.full_name ? `<text x="200" y="310" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="bold" fill="${posterConfig.textColor}">${selectedAffiliate.full_name}</text>` : ""}
  ${posterConfig.includeEmail ? `<text x="200" y="335" text-anchor="middle" font-family="system-ui" font-size="14" fill="${posterConfig.textColor}BB">${selectedAffiliate.email}</text>` : ""}
  ${posterConfig.includeCode && selectedAffiliate.affiliate_code ? `<text x="200" y="360" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="bold" fill="${posterConfig.accentColor}">Code: ${selectedAffiliate.affiliate_code}</text>` : ""}
</svg>`;
        
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `affiliate-poster-${selectedAffiliate.affiliate_code || selectedAffiliate.id}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("SVG downloaded", "success");
        return;
      }
      
      // For PNG/JPEG, use html2canvas approach or canvas
      if (posterRef.current) {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(posterRef.current, {
          backgroundColor: posterConfig.backgroundColor,
        } as any);
        
        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, 0.95);
        
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `affiliate-poster-${selectedAffiliate.affiliate_code || selectedAffiliate.id}.${format}`;
        a.click();
        
        showToast(`${format.toUpperCase()} downloaded`, "success");
      }
    } catch (err) {
      console.error("Download failed:", err);
      showToast("Download failed", "error");
    }
  }, [selectedAffiliate, posterConfig, getReferralLink]);

  // Send poster via email
  const handleSendPoster = useCallback(async () => {
    if (!selectedAffiliate) return;
    
    const targetEmail = customEmail || selectedAffiliate.email;
    if (!targetEmail) {
      showToast("Please enter an email address", "error");
      return;
    }
    
    setSending(true);
    
    try {
      // Generate poster image
      if (posterRef.current) {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(posterRef.current, {
          backgroundColor: posterConfig.backgroundColor,
        } as any);
        
        const imageDataUrl = canvas.toDataURL("image/png", 0.95);
        
        // Send via API
        const response = await fetch("/api/affiliate-admin/send-qr-poster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: targetEmail,
            affiliateName: selectedAffiliate.full_name || "Affiliate",
            affiliateCode: selectedAffiliate.affiliate_code || "",
            posterImage: imageDataUrl,
            referralLink: getReferralLink(selectedAffiliate),
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send email");
        }
        
        showToast(`Poster sent to ${targetEmail}`, "success");
        setCustomEmail("");
      }
    } catch (err: any) {
      console.error("Send failed:", err);
      showToast(err.message || "Failed to send poster", "error");
    } finally {
      setSending(false);
    }
  }, [selectedAffiliate, customEmail, posterConfig, getReferralLink]);

  // Render affiliate list item
  const renderAffiliateItem = (affiliate: AffiliateRecord) => {
    const isSelected = selectedAffiliate?.id === affiliate.id;
    
    return (
      <button
        key={affiliate.id}
        onClick={() => {
          setSelectedAffiliate(affiliate);
          setEditingQrUrl(affiliate.custom_referral_link || "");
          setShowPreview(true);
        }}
        className={cn(
          "w-full text-left p-3 rounded-xl border transition-all",
          isSelected
            ? "border-black bg-black/5"
            : "border-black/10 hover:border-black/20 hover:bg-black/2"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center overflow-hidden">
            {affiliate.image_url ? (
              <img src={affiliate.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-black/40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-black truncate">
              {affiliate.full_name || affiliate.email}
            </p>
            <p className="text-xs text-black/50 truncate">{affiliate.email}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-mono text-black/70">
              {affiliate.affiliate_code || "No code"}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-black">QR Code & Poster Manager</h2>
          <p className="text-sm text-black/50">Create, customize, and send affiliate QR posters</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkDownloadAllQRCodes}
            disabled={bulkDownloading || loading || affiliates.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-black/20 bg-black text-white text-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {bulkDownloading
              ? `Generating ${bulkProgress.current}/${bulkProgress.total}...`
              : `Download All QR & Cards (${affiliates.length})`}
          </button>
          <button
            onClick={fetchAffiliates}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-black/20 bg-white hover:bg-black/5 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Affiliate List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search affiliates..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/15 bg-white text-sm focus:outline-none focus:border-black/30"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-8 text-black/50">Loading affiliates...</div>
            ) : filteredAffiliates.length === 0 ? (
              <div className="text-center py-8 text-black/50">No affiliates found</div>
            ) : (
              filteredAffiliates.map(renderAffiliateItem)
            )}
          </div>
        </div>

        {/* Poster Preview & Config */}
        <div className="space-y-4">
          {selectedAffiliate ? (
            <>
              {/* QR Editor */}
              <div className="p-4 rounded-xl border border-black/15 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-black">QR Code Link</h3>
                  <button
                    onClick={() => setShowQrEditor(!showQrEditor)}
                    className="text-xs text-black/60 hover:text-black flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {showQrEditor ? "Hide" : "Edit"}
                  </button>
                </div>
                
                {showQrEditor ? (
                  <div className="space-y-3">
                    <input
                      value={editingQrUrl}
                      onChange={(e) => setEditingQrUrl(e.target.value)}
                      placeholder="Custom referral URL (leave empty for default)"
                      className="w-full px-3 py-2 rounded-lg border border-black/15 text-sm focus:outline-none focus:border-black/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateQrLink}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/90"
                      >
                        <Save className="w-4 h-4" /> Save Link
                      </button>
                      <button
                        onClick={() => {
                          setEditingQrUrl(selectedAffiliate.custom_referral_link || "");
                          setShowQrEditor(false);
                        }}
                        className="px-4 py-2 rounded-lg border border-black/20 text-sm font-medium hover:bg-black/5"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-black/50">
                      Current: {getReferralLink(selectedAffiliate)}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-black/5 text-xs font-mono truncate">
                      {getReferralLink(selectedAffiliate)}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getReferralLink(selectedAffiliate));
                        showToast("Link copied", "success");
                      }}
                      className="p-2 rounded-lg border border-black/15 hover:bg-black/5"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Poster Config */}
              <div className="p-4 rounded-xl border border-black/15 bg-white">
                <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Customize Poster
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-black/60 mb-1">Title</label>
                    <input
                      value={posterConfig.title}
                      onChange={(e) => setPosterConfig(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-black/15 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-black/60 mb-1">Subtitle</label>
                    <input
                      value={posterConfig.subtitle}
                      onChange={(e) => setPosterConfig(p => ({ ...p, subtitle: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-black/15 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-black/60 mb-1">Background</label>
                    <input
                      type="color"
                      value={posterConfig.backgroundColor}
                      onChange={(e) => setPosterConfig(p => ({ ...p, backgroundColor: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-black/15 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-black/60 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={posterConfig.textColor}
                      onChange={(e) => setPosterConfig(p => ({ ...p, textColor: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-black/15 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-black/60 mb-1">QR Size</label>
                    <input
                      type="number"
                      value={posterConfig.qrSize}
                      onChange={(e) => setPosterConfig(p => ({ ...p, qrSize: Number(e.target.value) }))}
                      min={100}
                      max={400}
                      className="w-full px-3 py-2 rounded-lg border border-black/15 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={posterConfig.showLogo}
                      onChange={(e) => setPosterConfig(p => ({ ...p, showLogo: e.target.checked }))}
                      className="rounded border-black/20"
                    />
                    Show Logo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={posterConfig.includeName}
                      onChange={(e) => setPosterConfig(p => ({ ...p, includeName: e.target.checked }))}
                      className="rounded border-black/20"
                    />
                    Include Name
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={posterConfig.includeEmail}
                      onChange={(e) => setPosterConfig(p => ({ ...p, includeEmail: e.target.checked }))}
                      className="rounded border-black/20"
                    />
                    Include Email
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={posterConfig.includeCode}
                      onChange={(e) => setPosterConfig(p => ({ ...p, includeCode: e.target.checked }))}
                      className="rounded border-black/20"
                    />
                    Include Code
                  </label>
                </div>
              </div>

              {/* Poster Preview */}
              <div className="p-4 rounded-xl border border-black/15 bg-white">
                <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </h3>
                
                <div 
                  ref={posterRef}
                  className="mx-auto max-w-[350px] p-6 rounded-2xl text-center"
                  style={{ 
                    backgroundColor: posterConfig.backgroundColor,
                    color: posterConfig.textColor,
                  }}
                >
                  {/* Header with Logo */}
                  <div className="flex items-center gap-3 mb-4">
                    {posterConfig.showLogo && (
                      <img 
                        src={LOGO_URL} 
                        alt="BullMoney" 
                        className="w-14 h-14 rounded-xl object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="text-left flex-1">
                      <h4 className="text-xl font-bold">{posterConfig.title}</h4>
                      <p className="text-sm opacity-60">{posterConfig.subtitle}</p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="inline-block bg-white p-3 rounded-xl mb-4">
                    <QRCodeCanvas
                      ref={qrCanvasRef}
                      value={getReferralLink(selectedAffiliate)}
                      size={posterConfig.qrSize}
                      includeMargin
                      level="H"
                    />
                  </div>

                  {/* Affiliate Details */}
                  <div className="space-y-1">
                    {posterConfig.includeName && selectedAffiliate.full_name && (
                      <p className="font-bold text-lg">{selectedAffiliate.full_name}</p>
                    )}
                    {posterConfig.includeEmail && (
                      <p className="text-sm opacity-70">{selectedAffiliate.email}</p>
                    )}
                    {posterConfig.includeCode && selectedAffiliate.affiliate_code && (
                      <p className="font-bold text-sm mt-2" style={{ color: posterConfig.accentColor }}>
                        Code: {selectedAffiliate.affiliate_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 rounded-xl border border-black/15 bg-white space-y-4">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download & Send
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDownloadPoster("png")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-black/20 text-sm font-medium hover:bg-black/5"
                  >
                    <ImageIcon className="w-4 h-4" /> PNG
                  </button>
                  <button
                    onClick={() => handleDownloadPoster("jpeg")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-black/20 text-sm font-medium hover:bg-black/5"
                  >
                    <ImageIcon className="w-4 h-4" /> JPEG
                  </button>
                  <button
                    onClick={() => handleDownloadPoster("svg")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-black/20 text-sm font-medium hover:bg-black/5"
                  >
                    <FileText className="w-4 h-4" /> SVG
                  </button>
                </div>

                <div className="pt-3 border-t border-black/10">
                  <label className="block text-xs text-black/60 mb-2">Send poster via email</label>
                  <div className="flex gap-2">
                    <input
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder={selectedAffiliate.email || "Enter email"}
                      className="flex-1 px-3 py-2 rounded-lg border border-black/15 text-sm focus:outline-none focus:border-black/30"
                    />
                    <button
                      onClick={handleSendPoster}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/90 disabled:opacity-50"
                    >
                      {sending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                  <p className="text-xs text-black/50 mt-2">
                    Will send as PNG attachment + all file format links
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <QrCode className="w-12 h-12 text-black/20 mb-4" />
              <h3 className="font-semibold text-black/70 mb-2">Select an Affiliate</h3>
              <p className="text-sm text-black/50">Choose an affiliate from the list to create their QR poster</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div 
          className={cn(
            "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium",
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
