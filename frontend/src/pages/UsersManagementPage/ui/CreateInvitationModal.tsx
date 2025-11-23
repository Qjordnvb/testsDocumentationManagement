/**
 * Create Invitation Modal Component
 */

import { useState } from 'react';
import type { CreateUserInvitationDTO, Role } from '@/entities/user';
import { Mail, X } from 'lucide-react';
import { FormGroup, Input, Select, Button } from '@/shared/ui';

interface CreateInvitationModalProps {
  onClose: () => void;
  onSubmit: (invitation: CreateUserInvitationDTO) => Promise<void>;
}

export const CreateInvitationModal = ({ onClose, onSubmit }: CreateInvitationModalProps) => {
  const [formData, setFormData] = useState<CreateUserInvitationDTO>({
    email: '',
    full_name: '',
    role: 'qa',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Crear Invitación</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            <span className="font-medium">Nota:</span> El usuario recibirá una invitación y deberá
            completar su registro creando una contraseña cuando ingrese al sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
            />
          </FormGroup>

          <FormGroup label="Nombre Completo" htmlFor="fullName" required>
            <Input
              id="fullName"
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </FormGroup>

          <FormGroup label="Rol" htmlFor="role" required>
            <Select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              options={[
                { value: 'qa', label: 'QA - Quality Assurance Engineer' },
                { value: 'dev', label: 'DEV - Developer' },
                { value: 'manager', label: 'MANAGER - Project Manager' },
                { value: 'admin', label: 'ADMIN - Administrator' },
              ]}
            />
          </FormGroup>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              isLoading={submitting}
              leftIcon={<Mail className="w-4 h-4" />}
              className="flex-1"
            >
              Crear Invitación
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
