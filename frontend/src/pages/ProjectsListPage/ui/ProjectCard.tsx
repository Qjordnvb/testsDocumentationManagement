/**
 * Project Card Component
 * Displays project with health score, metrics, and team info
 */

import type { Project } from '@/entities/project';
import { Badge } from '@/shared/ui';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  // Calculate health score based on metrics
  const calculateHealthScore = (): number => {
    const storiesCount = project.total_user_stories || 1;

    // Coverage weight: 40%
    const coverageScore = (project.test_coverage / 100) * 40;

    // Bug density weight: 30% (less bugs is better)
    const bugDensity = project.total_bugs / storiesCount;
    const bugScore = Math.max(0, (1 - Math.min(1, bugDensity / 0.5)) * 30);

    // Test density weight: 30% (more tests is better)
    const testDensity = project.total_test_cases / storiesCount;
    const testScore = Math.min(30, (testDensity / 3) * 30);

    return Math.min(100, Math.round(coverageScore + bugScore + testScore));
  };

  const healthScore = calculateHealthScore();

  // Health score color
  const getHealthColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Status badge variant
  const getStatusBadge = () => {
    switch (project.status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>;
      case 'completed':
        return <Badge variant="info">Completado</Badge>;
      case 'archived':
        return <Badge variant="warning">Pausado</Badge>;
      default:
        return <Badge variant="default">{project.status}</Badge>;
    }
  };

  // Format last updated (simple version without date-fns)
  const formatLastUpdated = () => {
    try {
      const now = new Date();
      const updated = new Date(project.updated_date);
      const diffMs = now.getTime() - updated.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'hace un momento';
      if (diffMins < 60) return `hace ${diffMins} min`;
      if (diffHours < 24) return `hace ${diffHours} h`;
      if (diffDays < 7) return `hace ${diffDays} días`;
      return updated.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return 'hace un momento';
    }
  };

  // Mock team data (since not in Project type yet)
  const mockTeamMembers = [
    { initials: 'JD', color: 'bg-blue-500' },
    { initials: 'AM', color: 'bg-purple-500' },
    { initials: 'LS', color: 'bg-green-500' },
  ];

  return (
    <div
      onClick={() => onClick(project)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm font-medium ${getHealthTextColor(healthScore)}`}>
            Health {healthScore}%
          </span>
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getHealthColor(healthScore)}`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metadata */}
      {(project.team_members?.length || project.client) && (
        <p className="text-sm text-gray-500 mb-4">
          {project.team_members?.length && `Equipo: ${project.team_members.length} miembros`}
          {project.client && project.team_members?.length && ' · '}
          {project.client && `Cliente: ${project.client}`}
        </p>
      )}

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{project.total_user_stories}</p>
          <p className="text-xs text-gray-500">User stories</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{project.total_test_cases}</p>
          <p className="text-xs text-gray-500">Test cases</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{project.total_bugs}</p>
          <p className="text-xs text-gray-500">Bugs abiertos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{project.test_coverage.toFixed(0)}%</p>
          <p className="text-xs text-gray-500">Cobertura</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {/* Team avatars */}
        <div className="flex -space-x-2">
          {mockTeamMembers.map((member, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full ${member.color} border-2 border-white flex items-center justify-center text-xs font-semibold text-white`}
            >
              {member.initials}
            </div>
          ))}
        </div>

        {/* Last updated */}
        <p className="text-xs text-gray-500">
          Última actualización: {formatLastUpdated()}
        </p>
      </div>
    </div>
  );
};
