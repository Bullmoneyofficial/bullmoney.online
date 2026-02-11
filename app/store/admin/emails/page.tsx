'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Save, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Code, 
  Palette, 
  X, 
  Send, 
  FileText, 
  Copy, 
  Check 
} from 'lucide-react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/shop/admin/AdminSidebar';
import { supabase } from '@/lib/supabase';

// ============================================================================
// ADMIN EMAIL TEMPLATES EDITOR
// Full CRUD for email_templates table with live preview + variable injection
// ============================================================================

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  html_body: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SAMPLE_VARIABLES: Record<string, Record<string, string>> = {
  order_confirmation: {
    customer_name: 'John Smith',
    order_number: 'BM-20260115-ABC12',
    order_items_html: `
      <tr><td style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
        <p style="margin:0;color:#fff;font-weight:500;">Bullmoney Classic Tee</p>
        <p style="margin:4px 0 0;color:#888;font-size:13px;">Qty: 2</p>
      </td><td style="padding:12px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#fff;">$59.98</td></tr>`,
    subtotal: '59.98',
    shipping: 'Free',
    tax: '4.80',
    discount: '0.00',
    total: '64.78',
    shipping_address: '123 Bull St, New York, NY 10001, US',
  },
  order_shipped: {
    customer_name: 'John Smith',
    order_number: 'BM-20260115-ABC12',
    tracking_number: '1Z999AA10123456784',
    tracking_url: 'https://track.example.com/1Z999AA10123456784',
  },
  order_delivered: {
    customer_name: 'John Smith',
    order_number: 'BM-20260115-ABC12',
  },
  back_in_stock: {
    customer_name: 'John Smith',
    product_name: 'Bullmoney Premium Hoodie',
    product_url: 'https://bullmoney.com/store/product/premium-hoodie',
    product_image: '',
  },
  gift_card: {
    recipient_name: 'Jane Doe',
    sender_name: 'John Smith',
    gift_card_code: 'GIFT-ABC123DEF',
    amount: '50.00',
    message: 'Enjoy some premium trading gear!',
  },
  welcome_subscriber: {
    customer_name: 'John Smith',
    discount_code: 'WELCOME10',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  order: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  notification: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  marketing: 'bg-green-500/20 text-green-400 border-green-500/30',
  gift: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function replaceVariables(html: string, variables: Record<string, string>): string {
  let result = html;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return result;
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedHtmlBody, setEditedHtmlBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [sendTestLoading, setSendTestLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
      if (data && data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
        setEditedSubject(data[0].subject);
        setEditedHtmlBody(data[0].html_body);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedHtmlBody(template.html_body);
    setShowPreview(false);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    setSaveStatus('idle');

    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: editedSubject,
          html_body: editedHtmlBody,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      setSaveStatus('success');
      setSelectedTemplate({ 
        ...selectedTemplate, 
        subject: editedSubject, 
        html_body: editedHtmlBody,
        updated_at: new Date().toISOString(),
      });
      setTemplates(prev => 
        prev.map(t => t.id === selectedTemplate.id 
          ? { ...t, subject: editedSubject, html_body: editedHtmlBody, updated_at: new Date().toISOString() }
          : t
        )
      );

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save template:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !testEmail) return;
    setSendTestLoading(true);

    try {
      const sampleVars = SAMPLE_VARIABLES[selectedTemplate.slug] || {};
      const previewHtml = replaceVariables(editedHtmlBody, sampleVars);
      const previewSubject = replaceVariables(editedSubject, sampleVars);

      const res = await fetch('/api/store/order-email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: `[TEST] ${previewSubject}`,
          html: previewHtml,
        }),
      });

      if (!res.ok) throw new Error('Failed to send test email');
      setShowTestModal(false);
      setTestEmail('');
    } catch (err) {
      console.error('Failed to send test email:', err);
    } finally {
      setSendTestLoading(false);
    }
  };

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(`{{${varName}}}`);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const hasChanges = selectedTemplate && 
    (editedSubject !== selectedTemplate.subject || editedHtmlBody !== selectedTemplate.html_body);

  const previewHtml = selectedTemplate 
    ? replaceVariables(editedHtmlBody, SAMPLE_VARIABLES[selectedTemplate.slug] || {})
    : '';

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <div className="md:ml-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-4">
              <Link href="/store/admin" className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-white/60" />
                <h1 className="text-lg font-medium">Email Templates</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Send Test */}
              {selectedTemplate && (
                <button
                  onClick={() => setShowTestModal(true)}
                  className="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send Test</span>
                </button>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`h-9 px-5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                  ${hasChanges 
                    ? 'bg-white text-black hover:bg-white/90' 
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saveStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-64px)]">
          {/* Template List - Left Panel */}
          <div className="w-72 border-r border-white/10 overflow-y-auto shrink-0 hidden lg:block">
            <div className="p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Templates</p>
              <div className="space-y-1">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                  ))
                ) : (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={`w-full p-3 rounded-xl text-left transition-colors
                        ${selectedTemplate?.id === template.id 
                          ? 'bg-white/10 border border-white/20' 
                          : 'hover:bg-white/5 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-white/40 shrink-0" />
                        <span className="text-sm font-medium truncate">{template.name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[template.category] || 'bg-white/10 text-white/60 border-white/20'}`}>
                          {template.category}
                        </span>
                        {!template.is_active && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            inactive
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mobile Template Selector */}
          <div className="lg:hidden w-full px-4 pt-4">
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const t = templates.find(t => t.id === e.target.value);
                if (t) selectTemplate(t);
              }}
              className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm appearance-none focus:outline-none focus:border-white/20"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id} className="bg-black">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Editor Area */}
          {selectedTemplate ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Subject Line */}
              <div className="px-6 py-4 border-b border-white/10">
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Subject Line</label>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Email subject..."
                />
                <p className="text-xs text-white/30 mt-1.5">
                  Use {'{{variable_name}}'} for dynamic content. Available: {selectedTemplate.variables?.join(', ') || 'none'}
                </p>
              </div>

              {/* Toggle Bar */}
              <div className="px-6 py-3 border-b border-white/10 flex items-center gap-4">
                <button
                  onClick={() => { setShowCode(true); setShowPreview(false); }}
                  className={`flex items-center gap-2 text-sm transition-colors ${showCode && !showPreview ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Code className="w-4 h-4" />
                  HTML
                </button>
                <button
                  onClick={() => { setShowPreview(true); setShowCode(false); }}
                  className={`flex items-center gap-2 text-sm transition-colors ${showPreview && !showCode ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => { setShowCode(true); setShowPreview(true); }}
                  className={`flex items-center gap-2 text-sm transition-colors ${showCode && showPreview ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Palette className="w-4 h-4" />
                  Split
                </button>

                <div className="flex-1" />

                {/* Variables Quick Insert */}
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {selectedTemplate.variables?.map((v) => (
                    <button
                      key={v}
                      onClick={() => copyVariable(v)}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
                      title={`Copy {{${v}}} to clipboard`}
                    >
                      {copiedVar === v ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code + Preview Split */}
              <div className="flex-1 flex overflow-hidden">
                {/* Code Editor */}
                {showCode && (
                  <div className={`${showPreview ? 'w-1/2 border-r border-white/10' : 'w-full'} overflow-hidden flex flex-col`}>
                    <textarea
                      value={editedHtmlBody}
                      onChange={(e) => setEditedHtmlBody(e.target.value)}
                      className="flex-1 w-full p-6 bg-transparent text-sm font-mono text-white/80 resize-none focus:outline-none leading-relaxed"
                      spellCheck={false}
                      placeholder="Paste or write your HTML email template here..."
                    />
                  </div>
                )}

                {/* Live Preview */}
                {showPreview && (
                  <div className={`${showCode ? 'w-1/2' : 'w-full'} overflow-auto bg-[#0a0a0a]`}>
                    <div className="p-4">
                      <div className="mx-auto max-w-155 bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500/40" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                          <div className="w-3 h-3 rounded-full bg-green-500/40" />
                          <span className="text-xs text-white/30 ml-2 truncate">
                            {replaceVariables(editedSubject, SAMPLE_VARIABLES[selectedTemplate.slug] || {})}
                          </span>
                        </div>
                        <iframe
                          srcDoc={previewHtml}
                          className="w-full"
                          style={{ minHeight: '600px', border: 'none' }}
                          title="Email Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">Select a template to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Test Email Modal */}
      <AnimatePresence>
        {showTestModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-9999"
              onClick={() => setShowTestModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black border border-white/10 rounded-2xl p-6 z-10000"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Send Test Email</h3>
                <button onClick={() => setShowTestModal(false)} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-white/50 mb-4">
                Send a preview of &apo;{selectedTemplate?.name}&apos; with sample data filled in.
              </p>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/30 mb-4"
              />
              <button
                onClick={handleSendTest}
                disabled={!testEmail || sendTestLoading}
                className="w-full h-11 bg-white text-black rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {sendTestLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendTestLoading ? 'Sending...' : 'Send Test'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
