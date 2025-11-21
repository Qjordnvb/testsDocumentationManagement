/**
 * Stories Page
 * Main page for viewing and managing user stories (project-scoped)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/widgets/layout';
import { StoryTable } from '@/widgets/story-table';
import { UserStoryCard } from '@/widgets/story-table/UserStoryCard';
import { UploadModal } from '@/features/upload-excel';
import { GenerateModal } from '@/features/generate-tests';
import { Button } from '@/shared/ui/Button';
import { storyApi } from '@/entities/user-story';
import { useProject } from '@/app/providers/ProjectContext';
import type { UserStory } from '@/entities/user-story';
import { Upload, RefreshCw, AlertCircle, LayoutGrid, Table } from 'lucide-react';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';

type ViewMode = 'table' | 'cards';

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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('storiesViewMode');
    return (saved === 'cards' || saved === 'table') ? saved : 'table';
  });

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('storiesViewMode', viewMode);
  }, [viewMode]);

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

  // Handle edit story
  const handleEdit = (storyId: string) => {
    // TODO: Implement edit modal
    console.log('Edit story:', storyId);
  };

  // Handle view tests for a story
  const handleViewTests = (storyId: string) => {
    if (!projectId) return;
    navigate(`/projects/${projectId}/tests?story=${storyId}`);
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    loadStories();
  };

  // Handle generate success
  const handleGenerateSuccess = () => {
    loadStories();
  };

  const bodySmall = getTypographyPreset('bodySmall');

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

        <div className="flex items-center gap-4">
          {stories.length > 0 && (
            <div className={`${bodySmall.className} ${colors.gray.text600}`}>
              {stories.length} {stories.length === 1 ? 'historia' : 'historias'}
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 ${borderRadius.md} transition-all ${
                viewMode === 'table'
                  ? `${colors.brand.primary[600]} text-white shadow-sm`
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Table size={16} />
              <span className="text-sm font-medium">Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-3 py-1.5 ${borderRadius.md} transition-all ${
                viewMode === 'cards'
                  ? `${colors.brand.primary[600]} text-white shadow-sm`
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid size={16} />
              <span className="text-sm font-medium">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={`flex items-start gap-3 p-4 mb-6 ${colors.status.error[50]} border ${colors.status.error.border200} ${borderRadius.lg}`}>
          <AlertCircle className={`w-5 h-5 ${colors.status.error.text600} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`${bodySmall.className} font-medium ${colors.status.error.text900}`}>Error</p>
            <p className={`${bodySmall.className} ${colors.status.error.text700}`}>{error}</p>
          </div>
        </div>
      )}

      {/* Stories view - Table or Cards */}
      {viewMode === 'table' ? (
        <StoryTable
          stories={stories}
          isLoading={isLoading}
          onGenerateTests={handleGenerateTests}
          onRefresh={loadStories}
        />
      ) : (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="card text-center py-16">
              <p className={`${bodySmall.className} ${colors.gray.text500}`}>
                No hay user stories. Sube un archivo Excel para comenzar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <UserStoryCard
                  key={story.id}
                  story={story}
                  onGenerateTests={() => handleGenerateTests(story)}
                  onViewTests={handleViewTests}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
