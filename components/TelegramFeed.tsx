"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Loader, AlertCircle, ExternalLink, Heart } from 'lucide-react';

interface TelegramMessage {
  id: string;
  timestamp: number;
  text: string;
  author: string;
  authorUsername?: string;
  hasMedia: boolean;
  mediaType?: 'photo' | 'video' | 'document' | 'audio';
  formattedTime: string;
}

interface TelegramFeedProps {
  limit?: number;
  refreshInterval?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function TelegramFeed({
  limit = 10,
  refreshInterval = 30000, // 30 seconds for responsive notifications
  showHeader = true,
  compact = false,
}: TelegramFeedProps) {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, trigger a sync to fetch any new messages from Telegram
        // This also sends push notifications for new messages
        try {
          await fetch('/api/telegram/sync');
        } catch (syncErr) {
          // Sync errors are not critical, continue with message fetch
          console.log('[TelegramFeed] Sync failed, continuing with message fetch');
        }

        const response = await fetch(`/api/telegram/messages?limit=${limit}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else {
          throw new Error(data.error || 'Failed to load Telegram messages');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching Telegram messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up auto-refresh - also triggers sync on each poll
    const interval = setInterval(fetchMessages, refreshInterval);
    return () => clearInterval(interval);
  }, [limit, refreshInterval]);

  const handleLike = (messageId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-white to-white rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Telegram Feed</h2>
              <p className="text-sm text-gray-400">Live updates from our community</p>
            </div>
          </div>
          <a
            href="https://t.me/bullmoneyfx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Join Channel
          </a>
        </div>
      )}

      {loading && messages.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-white animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to load messages</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {!loading && messages.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No messages yet. Check back soon!</p>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        <div className="grid gap-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/5 to-white/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className={`relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all backdrop-blur-sm overflow-hidden ${
                compact ? 'p-3' : 'p-4'
              }`}>
                {/* Message Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-white to-white flex items-center justify-center text-white text-sm font-bold">
                      {message.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {message.author}
                        {message.authorUsername && (
                          <span className="text-gray-500 text-sm ml-1">
                            @{message.authorUsername}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{message.formattedTime}</p>
                    </div>
                  </div>

                  {message.hasMedia && (
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                      {message.mediaType || 'Media'}
                    </span>
                  )}
                </div>

                {/* Message Content */}
                <p className={`text-gray-200 leading-relaxed break-words ${
                  compact ? 'line-clamp-2' : ''
                }`}>
                  {message.text}
                </p>

                {/* Message Footer with Interaction */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Message ID: {message.id}
                  </div>
                  <button
                    onClick={() => handleLike(message.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                      likedMessages.has(message.id)
                        ? 'bg-red-500/20 text-red-400'
                        : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${likedMessages.has(message.id) ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {!loading && messages.length > 0 && (
        <div className="mt-6 text-center">
          <a
            href="https://t.me/bullmoneyfx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white hover:text-white transition-colors"
          >
            View all messages on Telegram
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
