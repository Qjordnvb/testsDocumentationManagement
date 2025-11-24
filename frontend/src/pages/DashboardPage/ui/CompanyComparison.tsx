/**
 * Company Comparison Component (Manager View)
 * Compares project metrics with company averages
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import { getComparisonIndicator } from '@/entities/project';
import type { ProjectStats } from '@/entities/project';
import type { CompanyAverages } from '../model';
import { colors, getTypographyPreset } from '@/shared/design-system/tokens';

interface CompanyComparisonProps {
  stats: ProjectStats | null;
  coverage: number;
  companyAvg: CompanyAverages;
}

export const CompanyComparison = ({ stats, coverage, companyAvg }: CompanyComparisonProps) => {
  const headingMedium = getTypographyPreset('headingMedium');

  const renderComparison = (
    current: number,
    average: number,
    lowerIsBetter: boolean = false
  ) => {
    if (average === 0) return null;

    const indicator = getComparisonIndicator(current, average, lowerIsBetter);
    const Icon = indicator.isGood ? TrendingUp : TrendingDown;
    const colorClass = indicator.isGood ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
        <Icon size={16} />
        <span>
          {indicator.percentage.toFixed(1)}%{' '}
          {lowerIsBetter
            ? indicator.isGood
              ? 'menos'
              : 'más'
            : indicator.isGood
            ? 'mejor'
            : 'peor'}
        </span>
      </div>
    );
  };

  return (
    <div className="card">
      <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-4`}>
        📊 Comparación con Promedio de Proyectos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Coverage Comparison */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Cobertura de Tests</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">{coverage.toFixed(1)}%</span>
            <span className="text-sm text-gray-500">vs {companyAvg.coverage.toFixed(1)}%</span>
          </div>
          {renderComparison(coverage, companyAvg.coverage)}
        </div>

        {/* Bugs Comparison */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Bugs Totales</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">{stats?.total_bugs || 0}</span>
            <span className="text-sm text-gray-500">vs {companyAvg.bugs.toFixed(1)}</span>
          </div>
          {renderComparison(stats?.total_bugs || 0, companyAvg.bugs, true)}
        </div>

        {/* Stories Comparison */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">User Stories</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {stats?.total_user_stories || 0}
            </span>
            <span className="text-sm text-gray-500">vs {companyAvg.stories.toFixed(1)}</span>
          </div>
          <div className="text-sm text-gray-500">
            Tamaño {(stats?.total_user_stories || 0) > companyAvg.stories ? 'mayor' : 'menor'}{' '}
            al promedio
          </div>
        </div>

        {/* Tests Comparison */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Test Cases</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {stats?.total_test_cases || 0}
            </span>
            <span className="text-sm text-gray-500">vs {companyAvg.tests.toFixed(1)}</span>
          </div>
          {renderComparison(stats?.total_test_cases || 0, companyAvg.tests)}
        </div>
      </div>
    </div>
  );
};
