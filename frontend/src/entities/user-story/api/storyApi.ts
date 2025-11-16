/**
 * User Story Entity - API
 * API functions for User Story CRUD operations
 */

import axios from 'axios';
import type { UserStory, CreateUserStoryDTO } from '../model/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// API Response Types
interface GetStoriesResponse {
  user_stories: UserStory[];
}

export const storyApi = {
  /**
   * Get all user stories
   */
  getAll: async (): Promise<UserStory[]> => {
    const { data } = await api.get<GetStoriesResponse>('/user-stories');
    return data.user_stories;
  },

  /**
   * Get a single user story by ID
   */
  getById: async (id: string): Promise<UserStory> => {
    const { data } = await api.get<UserStory>(`/user-stories/${id}`);
    return data;
  },

  /**
   * Create a new user story
   */
  create: async (story: CreateUserStoryDTO): Promise<UserStory> => {
    const { data } = await api.post<UserStory>('/user-stories', story);
    return data;
  },

  /**
   * Update an existing user story
   */
  update: async (id: string, updates: Partial<CreateUserStoryDTO>): Promise<UserStory> => {
    const { data } = await api.put<UserStory>(`/user-stories/${id}`, updates);
    return data;
  },

  /**
   * Delete a user story
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/user-stories/${id}`);
  },

  /**
   * Update acceptance criteria for a story
   */
  updateAcceptanceCriteria: async (
    storyId: string,
    criteriaId: string,
    completed: boolean
  ): Promise<UserStory> => {
    const { data } = await api.put<UserStory>(
      `/user-stories/${storyId}/acceptance-criteria/${criteriaId}`,
      { completed }
    );
    return data;
  },
};
