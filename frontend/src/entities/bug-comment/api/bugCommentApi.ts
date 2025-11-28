import { apiClient } from '@/shared/api';
import type { BugComment, CreateCommentRequest } from '../model/types';

export const bugCommentApi = {
  getComments: async (bugId: string, projectId: string): Promise<BugComment[]> => {
    const { data } = await apiClient.get(`/bugs/${bugId}/comments`, {
      params: { project_id: projectId }
    });
    // Backend returns { comments: [] }, extract the array
    return data.comments || [];
  },

  createComment: async (
    bugId: string,
    projectId: string,
    commentData: CreateCommentRequest
  ): Promise<BugComment> => {
    const formData = new FormData();
    formData.append('text', commentData.text);

    if (commentData.attachment) {
      formData.append('attachment', commentData.attachment);
    }

    const { data } = await apiClient.post(`/bugs/${bugId}/comments`, formData, {
      params: { project_id: projectId },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  updateComment: async (
    commentId: string,
    projectId: string,
    text: string
  ): Promise<BugComment> => {
    const { data } = await apiClient.put(`/bugs/comments/${commentId}`,
      { text },
      { params: { project_id: projectId } }
    );
    return data;
  },

  deleteComment: async (commentId: string, projectId: string): Promise<void> => {
    await apiClient.delete(`/bugs/comments/${commentId}`, {
      params: { project_id: projectId }
    });
  }
};
