/**
 * Generate Tests Feature - UI Component
 * Modal for configuring and generating test cases with AI
 */

import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useGenerateStore } from '../model/generateStore';
import { generateTests } from '../api/generateTests';
import { formatTestSummary } from '../lib/testFormatter';
import { Sparkles, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import type { UserStory } from '@/entities/user-story';

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
    generatedTests,
    useAi,
    numScenarios,
    setIsGenerating,
    setGenerationError,
    setGeneratedTests,
    setUseAi,
    setNumScenarios,
    resetGeneration,
  } = useGenerateStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const tests = await generateTests({
        storyId: story.id,
        useAi,
        numScenarios,
      });

      setGeneratedTests(tests);

      // Success notification
      console.log(`Generated ${tests.length} test cases for story: ${story.title}`);
    } catch (error: any) {
      console.error('Generation error:', error);
      setGenerationError(
        error.response?.data?.detail || 'Error al generar test cases'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (generatedTests.length > 0) {
      onSuccess?.();
    }
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
        {!generatedTests.length && (
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

            {/* Advanced settings */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-4 h-4" />
                Configuración avanzada
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3">
                  {/* Number of scenarios */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de escenarios: {numScenarios}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={numScenarios}
                      onChange={(e) => setNumScenarios(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={isGenerating}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      La IA generará escenarios de prueba en formato Gherkin (Given-When-Then)
                      basándose en los criterios de aceptación de la user story.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generation in progress */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-sm text-gray-600">Generando test cases con IA...</p>
            <p className="text-xs text-gray-500 mt-1">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Success result */}
        {!isGenerating && generatedTests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Test cases generados exitosamente
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {formatTestSummary(generatedTests)}
                </p>
              </div>
            </div>

            {/* Generated tests preview */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {generatedTests.map((test, index) => (
                <div key={test.id} className="p-3 bg-gray-50 rounded border border-gray-200">
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
                </div>
              ))}
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
            {generatedTests.length > 0 ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!generatedTests.length && (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generando...' : 'Generar Test Cases'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
