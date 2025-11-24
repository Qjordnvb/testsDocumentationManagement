/**
 * UserStoryCard Component
 * Card view for user stories with hover actions
 */

import { useState } from 'react';
import { MoreVertical, Beaker, Eye, Edit2 } from 'lucide-react';
import type { UserStory } from '@/entities/user-story';
import { useAuth } from '@/app/providers';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';

interface Props {
  story: UserStory;
  onGenerateTests: (storyId: string) => void;
  onViewTests: (storyId: string) => void;
  onEdit: (storyId: string) => void;
}

export const UserStoryCard: React.FC<Props> = ({
  story,
  onGenerateTests,
  onViewTests,
  onEdit,
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const { hasRole } = useAuth();

  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');
  const headingSmall = getTypographyPreset('headingSmall');

  // Calculate completion
  const totalCriteria = story.acceptance_criteria.length;
  const completedCriteria = story.acceptance_criteria.filter(c => c.completed).length;
  const completionPercent = totalCriteria > 0 ? (completedCriteria / totalCriteria) * 100 : 0;

  // Has tests
  const hasTests = story.test_case_ids && story.test_case_ids.length > 0;

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return colors.status.error.text600;
      case 'High':
        return colors.status.warning.text600;
      case 'Medium':
        return colors.brand.primary.text600;
      case 'Low':
        return colors.gray.text500;
      default:
        return colors.gray.text600;
    }
  };

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return `${colors.status.success[100]} ${colors.status.success.text700} border-green-300`;
      case 'In Progress':
        return `${colors.status.warning[100]} ${colors.status.warning.text700} border-yellow-300`;
      case 'Testing':
        return `${colors.brand.primary[100]} ${colors.brand.primary.text700} border-blue-300`;
      case 'In Review':
        return `${colors.brand.secondary[100]} text-purple-700 border-purple-300`;
      default:
        return `${colors.gray[100]} ${colors.gray.text700} border-gray-300`;
    }
  };

  return (
    <div className="relative card hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`${bodySmall.className} font-mono ${colors.gray.text600} flex-shrink-0`}>
            {story.id}
          </span>
          <span className={`${bodySmall.className} font-semibold ${getPriorityColor(story.priority)} flex-shrink-0`}>
            {story.priority}
          </span>
        </div>

        {/* Actions menu button */}
        <button
          onClick={() => setShowActionsMenu(!showActionsMenu)}
          className={`p-2 ${borderRadius.base} hover:bg-gray-100 transition-colors ${showActionsMenu ? 'bg-gray-100' : ''}`}
        >
          <MoreVertical size={18} className={colors.gray.text600} />
        </button>
      </div>

      {/* Title */}
      <h3 className={`${headingSmall.className} font-bold ${colors.gray.text900} mb-3 line-clamp-2`}>
        {story.title}
      </h3>

      {/* Metadata */}
      <div className={`space-y-2 mb-4 ${bodySmall.className} ${colors.gray.text600}`}>
        {story.epic && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Epic:</span>
            <span className="font-medium">{story.epic}</span>
          </div>
        )}
        {story.sprint && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Sprint:</span>
            <span className="font-medium">{story.sprint}</span>
          </div>
        )}
        {story.story_points && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Story Points:</span>
            <span className="font-medium">{story.story_points}</span>
          </div>
        )}
      </div>

      {/* Acceptance Criteria Progress - Readonly for DEV */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`${bodySmall.className} ${colors.gray.text700} font-medium`}>
            Criterios de Aceptación
          </span>
          <span className={`${bodySmall.className} font-semibold ${
            completionPercent === 100 ? colors.status.success.text600 :
            completionPercent > 0 ? colors.brand.primary.text600 :
            colors.gray.text400
          }`}>
            {completedCriteria}/{totalCriteria}
          </span>
        </div>
        <div className={`w-full h-2.5 ${colors.gray[200]} ${borderRadius.full} overflow-hidden border border-gray-300`}>
          <div
            className={`h-full transition-all duration-300 ${
              completionPercent === 100 ? colors.status.success[600] :
              completionPercent > 0 ? colors.brand.primary[600] :
              colors.gray[300]
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <div className={`${bodySmall.className} ${colors.gray.text500} text-right mt-1`}>
          {completionPercent.toFixed(0)}%
        </div>
      </div>

      {/* Tests indicator */}
      {hasTests && (
        <div className={`mb-4 ${bodySmall.className}`}>
          <button
            onClick={() => onViewTests(story.id)}
            className={`flex items-center gap-1 ${colors.brand.primary.text600} hover:text-blue-800 font-medium`}
          >
            <Beaker size={14} />
            {story.test_case_ids!.length} Test Case{story.test_case_ids!.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1.5 ${borderRadius.md} ${getStatusColor(story.status)} border text-sm font-semibold`}>
        {story.status}
      </div>

      {/* Actions Menu Dropdown */}
      {showActionsMenu && (
        <div className="absolute top-12 right-4 bg-white border border-gray-200 rounded-lg shadow-xl z-10 py-2 min-w-[200px]">
          {hasTests ? (
            <button
              onClick={() => {
                onViewTests(story.id);
                setShowActionsMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${body.className}`}
            >
              <Eye size={18} className={colors.brand.primary.text600} />
              <span>Ver Tests ({story.test_case_ids!.length})</span>
            </button>
          ) : (
            // Only ADMIN and QA can generate tests
            hasRole('admin', 'qa') && (
              <button
                onClick={() => {
                  onGenerateTests(story.id);
                  setShowActionsMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${body.className}`}
              >
                <Beaker size={18} className={colors.brand.primary.text600} />
                <span>Generate Tests</span>
              </button>
            )
          )}
          {/* Only QA and ADMIN can edit */}
          {hasRole('admin', 'qa') && (
            <button
              onClick={() => {
                onEdit(story.id);
                setShowActionsMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${body.className}`}
            >
              <Edit2 size={18} className={colors.gray.text600} />
              <span>Edit Story</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
