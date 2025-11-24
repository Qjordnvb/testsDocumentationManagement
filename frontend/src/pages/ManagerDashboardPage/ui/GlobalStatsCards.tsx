/**
 * Global Statistics Cards Component
 * Displays total projects, stories, tests, and bugs
 */

import { Target, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GlobalStats, BreakdownType } from '../model';

interface GlobalStatsCardsProps {
  stats: GlobalStats;
  onShowBreakdown: (type: BreakdownType) => void;
  onToggleActive: () => void;
}

export const GlobalStatsCards = ({
  stats,
  onShowBreakdown,
  onToggleActive,
}: GlobalStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Projects - Click to toggle active filter */}
      <button
        onClick={onToggleActive}
        className="card bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer text-left group"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600">Total Proyectos</h3>
          <Target size={24} className="text-blue-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">{stats.totalProjects}</span>
          <span className="text-lg text-gray-500">
            ({stats.activeProjects} activos)
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2 group-hover:text-blue-600">
          Click para filtrar activos
        </p>
      </button>

      {/* Total Stories */}
      <button
        onClick={() => onShowBreakdown('stories')}
        className="card bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer text-left group"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600">User Stories</h3>
          <FileText size={24} className="text-green-600" />
        </div>
        <div className="text-4xl font-bold text-gray-900">{stats.totalStories}</div>
        <p className="text-xs text-gray-400 mt-2 group-hover:text-green-600">
          Click para ver breakdown
        </p>
      </button>

      {/* Total Tests */}
      <button
        onClick={() => onShowBreakdown('tests')}
        className="card bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer text-left group"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600">Test Cases</h3>
          <CheckCircle2 size={24} className="text-purple-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">{stats.totalTests}</span>
          <span className="text-lg text-gray-500">
            ({stats.avgCoverage.toFixed(0)}% avg)
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2 group-hover:text-purple-600">
          Click para ver breakdown
        </p>
      </button>

      {/* Total Bugs */}
      <button
        onClick={() => onShowBreakdown('bugs')}
        className="card bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer text-left group"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600">Bugs Activos</h3>
          <AlertCircle size={24} className="text-red-600" />
        </div>
        <div className="text-4xl font-bold text-gray-900">{stats.totalBugs}</div>
        <p className="text-xs text-gray-400 mt-2 group-hover:text-red-600">
          Click para ver breakdown
        </p>
      </button>
    </div>
  );
};
