/**
 * Stories Page business logic
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectContext';
import { useTestGenerationQueue } from '@/shared/stores';
import { storyApi } from '@/entities/user-story';
import type { UserStory } from '@/entities/user-story';

type ViewMode = 'table' | 'cards';

export const useStories = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const { setOnTestCasesSaved } = useTestGenerationQueue();
  const navigate = useNavigate();

  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('storiesViewMode');
    return saved === 'cards' || saved === 'table' ? saved : 'table';
  });

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('storiesViewMode', viewMode);
  }, [viewMode]);

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
    }
  }, [projectId, currentProject, navigate]);

  const loadStories = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await storyApi.getAll(projectId);
      setStories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading stories';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load stories
  useEffect(() => {
    if (projectId) {
      loadStories();
    }
  }, [projectId, loadStories]);

  const handleUploadSuccess = useCallback(() => {
    loadStories();
    setUploadModalOpen(false);
  }, [loadStories]);

  const handleGenerate = useCallback((story: UserStory) => {
    setSelectedStory(story);
    setGenerateModalOpen(true);
  }, []);

  const handleTestCasesSaved = useCallback(() => {
    loadStories();
  }, [loadStories]);

  const handleUpdateStory = useCallback(async (storyId: string, updates: Partial<UserStory>) => {
    try {
      // Optimistic update - update local state immediately
      setStories(prev => prev.map(story =>
        story.id === storyId ? { ...story, ...updates } : story
      ));

      // Then update server
      await storyApi.update(storyId, updates);
    } catch (err) {
      console.error('Error updating story:', err);
      // Revert on error
      await loadStories();
      throw err;
    }
  }, [loadStories]);

  // Set callback for test generation queue
  useEffect(() => {
    setOnTestCasesSaved(handleTestCasesSaved);
  }, [handleTestCasesSaved, setOnTestCasesSaved]);

  return {
    projectId,
    currentProject,
    stories,
    isLoading,
    error,
    uploadModalOpen,
    setUploadModalOpen,
    generateModalOpen,
    setGenerateModalOpen,
    selectedStory,
    setSelectedStory,
    viewMode,
    setViewMode,
    handleUploadSuccess,
    handleGenerate,
    handleUpdateStory,
    loadStories,
  };
};
