/**
 * Generate Tests Feature - UI Component
 * Modal for configuring and generating test cases with AI
 * UPDATED: Now uses Celery queue for background processing
 */

import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useGenerateStore } from '../model/generateStore';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { UserStory } from '@/entities/user-story';
import type { SuggestedTestCase } from '../api/generateTests';
import { useTestGenerationQueue } from '@/shared/stores';
import { apiService } from '@/shared/api';
import {
  colors,
  borderRadius,
  getTypographyPreset,
} from '@/shared/design-system/tokens';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: UserStory;
  projectId: string;
  onSuccess?: () => void;
}

export const GenerateModal = ({
  isOpen,
  onClose,
  story,
  projectId,
  onSuccess,
}: GenerateModalProps) => {
  const {
    isGenerating,
    generationError,
    setGenerationError,
    resetGeneration,
  } = useGenerateStore();
  const { addJob, hasActiveJob } = useTestGenerationQueue();

  const [numTestCases, setNumTestCases] = useState(5);
  const [scenariosPerTest, setScenariosPerTest] = useState(3);
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>(['FUNCTIONAL', 'UI']);
  const [useAi, setUseAi] = useState(true);
  const [suggestedTests, setSuggestedTests] = useState<SuggestedTestCase[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  // Combined loading state (local OR store)
  const isActuallyGenerating = isGenerating || isLoadingLocal;

  // Check if story already has active job
  const storyHasActiveJob = hasActiveJob(story.id);

  const availableTestTypes = [
    { value: 'FUNCTIONAL', label: 'Functional' },
    { value: 'UI', label: 'UI/UX' },
    { value: 'API', label: 'API' },
    { value: 'INTEGRATION', label: 'Integration' },
    { value: 'SECURITY', label: 'Security' },
  ];

  // Handle test type toggle
  const handleTestTypeToggle = (testType: string) => {
    if (selectedTestTypes.includes(testType)) {
      // Don't allow removing the last test type
      if (selectedTestTypes.length === 1) return;
      setSelectedTestTypes(selectedTestTypes.filter(t => t !== testType));
    } else {
      setSelectedTestTypes([...selectedTestTypes, testType]);
    }
  };

  // Handle queue generation (NEW - non-blocking)
  const handleGenerate = async () => {
    setIsLoadingLocal(true);
    setGenerationError(null);

    try {
      // Queue the test generation job (non-blocking)
      const response = await apiService.queueTestGeneration(
        story.id,
        projectId,
        numTestCases,
        scenariosPerTest,
        selectedTestTypes,
        useAi
      );

      // Add job to queue store
      addJob({
        taskId: response.task_id,
        storyId: story.id,
        storyTitle: story.title,
        projectId: projectId,
        status: 'queued',
        progress: 0,
        queuedAt: new Date(),
      });

      // Show success toast
      toast.success(
        `Test Generation Queued! Generating ${numTestCases} test cases for "${story.title}". You'll be notified when ready.`,
        { duration: 4000 }
      );

      // Close modal and call onSuccess
      onClose();
      onSuccess?.();
    } catch (error: any) {
      // Error handling
      let errorMessage = 'Error al encolar generación de test cases';

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail ||
          'Este User Story no está asociado a un proyecto.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User story no encontrada';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setGenerationError(errorMessage);
      toast.error(
        `Queue Failed - ${errorMessage}`,
        { duration: 5000 }
      );
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (suggestedTests.length > 0) {
      onSuccess?.();
    }
    setSuggestedTests([]);
    resetGeneration();
    onClose();
  };

  // Get design tokens
  const bodySmall = getTypographyPreset('bodySmall');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generar Test Cases con IA">
      <div className="space-y-4">
        {/* Story info */}
        <div className={`p-4 ${colors.gray[50]} ${borderRadius.lg}`}>
          <h3 className={`${bodySmall.className} font-medium ${colors.gray.text900} mb-1`}>{story.title}</h3>
          <p className={`${bodySmall.className} ${colors.gray.text600} line-clamp-2`}>{story.description}</p>
          {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
            <p className={`${bodySmall.className} ${colors.gray.text500} mt-2`}>
              {story.acceptance_criteria.length} criterios de aceptación
            </p>
          )}
        </div>

        {/* Active job warning */}
        {storyHasActiveJob && (
          <div className={`flex items-start gap-2 p-3 ${colors.status.warning[50]} border ${colors.status.warning.border200} ${borderRadius.lg}`}>
            <Loader2 className={`w-5 h-5 ${colors.status.warning.text600} flex-shrink-0 mt-0.5 animate-spin`} />
            <div>
              <p className={`${bodySmall.className} font-medium ${colors.status.warning.text900}`}>
                Ya hay una generación en progreso
              </p>
              <p className={`${bodySmall.className} ${colors.status.warning.text700} mt-1`}>
                Esta user story tiene un trabajo de generación activo. Mira el badge en la tabla para ver el progreso.
              </p>
            </div>
          </div>
        )}

        {/* Configuration */}
        {!suggestedTests.length && !isActuallyGenerating && (
          <div className="space-y-4">
            {/* AI toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${colors.brand.secondary.text600}`} />
                <span className={`${bodySmall.className} font-medium ${colors.gray.text900}`}>
                  Usar IA (Gemini)
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useAi}
                onClick={() => setUseAi(!useAi)}
                className={`
                  relative inline-flex h-6 w-11 items-center ${borderRadius.full} transition-colors
                  ${useAi ? colors.brand.primary[600] : colors.gray[200]}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform ${borderRadius.full} ${colors.white} transition-transform
                    ${useAi ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Number of test cases */}
            <div>
              <label className={`block ${bodySmall.className} font-medium ${colors.gray.text700} mb-2`}>
                Número de test cases: {numTestCases}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={numTestCases}
                onChange={(e) => setNumTestCases(Number(e.target.value))}
                className={`w-full h-2 ${colors.gray[200]} ${borderRadius.lg} appearance-none cursor-pointer`}
                disabled={isActuallyGenerating}
              />
              <div className={`flex justify-between ${bodySmall.className} ${colors.gray.text500} mt-1`}>
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Scenarios per test */}
            <div>
              <label className={`block ${bodySmall.className} font-medium ${colors.gray.text700} mb-2`}>
                Escenarios por test case: {scenariosPerTest}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={scenariosPerTest}
                onChange={(e) => setScenariosPerTest(Number(e.target.value))}
                className={`w-full h-2 ${colors.gray[200]} ${borderRadius.lg} appearance-none cursor-pointer`}
                disabled={isActuallyGenerating}
              />
              <div className={`flex justify-between ${bodySmall.className} ${colors.gray.text500} mt-1`}>
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Test types */}
            <div>
              <label className={`block ${bodySmall.className} font-medium ${colors.gray.text700} mb-2`}>
                Tipos de test (selecciona al menos 1)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTestTypes.map((testType) => (
                  <button
                    key={testType.value}
                    type="button"
                    onClick={() => handleTestTypeToggle(testType.value)}
                    className={`
                      px-3 py-1.5 ${bodySmall.className} font-medium ${borderRadius.md} border transition-colors
                      ${selectedTestTypes.includes(testType.value)
                        ? `${colors.brand.primary[100]} ${colors.brand.primary.border300} ${colors.brand.primary.text800}`
                        : `${colors.white} ${colors.gray.border300} ${colors.gray.text700} hover:bg-gray-50`
                      }
                      ${isActuallyGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    disabled={isActuallyGenerating}
                  >
                    {testType.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className={`p-3 ${colors.brand.primary[50]} border ${colors.brand.primary.border200} ${borderRadius.lg}`}>
              <p className={`${bodySmall.className} ${colors.brand.primary.text800}`}>
                ⚡ Generación en segundo plano: Los test cases se generarán en background.
                Podrás seguir trabajando mientras la IA procesa. Te notificaremos cuando estén listos.
              </p>
            </div>
          </div>
        )}

        {/* Queueing in progress */}
        {isLoadingLocal && (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Loader2 className={`w-12 h-12 ${colors.brand.primary.text600} animate-spin mb-4`} />
            <p className={`${bodySmall.className} font-medium ${colors.gray.text900}`}>Encolando generación...</p>
          </div>
        )}

        {/* Error message */}
        {generationError && (
          <div className={`flex items-start gap-2 p-3 ${colors.status.error[50]} border ${colors.status.error.border200} ${borderRadius.lg}`}>
            <AlertCircle className={`w-5 h-5 ${colors.status.error.text600} flex-shrink-0 mt-0.5`} />
            <p className={`${bodySmall.className} ${colors.status.error.text800}`}>{generationError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={handleClose} disabled={isLoadingLocal}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoadingLocal || storyHasActiveJob}
            leftIcon={isLoadingLocal ? <Loader2 className="animate-spin" /> : <Sparkles />}
          >
            {isLoadingLocal ? 'Encolando...' : storyHasActiveJob ? 'Ya está en cola' : 'Encolar Generación'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
