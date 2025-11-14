/**
 * User Story Entity - UI
 * Story Card component for displaying user stories
 */

import type { UserStory } from '../model/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { PriorityBadge, StatusBadge } from '@/shared/ui';

export interface StoryCardProps {
  story: UserStory;
  onClick?: (story: UserStory) => void;
  showFullDescription?: boolean;
}

export const StoryCard = ({
  story,
  onClick,
  showFullDescription = false,
}: StoryCardProps) => {
  const completedCriteria = story.acceptance_criteria.filter((c) => c.completed).length;
  const totalCriteria = story.acceptance_criteria.length;

  return (
    <Card
      hover
      className={onClick ? 'cursor-pointer' : ''}
      onClick={() => onClick?.(story)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>{story.title}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={story.priority} />
            <StatusBadge status={story.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className={`text-gray-600 mb-4 ${!showFullDescription ? 'line-clamp-2' : ''}`}>
          {story.description}
        </p>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          {story.epic && (
            <div>
              <span className="text-gray-500">Epic:</span>
              <p className="font-medium">{story.epic}</p>
            </div>
          )}
          {story.sprint && (
            <div>
              <span className="text-gray-500">Sprint:</span>
              <p className="font-medium">{story.sprint}</p>
            </div>
          )}
          {story.story_points && (
            <div>
              <span className="text-gray-500">Story Points:</span>
              <p className="font-medium">{story.story_points}</p>
            </div>
          )}
          {story.assigned_to && (
            <div>
              <span className="text-gray-500">Assigned:</span>
              <p className="font-medium">{story.assigned_to}</p>
            </div>
          )}
        </div>

        {/* Acceptance Criteria Progress */}
        {totalCriteria > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Acceptance Criteria</span>
              <span className="font-medium">
                {completedCriteria}/{totalCriteria}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-blue to-primary-purple h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCriteria / totalCriteria) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Test Cases Count */}
        {story.test_case_ids.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span>✅</span>
            <span>{story.test_case_ids.length} test cases</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
