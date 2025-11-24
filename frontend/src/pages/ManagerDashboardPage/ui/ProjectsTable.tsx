/**
 * Projects Table Component
 * Displays all projects with key metrics
 */

import { useNavigate } from 'react-router-dom';
import { TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/shared/ui';
import { calculateHealthScore } from '@/entities/project';
import type { Project } from '@/entities/project';

interface ProjectsTableProps {
  projects: Project[];
}

export const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  const navigate = useNavigate();

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 70) return 'text-green-600 bg-green-50';
    if (coverage >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Activo</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-semibold">Inactivo</span>;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp size={24} />
        Todos los Proyectos ({projects.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proyecto
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stories
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tests
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bugs
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coverage
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Health
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => {
              const healthScore = calculateHealthScore(project);

              return (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.name}
                        </div>
                        {project.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {project.total_user_stories}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {project.total_test_cases}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-semibold ${
                        project.total_bugs === 0
                          ? 'bg-green-100 text-green-700'
                          : project.total_bugs > 10
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {project.total_bugs}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getCoverageColor(
                        project.test_coverage
                      )}`}
                    >
                      {project.test_coverage.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {healthScore.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">/100</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                      leftIcon={<Eye size={16} />}
                    >
                      Ver Dashboard
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
