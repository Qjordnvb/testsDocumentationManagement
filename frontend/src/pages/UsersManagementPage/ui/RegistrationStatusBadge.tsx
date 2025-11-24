/**
 * Registration Status Badge Component
 */

import { Badge } from '@/shared/ui';

interface RegistrationStatusBadgeProps {
  user: any; // Using any to match original implementation
}

export const RegistrationStatusBadge = ({ user }: RegistrationStatusBadgeProps) => {
  const isRegistered = user.last_login !== null && user.last_login !== undefined;

  if (isRegistered) {
    return <Badge variant="success">Registrado</Badge>;
  }

  return <Badge variant="warning">Pendiente</Badge>;
};
