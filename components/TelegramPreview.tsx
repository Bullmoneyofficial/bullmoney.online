"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ChevronRight } from 'lucide-react';

interface TelegramMessage {
  id: string;
  timestamp: number;
  text: string;
  author: string;
  formattedTime: string;
}

interface TelegramPreviewProps {
  limit?: number;
  onViewMore?: () => void;
}

export function TelegramPreview({ limit = 3, onViewMore }: TelegramPreviewProps) {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Trigger sync to fetch new messages from Telegram and send push notifications
        try {
          await fetch('/api/telegram/sync');
        } catch (syncErr) {
          // Sync errors are not critical, continue
        }

        const response = await fetch(`/api/telegram/messages?limit=${limit}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages.slice(0, limit));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    // Refresh every 30 seconds for more responsive notifications
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-white/5 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.length > 0 ? (
        <>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-white/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-white to-white flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {message.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {message.author}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                    {message.text}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {message.formattedTime}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {onViewMore && (
            <button
              onClick={onViewMore}
              className="w-full mt-3 flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white hover:text-white text-xs font-semibold transition-colors border border-white/20"
            >
              View all messages
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No messages yet</p>
        </div>
      )}
    </div>
  );
}

export default TelegramPreview;
