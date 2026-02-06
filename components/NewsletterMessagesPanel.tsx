"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Mail, Save, RotateCcw, AlertCircle, CheckCircle } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * NEWSLETTER MESSAGES PANEL
 * Admin interface for editing newsletter subscription response messages
 * Accessed from Admin Hub → Store Analytics → Messages
 * Allows customization of messages shown to users after newsletter signup
 */

interface NewsletterMessages {
  id: string;
  existing_subscriber_message: string;
  existing_recruit_message: string;
  new_subscriber_message: string;
  updated_at?: string;
  updated_by?: string;
}

export function NewsletterMessagesPanel() {
  const supabase = createSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [messages, setMessages] = useState<NewsletterMessages>({
    id: 'default',
    existing_subscriber_message: '',
    existing_recruit_message: '',
    new_subscriber_message: '',
  });

  const [originalMessages, setOriginalMessages] = useState<NewsletterMessages | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load messages from database
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_messages_config')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error) throw error;

      if (data) {
        setMessages(data);
        setOriginalMessages(data);
      }
    } catch (error: any) {
      console.error('Failed to load newsletter messages:', error);
      showToast(`Failed to load messages: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  // Save messages to database
  const saveMessages = useCallback(async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('newsletter_messages_config')
        .update({
          existing_subscriber_message: messages.existing_subscriber_message,
          existing_recruit_message: messages.existing_recruit_message,
          new_subscriber_message: messages.new_subscriber_message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');

      if (error) throw error;

      setOriginalMessages(messages);
      showToast('Newsletter messages saved successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to save newsletter messages:', error);
      showToast(`Failed to save: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [supabase, messages, showToast]);

  // Reset to original values
  const resetMessages = useCallback(() => {
    if (originalMessages) {
      setMessages(originalMessages);
      showToast('Messages reset to last saved values', 'success');
    }
  }, [originalMessages, showToast]);

  // Load on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const hasChanges = originalMessages && (
    messages.existing_subscriber_message !== originalMessages.existing_subscriber_message ||
    messages.existing_recruit_message !== originalMessages.existing_recruit_message ||
    messages.new_subscriber_message !== originalMessages.new_subscriber_message
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Newsletter Response Messages
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Customize the messages shown to users after newsletter subscription
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={resetMessages}
              disabled={saving}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            onClick={saveMessages}
            disabled={saving || !hasChanges}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Message Personalization</p>
            <p className="text-blue-300/80">
              Use <code className="bg-blue-900/30 px-1.5 py-0.5 rounded text-blue-200">{'{firstName}'}</code> 
              {' '}placeholder to insert the user's first name. The system will extract it from their email or recruit profile.
            </p>
          </div>
        </div>
      </div>

      {/* Message Forms */}
      <div className="space-y-6">
        {/* New Subscriber Message */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
          <label className="block mb-2">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              New Subscriber Message
            </span>
            <span className="text-slate-400 text-xs block mt-1">
              Shown when someone subscribes for the first time
            </span>
          </label>
          <textarea
            value={messages.new_subscriber_message}
            onChange={(e) => setMessages({ ...messages, new_subscriber_message: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
            placeholder="Enter message for new subscribers..."
          />
        </div>

        {/* Existing Subscriber Message */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
          <label className="block mb-2">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Existing Subscriber Message
            </span>
            <span className="text-slate-400 text-xs block mt-1">
              Shown when someone tries to subscribe but is already subscribed
            </span>
          </label>
          <textarea
            value={messages.existing_subscriber_message}
            onChange={(e) => setMessages({ ...messages, existing_subscriber_message: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
            placeholder="Enter message for existing subscribers..."
          />
        </div>

        {/* Existing Recruit Message */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
          <label className="block mb-2">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Existing Recruit Message
            </span>
            <span className="text-slate-400 text-xs block mt-1">
              Shown when a recruit (VIP/affiliate member) subscribes to newsletter
            </span>
          </label>
          <textarea
            value={messages.existing_recruit_message}
            onChange={(e) => setMessages({ ...messages, existing_recruit_message: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
            placeholder="Enter message for existing recruits..."
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-lg p-5">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          Message Preview (Example)
        </h3>
        <div className="space-y-3 text-sm">
          <div className="bg-slate-950/70 border border-slate-800 rounded-md p-3">
            <div className="text-green-400 text-xs font-semibold mb-1">NEW SUBSCRIBER:</div>
            <div className="text-slate-300">
              {messages.new_subscriber_message.replace('{firstName}', 'John')}
            </div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-md p-3">
            <div className="text-blue-400 text-xs font-semibold mb-1">EXISTING SUBSCRIBER:</div>
            <div className="text-slate-300">
              {messages.existing_subscriber_message.replace('{firstName}', 'Sarah')}
            </div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-md p-3">
            <div className="text-purple-400 text-xs font-semibold mb-1">EXISTING RECRUIT:</div>
            <div className="text-slate-300">
              {messages.existing_recruit_message.replace('{firstName}', 'Michael')}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {messages.updated_at && (
        <div className="text-xs text-slate-500 text-center">
          Last updated: {new Date(messages.updated_at).toLocaleString()}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsletterMessagesPanel;
