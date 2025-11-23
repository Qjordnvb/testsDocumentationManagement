/**
 * Bugs List View Component
 */

import type { Bug } from '@/entities/bug';
import { Bug as BugIcon, Calendar, User } from 'lucide-react';
import { EmptyState } from '@/shared/ui';
import {
  getStatusIcon,
  getSeverityBadgeClass,
  getPriorityBadgeClass,
  getStatusBadgeClass,
  formatDate,
} from '../lib';

interface BugsListViewProps {
  bugs: Bug[];
  activeFiltersCount: number;
  onBugClick: (bugId: string) => void;
}

export const BugsListView = ({ bugs, activeFiltersCount, onBugClick }: BugsListViewProps) => {
  if (bugs.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<BugIcon className="w-full h-full" />}
          message="No se encontraron bugs"
          description={
            activeFiltersCount > 0
              ? 'Intenta ajustar los filtros para ver más resultados'
              : 'Los bugs reportados desde ejecuciones aparecerán aquí'
          }
        />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID / Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reportado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asignado a
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bugs.map((bug) => (
              <tr
                key={bug.id}
                onClick={() => onBugClick(bug.id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* ID / Title */}
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(bug.status)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono font-medium text-blue-600">{bug.id}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">
                        {bug.title}
                      </p>
                      {bug.user_story_id && (
                        <p className="text-xs text-gray-500 mt-1">Story: {bug.user_story_id}</p>
                      )}
                      {bug.test_case_id && (
                        <p className="text-xs text-gray-500">Test: {bug.test_case_id}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Severity */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityBadgeClass(bug.severity)}`}
                  >
                    {bug.severity}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(bug.priority)}`}
                  >
                    {bug.priority}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(bug.status)}`}
                  >
                    {bug.status.replace('_', ' ')}
                  </span>
                </td>

                {/* Type */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{bug.bug_type}</span>
                </td>

                {/* Reported Date */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    {formatDate(bug.reported_date)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <User size={12} />
                    {bug.reported_by}
                  </div>
                </td>

                {/* Assigned To */}
                <td className="px-6 py-4">
                  {bug.assigned_to ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-900">{bug.assigned_to}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Sin asignar</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
