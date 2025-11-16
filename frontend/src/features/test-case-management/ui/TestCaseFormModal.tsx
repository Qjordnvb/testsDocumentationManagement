/**
 * Test Case Form Modal
 * Form for manually creating or editing test cases
 */

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { testCaseApi } from '@/entities/test-case';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { TestCase } from '@/entities/test-case';

interface TestCaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  testCase?: TestCase; // If provided, edit mode; otherwise create mode
  defaultUserStoryId?: string;
}

export const TestCaseFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  testCase,
  defaultUserStoryId,
}: TestCaseFormModalProps) => {
  const isEditMode = !!testCase;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    user_story_id: defaultUserStoryId || '',
    test_type: 'FUNCTIONAL',
    priority: 'MEDIUM',
    status: 'NOT_RUN',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset form when testCase changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (testCase) {
        setFormData({
          title: testCase.title || '',
          description: testCase.description || '',
          user_story_id: testCase.user_story_id || '',
          test_type: testCase.test_type || 'FUNCTIONAL',
          priority: testCase.priority || 'MEDIUM',
          status: testCase.status || 'NOT_RUN',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          user_story_id: defaultUserStoryId || '',
          test_type: 'FUNCTIONAL',
          priority: 'MEDIUM',
          status: 'NOT_RUN',
        });
      }
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, testCase, defaultUserStoryId]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setSaveError('El título es requerido');
      return;
    }

    if (!formData.user_story_id.trim()) {
      setSaveError('El ID de la user story es requerido');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (isEditMode) {
        await testCaseApi.update(testCase.id, formData);
      } else {
        await testCaseApi.create(formData);
      }

      setSaveSuccess(true);

      // Auto-close after 1 second
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error('Error saving test case:', error);
      setSaveError(
        error.response?.data?.detail || `Error al ${isEditMode ? 'actualizar' : 'crear'} el test case`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!saveSuccess && (formData.title || formData.description)) {
      if (!confirm('¿Descartar cambios?')) {
        return;
      }
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Editar Test Case' : 'Crear Test Case Manual'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success message */}
        {saveSuccess && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">
                {isEditMode ? '¡Test case actualizado!' : '¡Test case creado!'}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Cerrando modal...
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {saveError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Verificar login con credenciales válidas"
            required
            disabled={isSaving || saveSuccess}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe el objetivo y alcance de este test case..."
            disabled={isSaving || saveSuccess}
          />
        </div>

        {/* User Story ID */}
        <div>
          <label htmlFor="user_story_id" className="block text-sm font-medium text-gray-700 mb-1">
            ID de User Story *
          </label>
          <input
            type="text"
            id="user_story_id"
            name="user_story_id"
            value={formData.user_story_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: US-001"
            required
            disabled={isSaving || saveSuccess}
          />
        </div>

        {/* Test Type and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="test_type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Test
            </label>
            <select
              id="test_type"
              name="test_type"
              value={formData.test_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving || saveSuccess}
            >
              <option value="FUNCTIONAL">Functional</option>
              <option value="UI">UI/UX</option>
              <option value="API">API</option>
              <option value="INTEGRATION">Integration</option>
              <option value="SECURITY">Security</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="REGRESSION">Regression</option>
              <option value="SMOKE">Smoke</option>
              <option value="E2E">E2E</option>
              <option value="ACCESSIBILITY">Accessibility</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving || saveSuccess}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSaving || saveSuccess}
          >
            <option value="NOT_RUN">Not Run</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="BLOCKED">Blocked</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 Después de crear el test case, podrás agregar escenarios Gherkin usando el editor.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSaving || saveSuccess}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving || saveSuccess}
          >
            {isSaving ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Test Case')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
