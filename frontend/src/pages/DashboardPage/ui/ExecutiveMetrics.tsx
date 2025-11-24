/**
 * Executive Metrics Component (Manager View)
 * Health score, risk level, quality trend, test efficiency
 */

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { ExecutiveMetrics } from '../model';

interface ExecutiveMetricsProps {
  metrics: ExecutiveMetrics;
}

export const ExecutiveMetricsCards = ({ metrics }: ExecutiveMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Health Score */}
      <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Health Score</span>
          <Activity size={20} className="text-blue-600" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-1">
          {metrics.healthScore.toFixed(0)}
          <span className="text-xl text-gray-600">/100</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          {metrics.healthScore >= 70 ? (
            <CheckCircle2 size={16} className="text-green-600" />
          ) : (
            <AlertTriangle size={16} className="text-orange-500" />
          )}
          <span
            className={
              metrics.healthScore >= 70
                ? 'text-green-600'
                : 'text-orange-500'
            }
          >
            {metrics.healthScore >= 70
              ? 'Excelente'
              : metrics.healthScore >= 50
              ? 'Aceptable'
              : 'Requiere atención'}
          </span>
        </div>
      </div>

      {/* Risk Level */}
      <div
        className={`card border-l-4 ${
          metrics.riskLevel === 'high'
            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-500'
            : metrics.riskLevel === 'medium'
            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500'
            : 'bg-gradient-to-br from-green-50 to-green-100 border-green-500'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Nivel de Riesgo</span>
          <AlertTriangle
            size={20}
            className={
              metrics.riskLevel === 'high'
                ? 'text-red-600'
                : metrics.riskLevel === 'medium'
                ? 'text-orange-500'
                : 'text-green-600'
            }
          />
        </div>
        <div
          className={`text-2xl font-bold mb-1 ${
            metrics.riskLevel === 'high'
              ? 'text-red-600'
              : metrics.riskLevel === 'medium'
              ? 'text-orange-500'
              : 'text-green-600'
          }`}
        >
          {metrics.riskLevel === 'high'
            ? 'ALTO'
            : metrics.riskLevel === 'medium'
            ? 'MEDIO'
            : 'BAJO'}
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">{metrics.riskMessage}</p>
      </div>

      {/* Quality Trend */}
      <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Tendencia de Calidad</span>
          <Target size={20} className="text-purple-600" />
        </div>
        <div className="flex items-center gap-2 mb-1">
          {metrics.qualityTrend === 'improving' && (
            <>
              <TrendingUp size={32} className="text-green-600" />
              <span className="text-2xl font-bold text-green-600">Mejorando</span>
            </>
          )}
          {metrics.qualityTrend === 'stable' && (
            <>
              <Activity size={32} className="text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">Estable</span>
            </>
          )}
          {metrics.qualityTrend === 'declining' && (
            <>
              <TrendingDown size={32} className="text-red-600" />
              <span className="text-2xl font-bold text-red-600">En Declive</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-600">vs. promedio de proyectos</p>
      </div>

      {/* Test Efficiency */}
      <div className="card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Eficiencia de Testing</span>
          <CheckCircle2 size={20} className="text-green-600" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-1">
          {metrics.testEfficiency.toFixed(0)}%
        </div>
        <p className="text-xs text-gray-600">Test cases por user story</p>
      </div>
    </div>
  );
};
