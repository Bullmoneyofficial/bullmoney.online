"use client";

import React, { memo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Image as ImageIcon, 
  X,
  Loader2,
  AtSign
} from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useUserStore } from '@/stores/userStore';
import { useAuthModalUI } from '@/contexts/UIStateContext';

interface CommentInputProps {
  analysisId: string;
  parentId?: string | null;
  replyToUsername?: string;
  onSubmit: (content: string, imageUrl?: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const CommentInput = memo(({
  analysisId,
  parentId = null,
  replyToUsername,
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  autoFocus = false,
}: CommentInputProps) => {
  const { user, isAuthenticated } = useUserStore();
  const { setIsOpen: setAuthModalOpen } = useAuthModalUI();
  
  const [content, setContent] = useState(replyToUsername ? `@${replyToUsername} ` : '');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), imageUrl || undefined);
      SoundEffects.click();
      setContent('');
      setImageUrl(null);
      setShowImageInput(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, imageUrl, isAuthenticated, onSubmit, setAuthModalOpen]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel on Escape
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  }, [handleSubmit, onCancel]);

  // Handle image URL input
  const handleImageUrl = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      setImageUrl(url);
    }
    setShowImageInput(false);
  }, []);

  // Remove image
  const removeImage = useCallback(() => {
    SoundEffects.click();
    setImageUrl(null);
  }, []);

  return (
    <div className="relative">
      {/* Reply indicator */}
      {parentId && replyToUsername && (
        <div className="flex items-center gap-2 mb-2 text-xs text-neutral-500">
          <AtSign className="w-3 h-3" />
          <span>Replying to @{replyToUsername}</span>
          {onCancel && (
            <button
              onClick={() => { SoundEffects.click(); onCancel(); }}
              className="ml-auto text-neutral-600 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-white to-white flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </div>
        
        {/* Input Area */}
        <div className="flex-1">
          <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl overflow-hidden focus-within:border-white transition-colors">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={isAuthenticated ? placeholder : "Sign in to comment..."}
              disabled={!isAuthenticated}
              autoFocus={autoFocus}
              rows={1}
              className="w-full px-4 py-3 bg-transparent text-white text-sm resize-none focus:outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed"
            />
            
            {/* Image Preview */}
            <AnimatePresence>
              {imageUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-3"
                >
                  <div className="relative inline-block">
                    <img 
                      src={imageUrl} 
                      alt="Attachment preview"
                      className="max-h-32 rounded-lg border border-neutral-700"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Actions Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-800">
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { SoundEffects.click(); handleImageUrl(); }}
                  className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                  title="Add image"
                >
                  <ImageIcon className="w-4 h-4" />
                </motion.button>
                
                <span className="text-xs text-neutral-600">
                  Cmd/Ctrl + Enter to submit
                </span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim() || !isAuthenticated}
                className="px-4 py-1.5 bg-white text-black rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CommentInput.displayName = 'CommentInput';

export default CommentInput;
