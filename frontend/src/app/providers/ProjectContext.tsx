/**
 * Project Context Provider
 * Manages current project state across the application
 * Persists selection to localStorage
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Project } from '@/entities/project';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('currentProject');
    if (stored) {
      try {
        const project = JSON.parse(stored);
        setCurrentProjectState(project);
      } catch (error) {
        console.error('Failed to parse stored project:', error);
        localStorage.removeItem('currentProject');
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when changes
  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem('currentProject', JSON.stringify(project));
    } else {
      localStorage.removeItem('currentProject');
    }
  };

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
};

/**
 * Hook to use Project Context
 * Must be used within ProjectProvider
 */
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
