/**
 * Projects Toolbar Component
 * Search, filters, sort, and view mode controls
 */

import { Search, Grid3x3, List, Plus } from 'lucide-react';
import type { ViewMode, SortBy } from '../model/useProjectsList';

interface ProjectsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateProject?: () => void;
  canCreateProject: boolean;
}

export const ProjectsToolbar = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onCreateProject,
  canCreateProject,
}: ProjectsToolbarProps) => {
  return (
    <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
      {/* Left side: Search and Filters */}
      <div className="flex items-center gap-3 flex-1">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, equipo o descripción..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortBy)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white"
        >
          <option value="recent">Más recientes</option>
          <option value="name">Nombre (A-Z)</option>
          <option value="coverage">Mayor cobertura</option>
          <option value="bugs">Más bugs</option>
        </select>
      </div>

      {/* Right side: View mode and Create */}
      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vista en cuadrícula"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vista en lista"
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Create Project Button */}
        {canCreateProject && onCreateProject && (
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 active:scale-100 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Nuevo proyecto
          </button>
        )}
      </div>
    </div>
  );
};
