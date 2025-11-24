/**
 * Bugs Grouped View Component
 * Groups bugs by test case and scenario
 */

import type { TestCaseGroup } from '@/entities/bug';
import { Bug as BugIcon, ChevronDown, ChevronRight, Calendar, User } from 'lucide-react';
import { EmptyState } from '@/shared/ui';
import {
  getStatusIcon,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  formatDate,
} from '../lib';

interface BugsGroupedViewProps {
  groupedBugs: TestCaseGroup[];
  expandedTestCases: Set<string>;
  expandedScenarios: Set<string>;
  onToggleTestCase: (testCaseId: string) => void;
  onToggleScenario: (scenarioKey: string) => void;
  onBugClick: (bugId: string) => void;
}

export const BugsGroupedView = ({
  groupedBugs,
  expandedTestCases,
  expandedScenarios,
  onToggleTestCase,
  onToggleScenario,
  onBugClick,
}: BugsGroupedViewProps) => {
  if (groupedBugs.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<BugIcon className="w-full h-full" />}
          message="No se encontraron bugs agrupados"
          description="Los bugs se agruparán automáticamente por Test Case y Scenario cuando sean reportados"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedBugs.map((testCaseGroup) => {
        const isExpanded = expandedTestCases.has(testCaseGroup.test_case_id);

        return (
          <div key={testCaseGroup.test_case_id} className="card overflow-hidden">
            {/* Test Case Header */}
            <div
              onClick={() => onToggleTestCase(testCaseGroup.test_case_id)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100"
            >
              <div className="flex items-center gap-3 flex-1">
                {isExpanded ? (
                  <ChevronDown size={20} className="text-blue-600 flex-shrink-0" />
                ) : (
                  <ChevronRight size={20} className="text-blue-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base">
                    {testCaseGroup.test_case_title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-mono text-blue-600">
                      {testCaseGroup.test_case_id}
                    </span>
                    {' • '}
                    {testCaseGroup.scenarios.length} scenario(s) {' • '}
                    {testCaseGroup.total_bugs} bug(s) total
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                {testCaseGroup.total_bugs} Bugs
              </div>
            </div>

            {/* Scenarios (Expandable) */}
            {isExpanded && (
              <div className="p-4 space-y-3 bg-gray-50">
                {testCaseGroup.scenarios.map((scenarioGroup) => {
                  const scenarioKey = `${testCaseGroup.test_case_id}-${scenarioGroup.scenario_name}`;
                  const isScenarioExpanded = expandedScenarios.has(scenarioKey);

                  return (
                    <div
                      key={scenarioKey}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                    >
                      {/* Scenario Header */}
                      <div
                        onClick={() => onToggleScenario(scenarioKey)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors bg-gradient-to-r from-purple-50 to-pink-50"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isScenarioExpanded ? (
                            <ChevronDown size={18} className="text-purple-600 flex-shrink-0" />
                          ) : (
                            <ChevronRight size={18} className="text-purple-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {scenarioGroup.scenario_name}
                            </h4>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                          {scenarioGroup.bug_count} Bug(s)
                        </div>
                      </div>

                      {/* Bugs List (Expandable) */}
                      {isScenarioExpanded && (
                        <div className="p-3 space-y-2 bg-gray-50 border-t border-gray-200">
                          {scenarioGroup.bugs.map((bug) => (
                            <div
                              key={bug.id}
                              onClick={() => onBugClick(bug.id)}
                              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                            >
                              <div className="flex items-start gap-3">
                                {getStatusIcon(bug.status)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-mono font-medium text-blue-600">
                                      {bug.id}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${getSeverityBadgeClass(bug.severity)}`}
                                    >
                                      {bug.severity}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(bug.status)}`}
                                    >
                                      {bug.status}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                    {bug.title}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {bug.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={12} />
                                      {formatDate(bug.reported_date)}
                                    </div>
                                    {bug.assigned_to && (
                                      <div className="flex items-center gap-1">
                                        <User size={12} />
                                        {bug.assigned_to}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
