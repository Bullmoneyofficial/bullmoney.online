"use client";

import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Reply, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  CheckCircle,
  Trophy,
  Image as ImageIcon
} from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import type { Comment } from '@/types/feed';
import type { UserProfile } from '@/types/user';

interface CommentCardProps {
  comment: Comment;
  onReply?: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string;
  isReply?: boolean;
}

export const CommentCard = memo(({
  comment,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
  isReply = false,
}: CommentCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const author = comment.author;
  const isOwner = currentUserId && comment.user_id === currentUserId;
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  const handleReply = useCallback(() => {
    SoundEffects.click();
    onReply?.(comment.id);
  }, [comment.id, onReply]);

  const handleEdit = useCallback(() => {
    SoundEffects.click();
    setShowMenu(false);
    onEdit?.(comment);
  }, [comment, onEdit]);

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this comment?')) {
      SoundEffects.click();
      setShowMenu(false);
      onDelete?.(comment.id);
    }
  }, [comment.id, onDelete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative ${isReply ? 'ml-8 pl-4 border-l-2 border-neutral-800' : ''}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt={author.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">
                {author?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium text-sm">
              @{author?.username || 'Anonymous'}
            </span>
            {author?.is_verified && (
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
            )}
            {author?.is_smart_money && (
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            )}
            <span className="text-neutral-500 text-xs">{timeAgo}</span>
            {comment.updated_at && comment.updated_at !== comment.created_at && (
              <span className="text-neutral-600 text-xs">(edited)</span>
            )}
          </div>
          
          {/* Comment Content */}
          <div className="mt-1">
            <p className="text-neutral-300 text-sm whitespace-pre-wrap">
              {comment.content}
            </p>
            
            {/* Comment Image */}
            {comment.image_url && (
              <div className="mt-2 rounded-lg overflow-hidden border border-neutral-800 max-w-sm">
                <img 
                  src={comment.image_url} 
                  alt="Comment attachment"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReply}
              className="flex items-center gap-1 text-neutral-500 hover:text-blue-400 text-xs transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </motion.button>
            
            {isOwner && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { SoundEffects.click(); setShowMenu(!showMenu); }}
                  className="flex items-center gap-1 text-neutral-500 hover:text-white text-xs transition-colors"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </motion.button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute left-0 top-6 z-50 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden min-w-[120px]"
                  >
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-blue-500/20 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

CommentCard.displayName = 'CommentCard';

export default CommentCard;
