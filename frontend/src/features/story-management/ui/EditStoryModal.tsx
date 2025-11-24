/**
 * Edit Story Modal
 * Modal for editing user story details
 */

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { UserStory, Priority, Status, AcceptanceCriteria } from '@/entities/user-story';
import toast from 'react-hot-toast';

interface EditStoryModalProps {
  isOpen: boolean;
  story: UserStory;
  onClose: () => void;
  onSave: (storyId: string, updates: Partial<UserStory>) => Promise<void>;
}

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Status[] = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Testing', 'Done'];

export const EditStoryModal = ({ isOpen, story, onClose, onSave }: EditStoryModalProps) => {
  const [formData, setFormData] = useState({
    title: story.title,
    description: story.description,
    priority: story.priority,
    status: story.status,
    epic: story.epic || '',
    sprint: story.sprint || '',
    story_points: story.story_points || 0,
    assigned_to: story.assigned_to || '',
    acceptance_criteria: [...story.acceptance_criteria],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: story.title,
        description: story.description,
        priority: story.priority,
        status: story.status,
        epic: story.epic || '',
        sprint: story.sprint || '',
        story_points: story.story_points || 0,
        assigned_to: story.assigned_to || '',
        acceptance_criteria: [...story.acceptance_criteria],
      });
    }
  }, [isOpen, story]);

  const handleAddCriteria = () => {
    setFormData({
      ...formData,
      acceptance_criteria: [
        ...formData.acceptance_criteria,
        { description: '', completed: false },
      ],
    });
  };

  const handleRemoveCriteria = (index: number) => {
    setFormData({
      ...formData,
      acceptance_criteria: formData.acceptance_criteria.filter((_, i) => i !== index),
    });
  };

  const handleCriteriaChange = (index: number, value: string) => {
    const updated = [...formData.acceptance_criteria];
    updated[index] = { ...updated[index], description: value };
    setFormData({ ...formData, acceptance_criteria: updated });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('La descripción es requerida');
      return;
    }

    // Filter out empty criteria
    const validCriteria = formData.acceptance_criteria.filter(
      (c) => c.description.trim() !== ''
    );

    try {
      setIsSaving(true);
      await onSave(story.id, {
        ...formData,
        acceptance_criteria: validCriteria,
      });
      toast.success('Historia actualizada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error updating story:', error);
      toast.error('Error al actualizar la historia');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Editar User Story</h2>
              <p className="text-sm text-gray-600 mt-1 font-mono">{story.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ingrese el título de la historia"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Describe la funcionalidad de la historia"
            />
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Priority })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Epic, Sprint, Story Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Epic</label>
              <input
                type="text"
                value={formData.epic}
                onChange={(e) => setFormData({ ...formData, epic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sprint</label>
              <input
                type="text"
                value={formData.sprint}
                onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Story Points
              </label>
              <input
                type="number"
                min="0"
                value={formData.story_points}
                onChange={(e) =>
                  setFormData({ ...formData, story_points: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asignado a
            </label>
            <input
              type="email"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="email@ejemplo.com"
            />
          </div>

          {/* Acceptance Criteria */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Criterios de Aceptación ({formData.acceptance_criteria.length})
              </label>
              <Button
                variant="outline-primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={handleAddCriteria}
              >
                Agregar Criterio
              </Button>
            </div>

            <div className="space-y-2">
              {formData.acceptance_criteria.map((criteria, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={criteria.description}
                      onChange={(e) => handleCriteriaChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      placeholder={`Criterio ${index + 1}`}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveCriteria(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Eliminar criterio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {formData.acceptance_criteria.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm">No hay criterios de aceptación</p>
                  <p className="text-xs mt-1">Click en "Agregar Criterio" para añadir uno</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            isLoading={isSaving}
            leftIcon={!isSaving ? <Save size={18} /> : undefined}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
};
