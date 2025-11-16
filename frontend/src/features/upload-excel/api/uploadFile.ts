/**
 * Upload Excel Feature - API
 * API functions for file upload
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000, // 60 seconds for file uploads
});

export interface UploadResponse {
  message: string;
  file_name: string;
  stories_count: number;
  user_stories: Array<{
    id: string;
    title: string;
    description: string;
    acceptance_criteria: Array<{ id: string; description: string; completed: boolean }>;
  }>;
}

/**
 * Uploads Excel/CSV file to backend
 */
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });

  return data;
};
