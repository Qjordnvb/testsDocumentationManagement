/**
 * Review Test Cases Modal
 * Review and edit AI-generated test case suggestions before saving
 */

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { batchCreateTestCases } from '../api/generateTests';
import { CheckCircle2, AlertCircle, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import type { SuggestedTestCase } from '../api/generateTests';
import {
  colors,
  borderRadius,
  getTypographyPreset,
} from '@/shared/design-system/tokens';

interface ReviewTestCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedTests: SuggestedTestCase[];
  userStoryId: string;
  userStoryTitle: string;
  onSuccess?: () => void;
}

export const ReviewTestCasesModal = ({
  isOpen,
  onClose,
  suggestedTests: initialSuggestions,
  userStoryId,
  userStoryTitle,
  onSuccess,
}: ReviewTestCasesModalProps) => {
  const [testCases, setTestCases] = useState<SuggestedTestCase[]>(initialSuggestions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update state when suggestedTests prop changes
  useEffect(() => {
    setTestCases(initialSuggestions);
  }, [initialSuggestions]);

  // Handle edit test case
  const handleEdit = (id: string, field: string, value: string) => {
    setTestCases(testCases.map(tc =>
      tc.suggested_id === id ? { ...tc, [field]: value } : tc
    ));
  };

  // Handle delete test case
  const handleDelete = (id: string) => {
    if (testCases.length === 1) {
      alert('Debes mantener al menos 1 test case');
      return;
    }
    if (confirm('¿Eliminar esta sugerencia?')) {
      setTestCases(testCases.filter(tc => tc.suggested_id !== id));
    }
  };

  // Handle save all
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await batchCreateTestCases({
        user_story_id: userStoryId,
        test_cases: testCases.map(tc => ({
          suggested_id: tc.suggested_id,
          title: tc.title,
          description: tc.description,
          user_story_id: userStoryId,  // CRITICAL: Backend expects this in each test case
          test_type: tc.test_type,
          priority: tc.priority,
          status: tc.status,
          gherkin_content: tc.gherkin_content,
        })),
      });

      setSaveSuccess(true);

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving test cases:', error);
      setSaveError(
        error.response?.data?.detail || 'Error al guardar test cases'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!saveSuccess && testCases.length > 0 && !confirm('¿Salir sin guardar?')) {
      return;
    }
    onClose();
  };

  // Get design tokens
  const bodySmall = getTypographyPreset('bodySmall');
  const bodyText = getTypographyPreset('body');
  const labelText = getTypographyPreset('label');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Revisar Test Cases"
      size="xl"
    >
      <div className="space-y-4">
        {/* Header info */}
        <div className={`p-3 ${colors.brand.primary[50]} border ${colors.brand.primary.border200} ${borderRadius.lg}`}>
          <p className={`${bodySmall.className} font-medium ${colors.brand.primary.text900}`}>
            User Story: {userStoryTitle}
          </p>
          <p className={`${bodySmall.className} ${colors.brand.primary.text700} mt-1`}>
            {testCases.length} test case{testCases.length !== 1 ? 's' : ''} para revisar
          </p>
        </div>

        {/* Success message */}
        {saveSuccess && (
          <div className={`flex items-start gap-2 p-3 ${colors.status.success[50]} border ${colors.status.success.border200} ${borderRadius.lg}`}>
            <CheckCircle2 className={`w-5 h-5 ${colors.status.success.text600} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`${bodySmall.className} font-medium ${colors.status.success.text900}`}>
                ¡Test cases guardados exitosamente!
              </p>
              <p className={`${bodySmall.className} ${colors.status.success.text700} mt-1`}>
                Cerrando modal...
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {saveError && (
          <div className={`flex items-start gap-2 p-3 ${colors.status.error[50]} border ${colors.status.error.border200} ${borderRadius.lg}`}>
            <AlertCircle className={`w-5 h-5 ${colors.status.error.text600} flex-shrink-0 mt-0.5`} />
            <p className={`${bodySmall.className} ${colors.status.error.text800}`}>{saveError}</p>
          </div>
        )}

        {/* Test cases list */}
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {testCases.map((tc, index) => {
            const isEditing = editingId === tc.suggested_id;
            const isExpanded = expandedId === tc.suggested_id;

            return (
              <div
                key={tc.suggested_id}
                className={`p-4 border ${colors.gray.border200} ${borderRadius.lg} ${colors.white}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${bodySmall.className} font-medium ${colors.gray.text500}`}>
                        #{index + 1}
                      </span>
                      <span className={`px-2 py-0.5 ${bodySmall.className} font-medium ${borderRadius.base} ${colors.brand.primary[100]} ${colors.brand.primary.text800}`}>
                        {tc.test_type}
                      </span>
                      {tc.scenarios_count && (
                        <span className={`${bodySmall.className} ${colors.gray.text500}`}>
                          {tc.scenarios_count} escenario{tc.scenarios_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    {isEditing ? (
                      <input
                        type="text"
                        value={tc.title}
                        onChange={(e) => handleEdit(tc.suggested_id, 'title', e.target.value)}
                        className={`w-full px-2 py-1 ${bodySmall.className} font-medium border ${colors.brand.primary.border300} ${borderRadius.base} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Título del test case"
                      />
                    ) : (
                      <h4 className={`${bodySmall.className} font-medium ${colors.gray.text900}`}>
                        {tc.title}
                      </h4>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingId(isEditing ? null : tc.suggested_id)}
                      className={`p-1 ${colors.brand.primary.text600} hover:bg-blue-50 ${borderRadius.base} transition-colors`}
                      title={isEditing ? 'Guardar cambios' : 'Editar'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : tc.suggested_id)}
                      className={`p-1 ${colors.gray.text600} hover:bg-gray-50 ${borderRadius.base} transition-colors`}
                      title={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                    >
                      {isExpanded ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(tc.suggested_id)}
                      className={`p-1 ${colors.status.error.text600} hover:bg-red-50 ${borderRadius.base} transition-colors`}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {isEditing ? (
                  <textarea
                    value={tc.description || ''}
                    onChange={(e) => handleEdit(tc.suggested_id, 'description', e.target.value)}
                    className={`w-full px-2 py-1 ${bodySmall.className} border ${colors.brand.primary.border300} ${borderRadius.base} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]`}
                    placeholder="Descripción del test case"
                  />
                ) : (
                  <p className={`${bodySmall.className} ${colors.gray.text600}`}>
                    {tc.description}
                  </p>
                )}

                {/* Expanded details */}
                {isExpanded && tc.gherkin_content && (
                  <div className={`mt-3 p-3 ${colors.gray[50]} ${borderRadius.base} border ${colors.gray.border200}`}>
                    <p className={`${bodySmall.className} font-medium ${colors.gray.text700} mb-2`}>
                      Escenarios Gherkin:
                    </p>
                    <pre className={`${bodySmall.className} ${colors.gray.text800} whitespace-pre-wrap font-mono`}>
                      {tc.gherkin_content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className={`p-3 ${colors.status.warning[50]} border ${colors.status.warning.border200} ${borderRadius.lg}`}>
          <p className={`${bodySmall.className} ${colors.status.warning.text800}`}>
            💡 Puedes editar los títulos y descripciones antes de guardar. Los test cases se crearán
            con los escenarios Gherkin generados automáticamente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={isSaving || saveSuccess || testCases.length === 0}
          >
            {isSaving ? 'Guardando...' : `Guardar Todos (${testCases.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
