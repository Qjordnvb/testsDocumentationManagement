import { useState, useEffect } from 'react';
import { bugCommentApi } from '@/entities/bug-comment';
import type { BugComment } from '@/entities/bug-comment/model/types';
import toast from 'react-hot-toast';

export const useBugComments = (bugId: string, projectId: string) => {
  const [comments, setComments] = useState<BugComment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await bugCommentApi.getComments(bugId, projectId);
      setComments(data);
    } catch (error) {
      toast.error('Error loading comments');
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (text: string, attachment?: File) => {
    try {
      const newComment = await bugCommentApi.createComment(bugId, projectId, {
        text,
        attachment
      });
      setComments(prev => [...prev, newComment]);
      toast.success('Comment added');
    } catch (error) {
      toast.error('Error creating comment');
    }
  };

  const updateComment = async (commentId: string, text: string) => {
    try {
      const updated = await bugCommentApi.updateComment(commentId, projectId, text);
      setComments(prev => prev.map(c => c.id === commentId ? updated : c));
      toast.success('Comment updated');
    } catch (error) {
      toast.error('Error updating comment');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await bugCommentApi.deleteComment(commentId, projectId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Error deleting comment');
    }
  };

  useEffect(() => {
    loadComments();
  }, [bugId, projectId]);

  return {
    comments,
    loading,
    createComment,
    updateComment,
    deleteComment,
    reload: loadComments
  };
};
