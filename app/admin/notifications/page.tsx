"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, History, Loader, Check, X, RefreshCw } from 'lucide-react';

interface NotificationStats {
  total_subscribers: number;
}

interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  channel: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default function NotificationAdminPanel() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState('trades');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/notifications/subscribe');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch history
      const historyRes = await fetch('/api/notifications/send');
      const historyData = await historyRes.json();
      setHistory(historyData.history || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    setIsSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, channel }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: `Sent to ${data.sent}/${data.total} subscribers`,
        });
        setTitle('');
        setBody('');
        fetchData(); // Refresh history
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send notification',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Push Notifications</h1>
              <p className="text-sm text-gray-400">Send trade alerts to all subscribers</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total Subscribers</span>
            </div>
            <p className="text-3xl font-bold mt-2">
              {isLoading ? '...' : stats?.total_subscribers || 0}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-3">
              <Send className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Notifications Sent</span>
            </div>
            <p className="text-3xl font-bold mt-2">
              {history.reduce((acc, h) => acc + h.sent_count, 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Total Campaigns</span>
            </div>
            <p className="text-3xl font-bold mt-2">{history.length}</p>
          </div>
        </div>

        {/* Send Form */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Notification
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="🚀 New Trade Alert!"
                className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="XAUUSD Buy @ 2650 | TP: 2680 | SL: 2640"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="trades">📈 Free Trades</option>
                <option value="main">🔴 Livestreams</option>
                <option value="shop">📰 News</option>
                <option value="vip">👑 VIP Trades</option>
              </select>
            </div>

            {result && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  result.success
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {result.success ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {result.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || !title || !body}
              className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send to All Subscribers
                </>
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Notification History
          </h2>

          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No notifications sent yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-black/50 border border-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{item.body}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                      {item.channel}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>✅ {item.sent_count} sent</span>
                    {item.failed_count > 0 && (
                      <span>❌ {item.failed_count} failed</span>
                    )}
                    <span>
                      {new Date(item.created_at).toLocaleDateString()} at{' '}
                      {new Date(item.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
