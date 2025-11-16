/**
 * Create Project Modal
 * Form to create a new project
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { projectApi, type CreateProjectDTO } from '@/entities/project';
import { useProject } from '@/app/providers/ProjectContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }: CreateProjectModalProps) => {
  const navigate = useNavigate();
  const { setCurrentProject } = useProject();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProjectDTO>({
    name: '',
    description: '',
    client: '',
    team_members: [],
    default_test_types: ['FUNCTIONAL', 'UI'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('El nombre del proyecto es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newProject = await projectApi.create(formData);

      // Set as current project
      setCurrentProject(newProject);

      // Navigate to project dashboard
      navigate(`/projects/${newProject.id}/dashboard`);

      // Close modal and call success callback
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.detail || 'Error al crear el proyecto');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      client: '',
      team_members: [],
      default_test_types: ['FUNCTIONAL', 'UI'],
    });
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Proyecto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Proyecto *
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: E-commerce App QA"
            required
            disabled={loading}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción breve del proyecto..."
            rows={3}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Client */}
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
            Cliente
          </label>
          <Input
            id="client"
            value={formData.client}
            onChange={(e) => setFormData({ ...formData, client: e.target.value })}
            placeholder="Nombre del cliente (opcional)"
            disabled={loading}
          />
        </div>

        {/* Default Test Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipos de Test por Defecto
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['FUNCTIONAL', 'UI', 'API', 'INTEGRATION', 'SECURITY', 'PERFORMANCE'].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.default_test_types?.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...(formData.default_test_types || []), type]
                      : (formData.default_test_types || []).filter((t) => t !== type);
                    setFormData({ ...formData, default_test_types: newTypes });
                  }}
                  disabled={loading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name.trim()}
          >
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
