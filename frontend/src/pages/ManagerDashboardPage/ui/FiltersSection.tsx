/**
 * Filters Section Component
 * Search, active, and at-risk filters
 */

import { Filter, AlertCircle, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { FilterState } from '../model';

interface FiltersSectionProps {
  filters: FilterState;
  hasActiveFilters: boolean;
  totalProjects: number;
  filteredCount: number;
  onToggleActive: () => void;
  onToggleAtRisk: () => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export const FiltersSection = ({
  filters,
  hasActiveFilters,
  totalProjects,
  filteredCount,
  onToggleActive,
  onToggleAtRisk,
  onSearchChange,
  onClearFilters,
}: FiltersSectionProps) => {
  return (
    <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar proyectos por nombre..."
              value={filters.searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filters.showOnlyActive ? 'primary' : 'outline-primary'}
            size="md"
            onClick={onToggleActive}
            leftIcon={<Filter size={16} />}
            className="shadow-sm"
          >
            {filters.showOnlyActive ? '✓ Activos' : 'Solo Activos'}
          </Button>
          <Button
            variant={filters.showOnlyAtRisk ? 'danger' : 'outline-danger'}
            size="md"
            onClick={onToggleAtRisk}
            leftIcon={<AlertCircle size={16} />}
            className="shadow-sm"
          >
            {filters.showOnlyAtRisk ? '⚠️ En Riesgo' : 'En Riesgo'}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="md"
              onClick={onClearFilters}
              leftIcon={<X size={16} />}
              className="border-2 border-gray-300"
            >
              Limpiar Filtros
            </Button>
          )}
        </div>
      </div>
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-blue-500">
          <p className="text-sm font-semibold text-gray-700">
            📊 Mostrando <span className="text-blue-600">{filteredCount}</span> de{' '}
            <span className="text-gray-900">{totalProjects}</span> proyectos
          </p>
          {filters.searchQuery && (
            <p className="text-xs text-gray-600 mt-1">Búsqueda: &quot;{filters.searchQuery}&quot;</p>
          )}
        </div>
      )}
    </div>
  );
};
