/**
 * Bugs List View Component
 */

import type { Bug } from '@/entities/bug';
import { Calendar, User } from 'lucide-react';
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
          emoji={activeFiltersCount > 0 ? "🔍" : "🎉"}
          message={
            activeFiltersCount > 0
              ? "No se encontraron bugs con estos filtros"
              : "¡Excelente! No hay bugs reportados"
          }
          description={
            activeFiltersCount > 0
              ? 'Intenta ajustar los filtros para ver más resultados'
              : 'Los bugs reportados desde ejecuciones de test aparecerán aquí'
          }
          motivation={
            activeFiltersCount > 0
              ? undefined
              : '¡Sigue así! Un código sin bugs es un código feliz 😊'
          }
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden w-full max-w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full table-auto">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                ID / Título
              </th>
              <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Severidad
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Prioridad
              </th>
              <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Estado
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Tipo
              </th>
              <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Reportado
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
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
                <td className="px-3 md:px-6 py-4 max-w-[300px]">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0">{getStatusIcon(bug.status)}</div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-xs md:text-sm font-mono font-medium text-blue-600 truncate">{bug.id}</p>
                      <p className="text-xs md:text-sm font-medium text-gray-900 mt-0.5 line-clamp-2 break-words">
                        {bug.title}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Severity */}
                <td className="px-2 md:px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${getSeverityBadgeClass(bug.severity)}`}
                  >
                    {bug.severity}
                  </span>
                </td>

                {/* Priority - hidden on small screens */}
                <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(bug.priority)}`}
                  >
                    {bug.priority}
                  </span>
                </td>

                {/* Status */}
                <td className="px-2 md:px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(bug.status)}`}
                  >
                    {bug.status.replace('_', ' ')}
                  </span>
                </td>

                {/* Type - hidden on small screens */}
                <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700 truncate max-w-[120px] inline-block">{bug.bug_type}</span>
                </td>

                {/* Reported Date - hidden on smaller screens */}
                <td className="hidden xl:table-cell px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    {formatDate(bug.reported_date)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <User size={12} />
                    {bug.reported_by}
                  </div>
                </td>

                {/* Assigned To - hidden on small screens */}
                <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap max-w-[150px]">
                  {bug.assigned_to ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-900 truncate flex-1" title={bug.assigned_to}>
                        {bug.assigned_to}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Sin asignar</span>
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
