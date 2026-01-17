"use client";

import React, { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { createSupabaseClient } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { CommentCard } from './CommentCard';
import { CommentInput } from './CommentInput';
import type { Comment } from '@/types/feed';

interface CommentThreadProps {
  analysisId: string;
  initialCommentCount?: number;
}

export const CommentThread = memo(({
  analysisId,
  initialCommentCount = 0,
}: CommentThreadProps) => {
  const { user, isAuthenticated } = useUserStore();
  
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!expanded) return;
    
    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('analysis_comments')
        .select(`
          *,
          author:user_profiles(*)
        `)
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        setComments(data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [analysisId, expanded]);

  // Fetch on expand
  useEffect(() => {
    if (expanded && comments.length === 0) {
      fetchComments();
    }
  }, [expanded, comments.length, fetchComments]);

  // Toggle expand
  const toggleExpand = useCallback(() => {
    SoundEffects.click();
    setExpanded(!expanded);
  }, [expanded]);

  // Submit new comment
  const handleSubmitComment = useCallback(async (content: string, imageUrl?: string) => {
    if (!user?.id) return;

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('analysis_comments')
      .insert({
        analysis_id: analysisId,
        user_id: user.id,
        parent_id: replyTo?.id || null,
        content,
        image_url: imageUrl || null,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        author:user_profiles(*)
      `)
      .single();

    if (error) {
      console.error('Error posting comment:', error);
      throw error;
    }

    if (data) {
      setComments([...comments, data]);
      setReplyTo(null);
    }
  }, [analysisId, user, replyTo, comments]);

  // Reply to comment
  const handleReply = useCallback((commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setReplyTo({
        id: commentId,
        username: comment.author?.username || 'Anonymous',
      });
    }
  }, [comments]);

  // Cancel reply
  const handleCancelReply = useCallback(() => {
    SoundEffects.click();
    setReplyTo(null);
  }, []);

  // Edit comment
  const handleEditComment = useCallback((comment: Comment) => {
    setEditingComment(comment);
  }, []);

  // Delete comment
  const handleDeleteComment = useCallback(async (commentId: string) => {
    const supabase = createSupabaseClient();

    const { error } = await supabase
      .from('analysis_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
    } else {
      setComments(comments.filter(c => c.id !== commentId));
    }
  }, [comments]);

  // Organize comments into threads
  const organizedComments = comments.reduce((acc, comment) => {
    if (!comment.parent_id) {
      // Root comment
      acc.push({
        ...comment,
        replies: comments.filter(c => c.parent_id === comment.id),
      });
    }
    return acc;
  }, [] as (Comment & { replies: Comment[] })[]);

  const commentCount = initialCommentCount || comments.length;

  return (
    <div className="border-t border-neutral-800">
      {/* Toggle Header */}
      <button
        onClick={toggleExpand}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-900/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-neutral-400">
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-500" />
        )}
      </button>

      {/* Comments Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              )}

              {/* Comments List */}
              {!loading && organizedComments.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}

              {!loading && organizedComments.length > 0 && (
                <div className="space-y-4">
                  {organizedComments.map((comment) => (
                    <div key={comment.id} className="space-y-3">
                      {/* Root Comment */}
                      <CommentCard
                        comment={comment}
                        onReply={handleReply}
                        onEdit={handleEditComment}
                        onDelete={handleDeleteComment}
                        currentUserId={user?.id}
                      />
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-3">
                          {comment.replies.map((reply) => (
                            <CommentCard
                              key={reply.id}
                              comment={reply}
                              onReply={handleReply}
                              onEdit={handleEditComment}
                              onDelete={handleDeleteComment}
                              currentUserId={user?.id}
                              isReply
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {replyTo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 ml-11"
                >
                  <CommentInput
                    analysisId={analysisId}
                    parentId={replyTo.id}
                    replyToUsername={replyTo.username}
                    onSubmit={handleSubmitComment}
                    onCancel={handleCancelReply}
                    placeholder={`Reply to @${replyTo.username}...`}
                    autoFocus
                  />
                </motion.div>
              )}

              {/* Main Input (when not replying) */}
              {!replyTo && (
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <CommentInput
                    analysisId={analysisId}
                    onSubmit={handleSubmitComment}
                    placeholder="Add a comment..."
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CommentThread.displayName = 'CommentThread';

export default CommentThread;
