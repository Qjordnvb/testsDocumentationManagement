/**
 * Quick Actions Component
 * Consolidated report, compare projects, archived projects
 */

import { Download, GitCompare, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuickActionsProps {
  downloadingReport: boolean;
  onDownloadReport: () => void;
  onCompareProjects: () => void;
}

export const QuickActions = ({
  downloadingReport,
  onDownloadReport,
  onCompareProjects,
}: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Consolidated Report */}
      <button
        onClick={onDownloadReport}
        disabled={downloadingReport}
        className="card hover:shadow-lg transition-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 rounded-full p-4">
            <Download size={32} className="text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-gray-900">
              {downloadingReport ? 'Generando...' : 'Reporte Consolidado'}
            </h3>
            <p className="text-sm text-gray-600">
              Descargar métricas de todos los proyectos
            </p>
          </div>
        </div>
      </button>

      {/* Compare Projects */}
      <button
        onClick={onCompareProjects}
        className="card hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="bg-green-100 rounded-full p-4">
            <GitCompare size={32} className="text-green-600" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-gray-900">Comparar Proyectos</h3>
            <p className="text-sm text-gray-600">Ver métricas comparativas</p>
          </div>
        </div>
      </button>

      {/* Archived Projects */}
      <button
        onClick={() => toast('Mostrando solo proyectos archivados', { icon: 'ℹ️' })}
        className="card hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 rounded-full p-4">
            <Archive size={32} className="text-purple-600" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-gray-900">Proyectos Archivados</h3>
            <p className="text-sm text-gray-600">Ver proyectos inactivos</p>
          </div>
        </div>
      </button>
    </div>
  );
};
