/**
 * DevRedirect Component
 * Redirects DEV users to a specific path, others to default path
 */

import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers';

interface DevRedirectProps {
  defaultPath: string; // Path for QA, ADMIN, MANAGER
  devPath: string;     // Path for DEV
}

export const DevRedirect = ({ defaultPath, devPath }: DevRedirectProps) => {
  const { hasRole } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();

  const targetPath = hasRole('dev') ? devPath : defaultPath;

  return <Navigate to={`/projects/${projectId}/${targetPath}`} replace />;
};
