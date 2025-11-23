/**
 * Summary Cards Component
 * Projects at risk and top performers
 */

import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { Project } from '@/entities/project';

interface SummaryCardsProps {
  projectsAtRisk: Project[];
  topProjects: Project[];
}

export const SummaryCards = ({ projectsAtRisk, topProjects }: SummaryCardsProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Alerts: Projects at Risk */}
      {projectsAtRisk.length > 0 && (
        <div className="card bg-red-50 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
            <AlertCircle size={24} className="text-red-600" />
            Proyectos que Requieren Atención ({projectsAtRisk.length})
          </h2>
          <div className="space-y-3">
            {projectsAtRisk.slice(0, 5).map((project) => {
              const issues = [];
              if (project.test_coverage < 50)
                issues.push(`Coverage bajo (${project.test_coverage.toFixed(0)}%)`);
              if (project.total_bugs > 10) issues.push(`${project.total_bugs} bugs activos`);
              if (project.total_user_stories > 0 && project.total_test_cases === 0)
                issues.push('Sin test cases');

              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {issues.map((issue, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button variant="danger" size="sm" leftIcon={<Eye size={16} />}>
                    Ver Detalles
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {topProjects.length > 0 && (
        <div className="card bg-green-50 border-l-4 border-green-500">
          <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={24} className="text-green-600" />
            Proyectos con Mejor Desempeño
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {topProjects.map((project, idx) => (
              <div
                key={project.id}
                className="p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}/dashboard`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">#{idx + 1}</span>
                  <span className="text-3xl font-bold text-green-600">
                    {project.test_coverage.toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600">
                  {project.total_test_cases} tests · {project.total_bugs} bugs
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
