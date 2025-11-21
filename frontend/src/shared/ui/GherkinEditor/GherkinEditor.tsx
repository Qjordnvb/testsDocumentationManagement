/**
 * Gherkin Editor Component
 * Code editor for Gherkin .feature files with syntax highlighting
 */

import { useState, useEffect } from 'react';
import { Save, X, FileText } from 'lucide-react';
import { Button } from '../Button';
import {
  colors,
  borderRadius,
  getTypographyPreset,
} from '@/shared/design-system/tokens';

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

  // Get design tokens
  const bodySmall = getTypographyPreset('bodySmall');
  const code = getTypographyPreset('code');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${colors.gray.border200} ${colors.gray[50]}`}>
        <div className="flex items-center gap-2">
          <FileText className={`w-5 h-5 ${colors.gray.text600}`} />
          <h3 className={`${bodySmall.className} font-medium ${colors.gray.text900}`}>
            Editor Gherkin
          </h3>
          {hasChanges && (
            <span className={`px-2 py-0.5 ${bodySmall.className} font-medium ${borderRadius.base} ${colors.status.warning[100]} ${colors.status.warning.text800}`}>
              Sin guardar
            </span>
          )}
          {readOnly && (
            <span className={`px-2 py-0.5 ${bodySmall.className} font-medium ${borderRadius.base} ${colors.gray[100]} ${colors.gray.text700}`}>
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
        <div className={`mx-4 mt-4 p-3 ${colors.status.error[50]} border ${colors.status.error.border200} ${borderRadius.lg}`}>
          <p className={`${bodySmall.className} ${colors.status.error.text800}`}>{saveError}</p>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 p-4 overflow-auto">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={readOnly}
          className={`
            w-full h-full min-h-[400px] p-4 ${code.className} ${code.fontSize}
            border ${colors.gray.border300} ${borderRadius.lg}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${readOnly ? `${colors.gray[50]} ${colors.gray.text700}` : `${colors.white} ${colors.gray.text900}`}
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
      <div className={`p-3 border-t ${colors.gray.border200} ${colors.gray[50]}`}>
        <p className={`${bodySmall.className} ${colors.gray.text600}`}>
          💡 Formato Gherkin: Feature → Scenario → Given/When/Then
        </p>
        {!readOnly && (
          <p className={`${bodySmall.className} ${colors.gray.text500} mt-1`}>
            Los cambios se guardarán en el archivo .feature asociado al test case.
          </p>
        )}
      </div>
    </div>
  );
};
