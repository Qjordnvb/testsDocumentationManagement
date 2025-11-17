/**
 * Stories Page
 * Main page for viewing and managing user stories (project-scoped)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/widgets/layout';
import { StoryTable } from '@/widgets/story-table';
import { UploadModal } from '@/features/upload-excel';
import { GenerateModal } from '@/features/generate-tests';
import { Button } from '@/shared/ui/Button';
import { storyApi } from '@/entities/user-story';
import { useProject } from '@/app/providers/ProjectContext';
import type { UserStory } from '@/entities/user-story';
import { Upload, RefreshCw, AlertCircle } from 'lucide-react';

export const StoriesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
      return;
    }
  }, [projectId, currentProject, navigate]);

  // Load stories
  const loadStories = async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await storyApi.getAll(projectId);
      setStories(data);
    } catch (err: any) {
      console.error('Error loading stories:', err);
      setError(err.response?.data?.detail || 'Error al cargar las user stories');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStories();
  }, [projectId]); // Reload when projectId changes

  // Handle generate tests for a story
  const handleGenerateTests = (story: UserStory) => {
    setSelectedStory(story);
    setGenerateModalOpen(true);
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    loadStories();
  };

  // Handle generate success
  const handleGenerateSuccess = () => {
    loadStories();
  };

  return (
    <PageLayout
      title="User Stories"
      description={`Gestiona las historias de usuario de ${currentProject?.name || 'tu proyecto'}`}
    >
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Subir Excel/CSV
          </Button>
          <Button
            variant="secondary"
            onClick={loadStories}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {stories.length > 0 && (
          <div className="text-sm text-gray-600">
            {stories.length} {stories.length === 1 ? 'historia' : 'historias'}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stories table */}
      <StoryTable
        stories={stories}
        isLoading={isLoading}
        onGenerateTests={handleGenerateTests}
        onRefresh={loadStories}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Generate Tests Modal */}
      {selectedStory && (
        <GenerateModal
          isOpen={generateModalOpen}
          onClose={() => {
            setGenerateModalOpen(false);
            setSelectedStory(null);
          }}
          story={selectedStory}
          onSuccess={handleGenerateSuccess}
        />
      )}
    </PageLayout>
  );
};
