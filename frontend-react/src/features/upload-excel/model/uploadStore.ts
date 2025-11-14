/**
 * Upload Excel Feature - State Management
 * Zustand store for file upload state
 */

import { create } from 'zustand';

interface UploadState {
  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadedFile: File | null;

  // Actions
  setIsUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadError: (error: string | null) => void;
  setUploadedFile: (file: File | null) => void;
  resetUpload: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  // Initial state
  isUploading: false,
  uploadProgress: 0,
  uploadError: null,
  uploadedFile: null,

  // Actions
  setIsUploading: (isUploading) => set({ isUploading }),

  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  setUploadError: (error) =>
    set({ uploadError: error, isUploading: false }),

  setUploadedFile: (file) => set({ uploadedFile: file }),

  resetUpload: () =>
    set({
      isUploading: false,
      uploadProgress: 0,
      uploadError: null,
      uploadedFile: null,
    }),
}));
