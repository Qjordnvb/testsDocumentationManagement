/**
 * Gherkin Editor Component
 * Code editor for Gherkin .feature files with syntax highlighting
 */

import { useState, useEffect } from 'react';
import { Save, X, FileText } from 'lucide-react';
import { Button } from '../Button';

interface GherkinEditorProps {
  testCaseId?: string;
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  readOnly?: boolean;
}

export const GherkinEditor = ({
  initialContent = '',
  onSave,
  onCancel,
  readOnly = false,
}: GherkinEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    setHasChanges(content !== initialContent);
  }, [content, initialContent]);

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(content);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving Gherkin content:', error);
      setSaveError(
        error.response?.data?.detail || 'Error al guardar el archivo Gherkin'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !confirm('¿Descartar cambios no guardados?')) {
      return;
    }
    onCancel();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">
            Editor Gherkin
          </h3>
          {hasChanges && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
              Sin guardar
            </span>
          )}
          {readOnly && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
              Solo lectura
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {!readOnly && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCancel}
            className="flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {saveError && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 p-4 overflow-auto">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={readOnly}
          className={`
            w-full h-full min-h-[400px] p-4 font-mono text-sm
            border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${readOnly ? 'bg-gray-50 text-gray-700' : 'bg-white text-gray-900'}
          `}
          placeholder="# language: es
Feature: Nombre de la característica

  Scenario: Nombre del escenario
    Given un contexto inicial
    When se ejecuta una acción
    Then se obtiene un resultado esperado"
          spellCheck={false}
        />
      </div>

      {/* Info footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600">
          💡 Formato Gherkin: Feature → Scenario → Given/When/Then
        </p>
        {!readOnly && (
          <p className="text-xs text-gray-500 mt-1">
            Los cambios se guardarán en el archivo .feature asociado al test case.
          </p>
        )}
      </div>
    </div>
  );
};
