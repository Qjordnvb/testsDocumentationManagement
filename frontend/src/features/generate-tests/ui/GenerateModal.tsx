/**
 * Generate Tests Feature - UI Component
 * Modal for configuring and generating test cases with AI
 */

import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useGenerateStore } from '../model/generateStore';
import { previewTests } from '../api/generateTests';
import { ReviewTestCasesModal } from './ReviewTestCasesModal';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UserStory } from '@/entities/user-story';
import type { SuggestedTestCase } from '../api/generateTests';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: UserStory;
  onSuccess?: () => void;
}

export const GenerateModal = ({
  isOpen,
  onClose,
  story,
  onSuccess,
}: GenerateModalProps) => {
  const {
    isGenerating,
    generationError,
    setIsGenerating,
    setGenerationError,
    resetGeneration,
  } = useGenerateStore();
  const [numTestCases, setNumTestCases] = useState(5);
  const [scenariosPerTest, setScenariosPerTest] = useState(3);
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>(['FUNCTIONAL', 'UI']);
  const [useAi, setUseAi] = useState(true);
  const [suggestedTests, setSuggestedTests] = useState<SuggestedTestCase[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  // Combined loading state (local OR store)
  const isActuallyGenerating = isGenerating || isLoadingLocal;

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

  // Handle preview generation
  const handleGenerate = async () => {
    // Set BOTH loading states
    setIsGenerating(true);
    setIsLoadingLocal(true);
    setGenerationError(null);
    setSuggestedTests([]); // Clear previous suggestions

    // CRITICAL: Force React to re-render with loading state BEFORE making API call
    // Without this delay, the await blocks and React never shows the loading indicator
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const response = await previewTests({
        storyId: story.id,
        numTestCases,
        scenariosPerTest,
        testTypes: selectedTestTypes,
        useAi,
      });

      if (!response.suggested_test_cases || response.suggested_test_cases.length === 0) {
        setGenerationError('No se generaron sugerencias de test cases. Intenta con otros parámetros.');
        return;
      }

      setSuggestedTests(response.suggested_test_cases);
    } catch (error: any) {
      // Better error handling
      let errorMessage = 'Error al generar sugerencias de test cases';

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail ||
          'Este User Story no está asociado a un proyecto. Por favor, re-importa las user stories con project_id.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User story no encontrada';
      } else if (error.response?.status === 403) {
        errorMessage = 'Error con la API key de Gemini. Verifica la configuración en el backend.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setGenerationError(errorMessage);
      setSuggestedTests([]); // Ensure empty array on error
    } finally {
      setIsGenerating(false);
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generar Test Cases con IA">
      <div className="space-y-4">
        {/* Story info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-1">{story.title}</h3>
          <p className="text-xs text-gray-600 line-clamp-2">{story.description}</p>
          {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {story.acceptance_criteria.length} criterios de aceptación
            </p>
          )}
        </div>

        {/* Configuration */}
        {!suggestedTests.length && !isActuallyGenerating && (
          <div className="space-y-4">
            {/* AI toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">
                  Usar IA (Gemini)
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useAi}
                onClick={() => setUseAi(!useAi)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${useAi ? 'bg-blue-600' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${useAi ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Number of test cases */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de test cases: {numTestCases}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={numTestCases}
                onChange={(e) => setNumTestCases(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isActuallyGenerating}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Scenarios per test */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escenarios por test case: {scenariosPerTest}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={scenariosPerTest}
                onChange={(e) => setScenariosPerTest(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isActuallyGenerating}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Test types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipos de test (selecciona al menos 1)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTestTypes.map((testType) => (
                  <button
                    key={testType.value}
                    type="button"
                    onClick={() => handleTestTypeToggle(testType.value)}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md border transition-colors
                      ${selectedTestTypes.includes(testType.value)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                La IA generará sugerencias de test cases en formato Gherkin (Given-When-Then).
                Podrás revisar y editar antes de guardar.
              </p>
            </div>
          </div>
        )}

        {/* Generation in progress */}
        {isActuallyGenerating && (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-sm font-medium text-gray-900">Generando test cases con IA...</p>
            <p className="text-sm text-gray-600 mt-2">
              Gemini está creando <strong>{numTestCases * scenariosPerTest} escenarios</strong>
            </p>
            <p className="text-sm text-gray-600">
              ({numTestCases} test cases × {scenariosPerTest} escenarios cada uno)
            </p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md">
              <p className="text-xs text-yellow-800 text-center">
                ⏱️ Esto puede tomar hasta <strong>2 minutos</strong> para grandes cantidades de escenarios.
                Por favor, espera sin cerrar esta ventana.
              </p>
            </div>
          </div>
        )}

        {/* Success result */}
        {!isActuallyGenerating && suggestedTests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Sugerencias generadas exitosamente
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {suggestedTests.length} test case{suggestedTests.length !== 1 ? 's' : ''} sugerido{suggestedTests.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Suggested tests preview */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {suggestedTests.map((test, index) => (
                <div key={test.suggested_id} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {index + 1}. {test.title}
                    </h4>
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {test.test_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {test.description}
                  </p>
                  {test.scenarios_count && (
                    <p className="text-xs text-gray-500 mt-1">
                      {test.scenarios_count} escenario{test.scenarios_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Next step message */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 Estas son sugerencias. Podrás revisar y editar antes de guardar.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {generationError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{generationError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={handleClose}>
            {suggestedTests.length > 0 ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!suggestedTests.length ? (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generando...' : 'Generar Sugerencias'}
            </Button>
          ) : (
            <Button onClick={() => setShowReviewModal(true)}>
              Revisar y Guardar ({suggestedTests.length})
            </Button>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <ReviewTestCasesModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        suggestedTests={suggestedTests}
        userStoryId={story.id}
        userStoryTitle={story.title}
        onSuccess={() => {
          // Close both modals and call parent onSuccess
          setShowReviewModal(false);
          handleClose();
        }}
      />
    </Modal>
  );
};
