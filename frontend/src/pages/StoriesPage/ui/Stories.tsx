/**
 * Stories Page Main Component
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/widgets/layout';
import type { UserStory } from '@/entities/user-story';
import { StoryTable, UserStoryCard } from '@/widgets/story-table';
import { Button, SkeletonTable, EmptyState } from '@/shared/ui';
import { Upload, RefreshCw, AlertCircle, LayoutGrid, Table } from 'lucide-react';
import { getTypographyPreset } from '@/shared/design-system/tokens';
import { useStories } from '../model';
import { UploadModal } from '@/features/upload-excel/ui/UploadModal';
import { GenerateModal } from '@/features/generate-tests/ui/GenerateModal';
import { EditStoryModal } from '@/features/story-management/ui';

export const Stories = () => {
  const navigate = useNavigate();
  const {
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
  } = useStories();

  const [editingStory, setEditingStory] = useState<UserStory | null>(null);

  const handleViewTests = (storyId: string) => {
    // Navigate to test cases page with story filter using React Router
    if (projectId) {
      navigate(`/projects/${projectId}/tests?story=${storyId}`);
    }
  };

  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');

  if (isLoading) {
    return (
      <PageLayout title={currentProject?.name || 'Loading...'}>
        <SkeletonTable rows={5} columns={6} />
      </PageLayout>
    );
  }

  return (
    <PageLayout title={currentProject?.name || 'User Stories'}>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant="primary"
          leftIcon={<Upload size={16} />}
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Excel
        </Button>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw size={16} />}
          onClick={loadStories}
        >
          Refresh
        </Button>

        {/* View Mode Toggle */}
        <div className="ml-auto flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
            leftIcon={<Table size={16} />}
            onClick={() => setViewMode('table')}
            size="sm"
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'primary' : 'outline-primary'}
            leftIcon={<LayoutGrid size={16} />}
            onClick={() => setViewMode('cards')}
            size="sm"
          >
            Cards
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-l-4 border-red-500 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <p className={`${body.className} font-semibold text-red-900`}>Error</p>
              <p className={`${bodySmall.className} text-red-700`}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stories List */}
      {stories.length === 0 ? (
        <div className="card">
          <EmptyState
            emoji="📖"
            message="¡Comienza tu proyecto con User Stories!"
            description="Sube un archivo Excel con tus historias de usuario para comenzar"
            motivation="Las grandes aplicaciones empiezan con historias bien definidas ✨"
            size="lg"
            action={
              <Button
                variant="primary"
                leftIcon={<Upload size={16} />}
                onClick={() => setUploadModalOpen(true)}
              >
                Subir Archivo Excel
              </Button>
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        <StoryTable
          stories={stories}
          onGenerateTests={handleGenerate}
          onViewTests={handleViewTests}
          onUpdateStory={handleUpdateStory}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <UserStoryCard
              key={story.id}
              story={story}
              onGenerateTests={() => handleGenerate(story)}
              onViewTests={handleViewTests}
              onEdit={() => setEditingStory(story)}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Generate Tests Modal */}
      {generateModalOpen && selectedStory && (
        <GenerateModal
          isOpen={generateModalOpen}
          story={selectedStory}
          projectId={projectId!}
          onClose={() => {
            setGenerateModalOpen(false);
            setSelectedStory(null);
          }}
          onSuccess={() => {
            // No reload needed - generation is async via queue
            setGenerateModalOpen(false);
            setSelectedStory(null);
          }}
        />
      )}

      {/* Edit Story Modal */}
      {editingStory && (
        <EditStoryModal
          isOpen={!!editingStory}
          story={editingStory}
          onClose={() => setEditingStory(null)}
          onSave={async (storyId, updates) => {
            await handleUpdateStory(storyId, updates);
            setEditingStory(null);
          }}
        />
      )}
    </PageLayout>
  );
};
