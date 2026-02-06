"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mail,
  RefreshCw,
  Save,
  Eye,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  Crown,
  ShoppingBag,
  Tag,
  DollarSign,
  BarChart3,
  Play,
  CheckCircle,
  Smartphone,
  Tablet,
  Monitor,
  Paperclip,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Clock,
  Users,
  Repeat,
  Zap,
  Calendar,
  Timer,
  Sun,
  Moon,
  Palette,
  Type,
  Layout,
  Settings2,
  Columns,
  Grid3X3,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { renderEmailTemplate, DEFAULT_STYLES, type EmailTemplateData, type EmailStyles } from "@/lib/email-template-renderer";

// Icon options for the hero section
const ICON_OPTIONS = [
  { value: "check", label: "Checkmark", icon: CheckCircle },
  { value: "play", label: "Play", icon: Play },
  { value: "crown", label: "Crown", icon: Crown },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "tag", label: "Tag", icon: Tag },
  { value: "dollar", label: "Dollar", icon: DollarSign },
  { value: "chart", label: "Chart", icon: BarChart3 },
  { value: "mail", label: "Mail", icon: Mail },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "promotion", label: "Promotion" },
  { value: "vip", label: "VIP" },
  { value: "course", label: "Course" },
  { value: "affiliate", label: "Affiliate" },
];

const SEND_TYPE_OPTIONS = [
  { value: "manual", label: "Manual", desc: "Send manually from admin", icon: Zap },
  { value: "recurring", label: "Recurring", desc: "Auto-send on schedule", icon: Repeat },
  { value: "once", label: "One-time", desc: "Send once at set time", icon: Timer },
  { value: "drip", label: "Drip", desc: "Part of email sequence", icon: Calendar },
];

const TARGET_AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "recruits", label: "Recruits Only" },
  { value: "vip", label: "VIP Members" },
  { value: "newsletter", label: "Newsletter Subscribers" },
  { value: "custom", label: "Custom List" },
];

const INTERVAL_PRESETS = [
  { value: 1, label: "Daily", hours: 24 },
  { value: 7, label: "Weekly", hours: 168 },
  { value: 14, label: "Bi-weekly", hours: 336 },
  { value: 30, label: "Monthly", hours: 720 },
  { value: 0, label: "Custom", hours: 0 },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const CONTENT_BLOCK_TYPES = [
  { value: "heading", label: "Heading" },
  { value: "paragraph", label: "Paragraph" },
  { value: "list", label: "Feature List" },
  { value: "benefits_list", label: "Benefits List" },
  { value: "products_table", label: "Products Table" },
  { value: "pricing_tiers", label: "Pricing Tiers" },
  { value: "links_grid", label: "Links Grid" },
  { value: "categories_grid", label: "Categories Grid" },
  { value: "promo_code", label: "Promo Code" },
  { value: "stats_grid", label: "Stats Grid" },
  { value: "testimonial", label: "Testimonial" },
  { value: "countdown", label: "Countdown" },
  { value: "section", label: "Section" },
  { value: "image", label: "Image" },
  { value: "button", label: "Button" },
];

const DEVICE_PRESETS = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: 600 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 480 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 375 },
];

interface EmailAttachment {
  id: string;
  type: "image" | "link" | "file";
  name: string;
  url: string;
  cid?: string;
}

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  hero_title: string;
  hero_subtitle: string;
  hero_icon: string;
  content_blocks: any[];
  primary_cta_text: string;
  primary_cta_url: string;
  secondary_cta_text: string;
  secondary_cta_url: string;
  footer_text: string;
  promo_code: string;
  promo_description: string;
  category: string;
  is_active: boolean;
  display_order: number;
  attachments?: EmailAttachment[];
  styles?: Partial<EmailStyles>;
  // Scheduling fields
  send_type?: string;
  interval_days?: number;
  interval_hours?: number;
  send_hour?: number;
  send_minute?: number;
  send_days_of_week?: number[];
  target_audience?: string;
  drip_sequence_number?: number;
  drip_days_after_signup?: number;
  last_sent_at?: string;
  next_scheduled_at?: string;
  total_sent?: number;
  total_opened?: number;
  total_clicked?: number;
  created_at?: string;
  updated_at?: string;
}

const defaultTemplate: Omit<EmailTemplate, "id" | "created_at" | "updated_at"> = {
  slug: "",
  name: "",
  subject: "",
  hero_title: "",
  hero_subtitle: "",
  hero_icon: "check",
  content_blocks: [],
  primary_cta_text: "",
  primary_cta_url: "",
  secondary_cta_text: "",
  secondary_cta_url: "",
  footer_text: "",
  promo_code: "",
  promo_description: "",
  category: "general",
  is_active: true,
  display_order: 0,
  attachments: [],
  styles: { ...DEFAULT_STYLES },
  // Scheduling defaults
  send_type: "manual",
  interval_days: 0,
  interval_hours: 0,
  send_hour: 9,
  send_minute: 0,
  send_days_of_week: [],
  target_audience: "all",
  drip_sequence_number: 0,
  drip_days_after_signup: 0,
};

// Style editor tabs
const STYLE_TABS = [
  { id: "colors", label: "Colors", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
  { id: "layout", label: "Layout", icon: Layout },
  { id: "buttons", label: "Buttons", icon: Settings2 },
];

export default function EmailAdminPanel() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>(defaultTemplate);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewMode, setPreviewMode] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [newAttachment, setNewAttachment] = useState<Partial<EmailAttachment>>({ type: "image", name: "", url: "" });
  const [editorMode, setEditorMode] = useState<"visual" | "split">("split");
  const [sendingToRecruits, setSendingToRecruits] = useState(false);
  const [recruitsCount, setRecruitsCount] = useState(0);
  const [styleTab, setStyleTab] = useState<"colors" | "typography" | "layout" | "buttons">("colors");
  const [showStyleEditor, setShowStyleEditor] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Load templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      const errorMsg = err?.message || err?.error_description || JSON.stringify(err) || "Unknown error";
      console.error("Load templates error:", errorMsg);
      showToast(`Failed to load: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Select template for editing
  const selectTemplate = useCallback((template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({ ...template, attachments: template.attachments || [] });
    setExpandedBlocks(new Set());
  }, []);

  // Create new template
  const createNewTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setEditForm({ ...defaultTemplate });
    setExpandedBlocks(new Set());
  }, []);

  // Save template
  const saveTemplate = useCallback(async () => {
    if (!editForm.slug || !editForm.name || !editForm.subject) {
      showToast("Slug, name, and subject are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: editForm.slug,
        name: editForm.name,
        subject: editForm.subject,
        hero_title: editForm.hero_title || "",
        hero_subtitle: editForm.hero_subtitle || "",
        hero_icon: editForm.hero_icon || "check",
        content_blocks: editForm.content_blocks || [],
        primary_cta_text: editForm.primary_cta_text || "",
        primary_cta_url: editForm.primary_cta_url || "",
        secondary_cta_text: editForm.secondary_cta_text || "",
        secondary_cta_url: editForm.secondary_cta_url || "",
        footer_text: editForm.footer_text || "",
        promo_code: editForm.promo_code || "",
        promo_description: editForm.promo_description || "",
        category: editForm.category || "general",
        is_active: editForm.is_active !== false,
        display_order: editForm.display_order || 0,
        attachments: editForm.attachments || [],
        styles: editForm.styles || DEFAULT_STYLES,
        // Scheduling fields
        send_type: editForm.send_type || "manual",
        interval_days: editForm.interval_days || 0,
        interval_hours: editForm.interval_hours || 0,
        send_hour: editForm.send_hour ?? 9,
        send_minute: editForm.send_minute ?? 0,
        send_days_of_week: editForm.send_days_of_week || [],
        target_audience: editForm.target_audience || "all",
        drip_sequence_number: editForm.drip_sequence_number || 0,
        drip_days_after_signup: editForm.drip_days_after_signup || 0,
      };

      if (selectedTemplate?.id) {
        const { error } = await supabase
          .from("email_templates")
          .update(payload)
          .eq("id", selectedTemplate.id);
        if (error) throw error;
        showToast("Template saved");
      } else {
        const { data, error } = await supabase
          .from("email_templates")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setSelectedTemplate(data);
          setEditForm(data);
        }
        showToast("Template created");
      }
      
      loadTemplates();
    } catch (err: any) {
      const errorMsg = err?.message || err?.error_description || JSON.stringify(err) || "Unknown error";
      console.error("Save template error:", errorMsg);
      showToast(`Save failed: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  }, [editForm, selectedTemplate, supabase, showToast, loadTemplates]);

  // Delete template
  const deleteTemplate = useCallback(async (id: string) => {
    if (!confirm("Delete this email template?")) return;
    
    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        setEditForm({ ...defaultTemplate });
      }
      
      loadTemplates();
      showToast("Template deleted");
    } catch (err: any) {
      const errorMsg = err?.message || err?.error_description || JSON.stringify(err) || "Unknown error";
      console.error("Delete template error:", errorMsg);
      showToast(`Delete failed: ${errorMsg}`);
    }
  }, [supabase, selectedTemplate, loadTemplates, showToast]);

  // Load recruits count
  const loadRecruitsCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("recruits")
        .select("*", { count: "exact", head: true });
      
      if (!error && count !== null) {
        setRecruitsCount(count);
      }
    } catch (err) {
      console.error("Load recruits count error:", err);
    }
  }, [supabase]);

  useEffect(() => {
    loadRecruitsCount();
  }, [loadRecruitsCount]);

  // Content block management
  const addContentBlock = useCallback((type: string) => {
    const newBlock = createDefaultBlock(type);
    setEditForm(f => ({
      ...f,
      content_blocks: [...(f.content_blocks || []), newBlock],
    }));
    setExpandedBlocks(prev => new Set([...prev, (editForm.content_blocks || []).length]));
  }, [editForm.content_blocks]);

  const updateContentBlock = useCallback((index: number, updates: any) => {
    setEditForm(f => {
      const blocks = [...(f.content_blocks || [])];
      blocks[index] = { ...blocks[index], ...updates };
      return { ...f, content_blocks: blocks };
    });
  }, []);

  const removeContentBlock = useCallback((index: number) => {
    setEditForm(f => ({
      ...f,
      content_blocks: (f.content_blocks || []).filter((_, i) => i !== index),
    }));
  }, []);

  const moveContentBlock = useCallback((index: number, direction: "up" | "down") => {
    setEditForm(f => {
      const blocks = [...(f.content_blocks || [])];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return f;
      [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
      return { ...f, content_blocks: blocks };
    });
  }, []);

  const toggleBlockExpansion = useCallback((index: number) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  // Attachment management
  const addAttachment = useCallback(() => {
    if (!newAttachment.name || !newAttachment.url) {
      showToast("Name and URL are required");
      return;
    }
    const attachment: EmailAttachment = {
      id: `att_${Date.now()}`,
      type: newAttachment.type || "image",
      name: newAttachment.name,
      url: newAttachment.url,
      cid: newAttachment.type === "image" ? `img_${Date.now()}` : undefined,
    };
    setEditForm(f => ({
      ...f,
      attachments: [...(f.attachments || []), attachment],
    }));
    setNewAttachment({ type: "image", name: "", url: "" });
    setShowAttachmentModal(false);
    showToast("Attachment added");
  }, [newAttachment, showToast]);

  const removeAttachment = useCallback((id: string) => {
    setEditForm(f => ({
      ...f,
      attachments: (f.attachments || []).filter(a => a.id !== id),
    }));
  }, []);

  // Merge styles with DEFAULT_STYLES for preview
  const mergedStyles = useMemo(() => {
    return {
      ...DEFAULT_STYLES,
      ...editForm.styles,
      colors: { ...DEFAULT_STYLES.colors, ...editForm.styles?.colors },
      darkMode: { ...DEFAULT_STYLES.darkMode, ...editForm.styles?.darkMode },
      lightMode: { ...DEFAULT_STYLES.lightMode, ...editForm.styles?.lightMode },
      typography: { ...DEFAULT_STYLES.typography, ...editForm.styles?.typography },
      spacing: { ...DEFAULT_STYLES.spacing, ...editForm.styles?.spacing },
      borders: { ...DEFAULT_STYLES.borders, ...editForm.styles?.borders },
      buttons: { ...DEFAULT_STYLES.buttons, ...editForm.styles?.buttons },
      layout: { ...DEFAULT_STYLES.layout, ...editForm.styles?.layout },
    } as EmailStyles;
  }, [editForm.styles]);

  // Generate preview HTML with mode support
  const previewHtml = useMemo(() => {
    if (!editForm.hero_title) return "";
    try {
      // Construct template with merged styles
      const templateWithStyles = {
        ...editForm,
        styles: mergedStyles,
      } as EmailTemplateData;
      const { html } = renderEmailTemplate(templateWithStyles, "preview@example.com", previewMode);
      return html;
    } catch {
      return "";
    }
  }, [editForm, mergedStyles, previewMode]);

  // Send test email - sends exactly what's in preview
  const sendTestEmail = useCallback(async () => {
    if (!testEmail) {
      showToast("Enter a test email address");
      return;
    }

    if (!previewHtml || !editForm.subject) {
      showToast("No preview content or subject to send");
      return;
    }

    setSendingTest(true);
    try {
      // Send the exact preview HTML - what you see is what gets sent
      const response = await fetch("/api/store/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          subject: editForm.subject,
          html: previewHtml,
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      showToast(`Test sent to ${testEmail}`);
    } catch (err: any) {
      const errorMsg = err?.message || err?.error_description || JSON.stringify(err) || "Unknown error";
      console.error("Send test error:", errorMsg);
      showToast(`Send failed: ${errorMsg}`);
    } finally {
      setSendingTest(false);
    }
  }, [testEmail, previewHtml, editForm.subject, showToast]);

  // Send email to all recruits - sends exactly what's in preview
  const sendToAllRecruits = useCallback(async () => {
    if (!editForm.name || !editForm.subject) {
      showToast("Template name and subject are required");
      return;
    }

    if (!previewHtml) {
      showToast("No preview content to send");
      return;
    }

    if (!confirm(`Send "${editForm.name}" to ${recruitsCount} recruits?\n\nThis will send exactly what you see in the preview.`)) return;

    setSendingToRecruits(true);
    try {
      // Send the exact preview HTML and subject - what you see is what gets sent
      const response = await fetch("/api/email/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customHtml: previewHtml,
          customSubject: editForm.subject,
          target: "recruits",
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      showToast(`Sent to ${result.sent || 0} recruits!`);
      loadRecruitsCount();
    } catch (err: any) {
      const errorMsg = err?.message || err?.error_description || JSON.stringify(err) || "Unknown error";
      console.error("Send to recruits error:", errorMsg);
      showToast(`Send failed: ${errorMsg}`);
    } finally {
      setSendingToRecruits(false);
    }
  }, [editForm.name, editForm.subject, previewHtml, recruitsCount, showToast, loadRecruitsCount]);

  const currentDeviceWidth = DEVICE_PRESETS.find(d => d.id === previewDevice)?.width || 600;

  return (
    <div className="space-y-4 bg-black dark:bg-black min-h-0 max-h-[70vh] overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Templates
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={createNewTemplate}
            className="px-3 py-1.5 text-xs rounded-md bg-white text-black border border-white/60 flex items-center gap-1 hover:bg-white/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> New
          </button>
          <button
            onClick={loadTemplates}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded-md bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          
          {/* Editor Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/60 rounded-md border border-slate-700 p-0.5">
            <button
              onClick={() => setEditorMode("visual")}
              className={`px-2 py-1 rounded text-xs transition-colors ${editorMode === "visual" ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}
            >
              Editor
            </button>
            <button
              onClick={() => setEditorMode("split")}
              className={`px-2 py-1 rounded text-xs transition-colors ${editorMode === "split" ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}
            >
              Split
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Vertical Layout for Split Mode */}
      <div className="flex flex-col gap-6 min-h-0">
        {/* Top: Preview Section (bigger, centered) */}
        {editorMode === "split" && (
          <div className="w-full">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 overflow-hidden flex flex-col" style={{ height: '60vh', maxHeight: '700px' }}>
              {/* Gmail Header */}
              <div className="px-4 py-3 border-b border-slate-700 bg-linear-to-r from-slate-800/80 to-slate-800/60 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    Email Preview
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* Send Now Button */}
                    <button
                      onClick={sendToAllRecruits}
                      disabled={sendingToRecruits || !previewHtml || !editForm.subject}
                      className="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white flex items-center gap-1.5 disabled:opacity-50 hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20"
                      title={!previewHtml ? "Add content to preview first" : !editForm.subject ? "Add email subject first" : `Send to ${recruitsCount} recruits`}
                    >
                      <Send className={`w-3 h-3 ${sendingToRecruits ? "animate-pulse" : ""}`} />
                      {sendingToRecruits ? "Sending..." : `Send to ${recruitsCount}`}
                    </button>
                    
                    {/* Style Editor Toggle */}
                    <button
                      onClick={() => setShowStyleEditor(!showStyleEditor)}
                      className={`p-1.5 rounded-md transition-all ${showStyleEditor ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"}`}
                      title="Style Editor"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                    
                    {/* Dark/Light Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg border border-slate-700 p-1">
                      <button
                        onClick={() => setPreviewMode("dark")}
                        className={`p-1.5 rounded-md transition-all ${previewMode === "dark" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                        title="Dark Mode"
                      >
                        <Moon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewMode("light")}
                        className={`p-1.5 rounded-md transition-all ${previewMode === "light" ? "bg-yellow-500 text-black" : "text-slate-400 hover:text-white"}`}
                        title="Light Mode"
                      >
                        <Sun className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Device Switcher */}
                    <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg border border-slate-700 p-1">
                      {DEVICE_PRESETS.map((device) => {
                        const Icon = device.icon;
                        return (
                          <button
                            key={device.id}
                            onClick={() => setPreviewDevice(device.id as typeof previewDevice)}
                            className={`p-1.5 rounded-md transition-all ${previewDevice === device.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                            title={`${device.label} (${device.width}px)`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Email header preview */}
                <div className="bg-slate-900/80 rounded-lg border border-slate-700 p-3 max-w-2xl mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">B</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm text-white font-medium truncate">Bullmoney</div>
                        <div className="text-[10px] text-slate-500 flex-shrink-0">Just now</div>
                      </div>
                      <div className="text-xs text-slate-500 truncate">to preview@example.com</div>
                      <div className="mt-1 text-sm text-white truncate font-medium">{editForm.subject || "Email Subject Line"}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Email Content - Centered */}
              <div className="flex-1 overflow-auto p-6 bg-linear-to-b from-slate-950 to-black flex justify-center">
                {previewHtml ? (
                  <div className="transition-all duration-300" style={{ width: `${currentDeviceWidth}px`, maxWidth: '100%' }}>
                    <div className={`${previewDevice !== "desktop" ? "border-4 border-slate-700 rounded-2xl overflow-hidden" : "rounded-lg overflow-hidden"}`}>
                      {previewDevice !== "desktop" && (
                        <div className="h-2 bg-slate-700 flex items-center justify-center">
                          <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
                        </div>
                      )}
                      {/* Iframe for accurate email rendering */}
                      <iframe
                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:0;background:#000;}</style></head><body>${previewHtml}</body></html>`}
                        className="w-full border-0"
                        style={{ height: '550px', minHeight: '450px' }}
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                      {previewDevice !== "desktop" && (
                        <div className="h-4 bg-slate-700 flex items-center justify-center">
                          <div className="w-8 h-1 bg-slate-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                      <Mail className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500">Fill in hero title to see preview</p>
                    <p className="text-xs text-slate-600 mt-1">Preview updates live as you type</p>
                  </div>
                )}
              </div>
              
              {/* Device Footer */}
              <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">{DEVICE_PRESETS.find(d => d.id === previewDevice)?.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{currentDeviceWidth}px</span>
                  <span className="text-[10px] text-green-400">● Live Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {recruitsCount} recruits
                  </span>
                </div>
              </div>
            </div>
            
            {/* Style Editor Panel - Inline below preview when open */}
            {showStyleEditor && (
              <div className="rounded-xl border border-purple-500/50 bg-slate-900/90 overflow-hidden mt-4">
                <div className="px-4 py-3 border-b border-slate-700 bg-purple-900/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-400" />
                      Style Editor
                      <span className="text-[10px] text-purple-300 ml-2">Changes apply instantly</span>
                    </span>
                    <button onClick={() => setShowStyleEditor(false)} className="p-1 text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Style Tabs */}
                  <div className="flex items-center gap-1 mt-3">
                    {STYLE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setStyleTab(tab.id as typeof styleTab)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                            styleTab === tab.id 
                              ? "bg-purple-600 text-white" 
                              : "text-slate-400 hover:text-white hover:bg-slate-700"
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-4 max-h-[350px] overflow-y-auto">
                  {/* Colors Tab */}
                  {styleTab === "colors" && (
                    <div className="space-y-4">
                      <div className="text-xs text-slate-400 mb-2">Base Colors (applied to {previewMode === "dark" ? "Dark" : "Light"} mode)</div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Primary Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.primary || "#3b82f6"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, primary: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.primary || "#3b82f6"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, primary: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Background</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.background || "#000000"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, background: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.background || "#000000"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, background: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Card Background</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.cardBg || "#111111"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, cardBg: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.cardBg || "#111111"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, cardBg: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Text Primary</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.textPrimary || "#ffffff"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, textPrimary: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.textPrimary || "#ffffff"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, textPrimary: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Text Muted</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.textMuted || "#888888"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, textMuted: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.textMuted || "#888888"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, textMuted: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Border Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.border || "#222222"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, border: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.border || "#222222"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, border: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Success Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.success || "#10b981"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, success: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.success || "#10b981"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, success: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Warning Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.warning || "#f59e0b"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, warning: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.warning || "#f59e0b"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, warning: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Link Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.link || "#3b82f6"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, link: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.link || "#3b82f6"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, link: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Primary Dark</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.colors?.primaryDark || "#1d4ed8"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, primaryDark: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.colors?.primaryDark || "#1d4ed8"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, colors: { ...DEFAULT_STYLES.colors, ...f.styles?.colors, primaryDark: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Mode-specific overrides */}
                      <div className="mt-6 pt-4 border-t border-slate-700">
                        <div className="text-xs text-purple-400 mb-3 flex items-center gap-2">
                          {previewMode === "dark" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                          {previewMode === "dark" ? "Dark" : "Light"} Mode Overrides
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Background Override</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={previewMode === "dark" ? (mergedStyles.darkMode?.background || "#000000") : (mergedStyles.lightMode?.background || "#ffffff")} onChange={(e) => { const key = previewMode === "dark" ? "darkMode" : "lightMode"; setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, [key]: { ...DEFAULT_STYLES[key], ...f.styles?.[key], background: e.target.value } } })); }} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                              <input type="text" value={previewMode === "dark" ? (mergedStyles.darkMode?.background || "#000000") : (mergedStyles.lightMode?.background || "#ffffff")} onChange={(e) => { const key = previewMode === "dark" ? "darkMode" : "lightMode"; setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, [key]: { ...DEFAULT_STYLES[key], ...f.styles?.[key], background: e.target.value } } })); }} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Text Override</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={previewMode === "dark" ? (mergedStyles.darkMode?.textPrimary || "#ffffff") : (mergedStyles.lightMode?.textPrimary || "#1a1a1a")} onChange={(e) => { const key = previewMode === "dark" ? "darkMode" : "lightMode"; setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, [key]: { ...DEFAULT_STYLES[key], ...f.styles?.[key], textPrimary: e.target.value } } })); }} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                              <input type="text" value={previewMode === "dark" ? (mergedStyles.darkMode?.textPrimary || "#ffffff") : (mergedStyles.lightMode?.textPrimary || "#1a1a1a")} onChange={(e) => { const key = previewMode === "dark" ? "darkMode" : "lightMode"; setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, [key]: { ...DEFAULT_STYLES[key], ...f.styles?.[key], textPrimary: e.target.value } } })); }} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Typography Tab */}
                  {styleTab === "typography" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Font Family</label>
                          <select value={mergedStyles.typography?.fontFamily || "-apple-system"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, typography: { ...DEFAULT_STYLES.typography, ...f.styles?.typography, fontFamily: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white">
                            <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">System UI</option>
                            <option value="Arial, Helvetica, sans-serif">Arial</option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="'Courier New', monospace">Courier New</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Hero Size</label>
                          <input type="text" value={mergedStyles.typography?.heroSize || "32px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, typography: { ...DEFAULT_STYLES.typography, ...f.styles?.typography, heroSize: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Heading Size</label>
                          <input type="text" value={mergedStyles.typography?.headingSize || "18px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, typography: { ...DEFAULT_STYLES.typography, ...f.styles?.typography, headingSize: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Body Size</label>
                          <input type="text" value={mergedStyles.typography?.bodySize || "16px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, typography: { ...DEFAULT_STYLES.typography, ...f.styles?.typography, bodySize: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Small Size</label>
                          <input type="text" value={mergedStyles.typography?.smallSize || "14px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, typography: { ...DEFAULT_STYLES.typography, ...f.styles?.typography, smallSize: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Line Height</label>
                          <input type="text" value={mergedStyles.typography?.lineHeight || "1.7"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, typography: { ...DEFAULT_STYLES.typography, ...f.styles?.typography, lineHeight: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Layout Tab */}
                  {styleTab === "layout" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Max Width</label>
                          <input type="text" value={mergedStyles.layout?.maxWidth || "600px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, layout: { ...DEFAULT_STYLES.layout, ...f.styles?.layout, maxWidth: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Grid Columns</label>
                          <select value={mergedStyles.layout?.columns || 2} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, layout: { ...DEFAULT_STYLES.layout, ...f.styles?.layout, columns: parseInt(e.target.value) } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white">
                            <option value={1}>1 Column</option>
                            <option value={2}>2 Columns</option>
                            <option value={3}>3 Columns</option>
                            <option value={4}>4 Columns</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Grid Gap</label>
                          <input type="text" value={mergedStyles.layout?.gridGap || "8px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, layout: { ...DEFAULT_STYLES.layout, ...f.styles?.layout, gridGap: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Container Padding</label>
                          <input type="text" value={mergedStyles.spacing?.containerPadding || "40px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, spacing: { ...DEFAULT_STYLES.spacing, ...f.styles?.spacing, containerPadding: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Card Padding</label>
                          <input type="text" value={mergedStyles.spacing?.cardPadding || "24px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, spacing: { ...DEFAULT_STYLES.spacing, ...f.styles?.spacing, cardPadding: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Section Gap</label>
                          <input type="text" value={mergedStyles.spacing?.sectionGap || "24px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, spacing: { ...DEFAULT_STYLES.spacing, ...f.styles?.spacing, sectionGap: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Border Radius</label>
                          <input type="text" value={mergedStyles.borders?.radius || "16px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, borders: { ...DEFAULT_STYLES.borders, ...f.styles?.borders, radius: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Border Width</label>
                          <input type="text" value={mergedStyles.borders?.width || "1px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, borders: { ...DEFAULT_STYLES.borders, ...f.styles?.borders, width: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Buttons Tab */}
                  {styleTab === "buttons" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] text-slate-500 block mb-1">Primary BG (CSS)</label>
                          <input type="text" value={mergedStyles.buttons?.primaryBg || "linear-gradient(135deg, #3b82f6, #1d4ed8)"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, primaryBg: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white font-mono" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Primary Text</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.buttons?.primaryText || "#ffffff"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, primaryText: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.buttons?.primaryText || "#ffffff"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, primaryText: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Primary Radius</label>
                          <input type="text" value={mergedStyles.buttons?.primaryRadius || "12px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, primaryRadius: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Primary Padding</label>
                          <input type="text" value={mergedStyles.buttons?.primaryPadding || "18px 48px"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, primaryPadding: e.target.value } } }))} className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Secondary Border</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.buttons?.secondaryBorder || "#3b82f6"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, secondaryBorder: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.buttons?.secondaryBorder || "#3b82f6"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, secondaryBorder: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Secondary Text</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={mergedStyles.buttons?.secondaryText || "#3b82f6"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, secondaryText: e.target.value } } }))} className="w-8 h-8 rounded cursor-pointer border border-slate-700" />
                            <input type="text" value={mergedStyles.buttons?.secondaryText || "#3b82f6"} onChange={(e) => setEditForm(f => ({ ...f, styles: { ...DEFAULT_STYLES, ...f.styles, buttons: { ...DEFAULT_STYLES.buttons, ...f.styles?.buttons, secondaryText: e.target.value } } }))} className="flex-1 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white font-mono" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Button Preview */}
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-xs text-slate-400 mb-3">Button Preview</div>
                        <div className="flex items-center justify-center gap-4 p-4 bg-slate-800 rounded-lg">
                          <button style={{ background: mergedStyles.buttons?.primaryBg || "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: mergedStyles.buttons?.primaryText || "#ffffff", borderRadius: mergedStyles.buttons?.primaryRadius || "12px", padding: mergedStyles.buttons?.primaryPadding || "18px 48px", border: "none", cursor: "pointer", fontWeight: 600 }}>Primary</button>
                          <button style={{ background: "transparent", color: mergedStyles.buttons?.secondaryText || "#3b82f6", borderRadius: mergedStyles.buttons?.secondaryRadius || "12px", padding: mergedStyles.buttons?.secondaryPadding || "14px 40px", border: `2px solid ${mergedStyles.buttons?.secondaryBorder || "#3b82f6"}`, cursor: "pointer", fontWeight: 600 }}>Secondary</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Bottom: Template List & Editor */}
        <div className="space-y-4">
          {/* Template List */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wider px-1">Templates ({templates.length})</div>
            <div className="grid gap-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? "border-blue-500/60 bg-blue-600/10 shadow-lg shadow-blue-500/10"
                      : "border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-medium text-sm truncate">{template.name}</div>
                      <div className="text-slate-400 text-xs truncate mt-0.5">{template.subject}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${template.is_active ? "bg-green-600/20 text-green-300 border border-green-500/30" : "bg-slate-700/50 text-slate-400 border border-slate-600/30"}`}>
                          {template.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="text-slate-500 text-[10px] capitalize">{template.category}</span>
                        {(template.attachments?.length || 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-500 text-[10px]">
                            <Paperclip className="w-2.5 h-2.5" />
                            {template.attachments?.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                      className="p-1.5 rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Form */}
          {(selectedTemplate || editForm.name !== undefined) && (
            <div className="space-y-4 p-4 rounded-xl border border-slate-700 bg-linear-to-b from-slate-900/90 to-slate-900/70">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold text-sm">
                  {selectedTemplate ? "Edit Template" : "New Template"}
                </h4>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs rounded-md bg-white text-black flex items-center gap-1 hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Slug</label>
                  <input
                    value={editForm.slug || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                    placeholder="welcome_email"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Name</label>
                  <input
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Welcome Email"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Subject Line</label>
                <input
                  value={editForm.subject || ""}
                  onChange={(e) => setEditForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Welcome to Bullmoney"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Hero Section */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-600 bg-linear-to-br from-slate-800/60 to-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="text-xs text-slate-300 font-medium">Hero Section</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Icon</label>
                    <select
                      value={editForm.hero_icon || "check"}
                      onChange={(e) => setEditForm(f => ({ ...f, hero_icon: e.target.value }))}
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                    >
                      {ICON_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Category</label>
                    <select
                      value={editForm.category || "general"}
                      onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                    >
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Hero Title</label>
                  <input
                    value={editForm.hero_title || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, hero_title: e.target.value }))}
                    placeholder="Welcome to Bullmoney"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Hero Subtitle</label>
                  <textarea
                    value={editForm.hero_subtitle || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, hero_subtitle: e.target.value }))}
                    placeholder="Get ready for exclusive drops..."
                    rows={2}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-600 bg-linear-to-br from-slate-800/60 to-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="text-xs text-slate-300 font-medium">Call to Action</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={editForm.primary_cta_text || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, primary_cta_text: e.target.value }))}
                    placeholder="Primary CTA Text"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={editForm.primary_cta_url || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, primary_cta_url: e.target.value }))}
                    placeholder="/store"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={editForm.secondary_cta_text || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, secondary_cta_text: e.target.value }))}
                    placeholder="Secondary CTA Text"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={editForm.secondary_cta_url || ""}
                    onChange={(e) => setEditForm(f => ({ ...f, secondary_cta_url: e.target.value }))}
                    placeholder="/VIP"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {/* Content Blocks */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-600 bg-linear-to-br from-slate-800/60 to-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <div className="text-xs text-slate-300 font-medium">Content Blocks</div>
                  </div>
                  <select
                    className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white"
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) { addContentBlock(e.target.value); e.target.value = ""; } }}
                  >
                    <option value="">+ Add...</option>
                    {CONTENT_BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {(editForm.content_blocks || []).map((block, idx) => (
                  <div key={idx} className="border border-slate-600 rounded-lg bg-slate-800/80 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-700/50" onClick={() => toggleBlockExpansion(idx)}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">#{idx + 1}</span>
                        <span className="text-xs text-white font-medium capitalize">{block.type?.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); moveContentBlock(idx, "up"); }} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveContentBlock(idx, "down"); }} disabled={idx === (editForm.content_blocks?.length || 0) - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); removeContentBlock(idx); }} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedBlocks.has(idx) ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                    {expandedBlocks.has(idx) && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-700">
                        <ContentBlockEditor block={block} onChange={(updates) => updateContentBlock(idx, updates)} />
                      </div>
                    )}
                  </div>
                ))}
                
                {(editForm.content_blocks || []).length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-sm">No content blocks added</div>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-600 bg-linear-to-br from-slate-800/60 to-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <div className="text-xs text-slate-300 font-medium">Attachments ({(editForm.attachments || []).length})</div>
                  </div>
                  <button onClick={() => setShowAttachmentModal(true)} className="px-2 py-1 text-xs rounded-md bg-slate-700 text-white flex items-center gap-1 hover:bg-slate-600">
                    <Paperclip className="w-3 h-3" /> Add
                  </button>
                </div>

                <div className="space-y-2">
                  {(editForm.attachments || []).map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        {att.type === "image" && <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                        {att.type === "link" && <LinkIcon className="w-4 h-4 text-green-400 flex-shrink-0" />}
                        {att.type === "file" && <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                        <div className="min-w-0">
                          <div className="text-xs text-white truncate">{att.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{att.url}</div>
                        </div>
                      </div>
                      <button onClick={() => removeAttachment(att.id)} className="p-1 text-red-400 hover:text-red-300 flex-shrink-0 ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(editForm.attachments || []).length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-xs">No attachments</div>
                  )}
                </div>
              </div>

              {/* Scheduling & Automation */}
              <div className="space-y-3 p-4 rounded-xl border border-blue-500/30 bg-linear-to-br from-blue-900/20 to-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="text-xs text-blue-300 font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Scheduling & Automation
                    </div>
                  </div>
                  {editForm.last_sent_at && (
                    <span className="text-[10px] text-slate-500">
                      Last sent: {new Date(editForm.last_sent_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Send Type */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SEND_TYPE_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setEditForm(f => ({ ...f, send_type: opt.value }))}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          editForm.send_type === opt.value
                            ? "border-blue-500/60 bg-blue-600/20"
                            : "border-slate-700 bg-slate-900/60 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`w-3 h-3 ${editForm.send_type === opt.value ? "text-blue-400" : "text-slate-400"}`} />
                          <span className="text-xs text-white font-medium">{opt.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Interval Settings (for recurring) */}
                {(editForm.send_type === "recurring" || editForm.send_type === "once") && (
                  <div className="space-y-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Schedule</div>
                    
                    {editForm.send_type === "recurring" && (
                      <div className="grid grid-cols-2 gap-2">
                        {INTERVAL_PRESETS.filter(p => p.value > 0).map(preset => (
                          <button
                            key={preset.value}
                            onClick={() => setEditForm(f => ({ ...f, interval_days: preset.value }))}
                            className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                              editForm.interval_days === preset.value
                                ? "border-blue-500/60 bg-blue-600/20 text-white"
                                : "border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Custom days/hours */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block">Days Interval</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.interval_days || 0}
                          onChange={(e) => setEditForm(f => ({ ...f, interval_days: parseInt(e.target.value) || 0 }))}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block">Hours Offset</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={editForm.interval_hours || 0}
                          onChange={(e) => setEditForm(f => ({ ...f, interval_hours: parseInt(e.target.value) || 0 }))}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                    
                    {/* Send Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block">Send Hour (0-23)</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={editForm.send_hour ?? 9}
                          onChange={(e) => setEditForm(f => ({ ...f, send_hour: parseInt(e.target.value) || 0 }))}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block">Send Minute (0-59)</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={editForm.send_minute ?? 0}
                          onChange={(e) => setEditForm(f => ({ ...f, send_minute: parseInt(e.target.value) || 0 }))}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                    
                    {/* Days of Week (for weekly) */}
                    {editForm.interval_days === 7 && (
                      <div>
                        <label className="text-[10px] text-slate-400 mb-1 block">Days of Week</label>
                        <div className="flex gap-1">
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day.value}
                              onClick={() => {
                                const current = editForm.send_days_of_week || [];
                                const updated = current.includes(day.value)
                                  ? current.filter(d => d !== day.value)
                                  : [...current, day.value];
                                setEditForm(f => ({ ...f, send_days_of_week: updated }));
                              }}
                              className={`px-2 py-1 text-[10px] rounded border transition-all ${
                                (editForm.send_days_of_week || []).includes(day.value)
                                  ? "border-blue-500/60 bg-blue-600/30 text-white"
                                  : "border-slate-700 text-slate-400"
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Drip Settings */}
                {editForm.send_type === "drip" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Sequence #</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.drip_sequence_number || 1}
                        onChange={(e) => setEditForm(f => ({ ...f, drip_sequence_number: parseInt(e.target.value) || 1 }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Days After Signup</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.drip_days_after_signup || 0}
                        onChange={(e) => setEditForm(f => ({ ...f, drip_days_after_signup: parseInt(e.target.value) || 0 }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Target Audience */}
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">Target Audience</label>
                  <select
                    value={editForm.target_audience || "all"}
                    onChange={(e) => setEditForm(f => ({ ...f, target_audience: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
                  >
                    {TARGET_AUDIENCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Stats */}
                {(editForm.total_sent ?? 0) > 0 && (
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-700">
                    <span>Sent: {editForm.total_sent || 0}</span>
                    <span>Opened: {editForm.total_opened || 0}</span>
                    <span>Clicked: {editForm.total_clicked || 0}</span>
                  </div>
                )}
              </div>

              {/* Send to All Recruits */}
              <div className="p-4 rounded-xl border border-green-500/30 bg-linear-to-br from-green-900/20 to-slate-800/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="text-xs text-green-300 font-medium flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      Send to Recruits
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{recruitsCount} users</span>
                </div>
                <button
                  onClick={sendToAllRecruits}
                  disabled={sendingToRecruits || !editForm.slug}
                  className="w-full px-4 py-2.5 text-sm rounded-lg bg-green-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-500 transition-colors"
                >
                  <Send className={`w-4 h-4 ${sendingToRecruits ? "animate-pulse" : ""}`} />
                  {sendingToRecruits ? "Sending..." : `Send "${editForm.name || 'Template'}" to All ${recruitsCount} Recruits`}
                </button>
              </div>

              {/* Footer & Settings */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-600 bg-linear-to-br from-slate-800/60 to-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <div className="text-xs text-slate-300 font-medium">Footer & Settings</div>
                </div>
                <textarea
                  value={editForm.footer_text || ""}
                  onChange={(e) => setEditForm(f => ({ ...f, footer_text: e.target.value }))}
                  placeholder="Footer text (optional)"
                  rows={2}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={editForm.is_active !== false} onChange={(e) => setEditForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-600 bg-slate-800 text-blue-500" />
                    Active
                  </label>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    Order:
                    <input type="number" value={editForm.display_order || 0} onChange={(e) => setEditForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} className="w-16 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white" />
                  </div>
                </div>
              </div>

              {/* Test Email */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-4 rounded-xl border border-blue-500/30 bg-blue-600/5">
                <div className="flex-1">
                  <label className="text-xs text-blue-300 mb-1 block">Send Test</label>
                  <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
                </div>
                <button onClick={sendTestEmail} disabled={sendingTest || !testEmail} className="px-4 py-2 sm:mt-5 text-sm rounded-lg bg-blue-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-500">
                  <Send className={`w-4 h-4 ${sendingTest ? "animate-pulse" : ""}`} />
                  {sendingTest ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Remove Old Right Panel - now integrated above */}

      </div>

      {/* Attachment Modal */}
      {showAttachmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-md bg-slate-900 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Add Attachment</h4>
              <button onClick={() => setShowAttachmentModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Type</label>
                <select value={newAttachment.type || "image"} onChange={(e) => setNewAttachment(a => ({ ...a, type: e.target.value as any }))} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
                  <option value="image">Image (inline)</option>
                  <option value="link">Link</option>
                  <option value="file">File</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Name</label>
                <input value={newAttachment.name || ""} onChange={(e) => setNewAttachment(a => ({ ...a, name: e.target.value }))} placeholder="Product Image" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">URL</label>
                <input value={newAttachment.url || ""} onChange={(e) => setNewAttachment(a => ({ ...a, url: e.target.value }))} placeholder="https://..." className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAttachmentModal(false)} className="flex-1 px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700">Cancel</button>
                <button onClick={addAttachment} className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800/95 text-white px-4 py-2 text-sm border border-white/20 shadow-lg z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

// Content Block Editor
function ContentBlockEditor({ block, onChange }: { block: any; onChange: (updates: any) => void }) {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "countdown":
      return <input value={block.text || ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Enter text..." className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />;

    case "promo_code":
      return (
        <div className="grid grid-cols-2 gap-2">
          <input value={block.code || ""} onChange={(e) => onChange({ code: e.target.value })} placeholder="SAVE20" className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />
          <input value={block.desc || ""} onChange={(e) => onChange({ desc: e.target.value })} placeholder="Use code:" className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />
        </div>
      );

    case "testimonial":
      return (
        <div className="space-y-2">
          <textarea value={block.quote || ""} onChange={(e) => onChange({ quote: e.target.value })} placeholder="Quote..." rows={2} className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white resize-none" />
          <input value={block.author || ""} onChange={(e) => onChange({ author: e.target.value })} placeholder="Author" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />
        </div>
      );

    case "section":
      return (
        <div className="space-y-2">
          <input value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} placeholder="Title" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />
          <textarea value={block.content || ""} onChange={(e) => onChange({ content: e.target.value })} placeholder="Content..." rows={3} className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white resize-none" />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <input value={block.url || ""} onChange={(e) => onChange({ url: e.target.value })} placeholder="Image URL" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />
          <input value={block.alt || ""} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Alt text" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />
          {block.url && <img src={block.url} alt={block.alt || ""} className="max-h-32 rounded-lg" />}
        </div>
      );

    case "button":
      return (
        <div className="grid grid-cols-2 gap-2">
          <input value={block.text || ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Button text" className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />
          <input value={block.url || ""} onChange={(e) => onChange({ url: e.target.value })} placeholder="/store" className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" />
        </div>
      );

    case "list":
    case "benefits_list":
    case "products_table":
    case "pricing_tiers":
    case "links_grid":
    case "categories_grid":
    case "stats_grid":
      return (
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 uppercase">Items (JSON)</div>
          <textarea
            value={JSON.stringify(block.items || [], null, 2)}
            onChange={(e) => { try { onChange({ items: JSON.parse(e.target.value) }); } catch {} }}
            rows={6}
            className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-xs text-white font-mono resize-none"
          />
        </div>
      );

    default:
      return <div className="text-xs text-slate-400 py-2">No editor for this block type</div>;
  }
}

function createDefaultBlock(type: string): any {
  switch (type) {
    case "heading":
    case "paragraph":
    case "countdown":
      return { type, text: "" };
    case "promo_code":
      return { type, code: "", desc: "" };
    case "testimonial":
      return { type, quote: "", author: "" };
    case "section":
      return { type, title: "", content: "" };
    case "image":
      return { type, url: "", alt: "" };
    case "button":
      return { type, text: "", url: "" };
    case "list":
    case "benefits_list":
      return { type, items: [{ title: "", desc: "", color: "#3b82f6" }] };
    case "products_table":
      return { type, items: [{ name: "", price: "", oldPrice: "", link: "" }] };
    case "pricing_tiers":
      return { type, items: [{ name: "", price: "", interval: "", featured: false }] };
    case "links_grid":
      return { type, items: [{ title: "", subtitle: "", url: "" }] };
    case "categories_grid":
      return { type, items: [{ name: "", price: "", link: "" }] };
    case "stats_grid":
      return { type, items: [{ label: "", value: "" }] };
    default:
      return { type };
  }
}
