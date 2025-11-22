/**
 * Main App Component
 * Configures React Router and wraps pages with Layout
 * Implements multi-project architecture
 * UPDATED: Added test generation polling hook
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProjectProvider } from '@/app/providers/ProjectContext';
import { Layout } from '@/widgets/header/Layout';
import { ProjectsListPage } from '@/pages/ProjectsListPage';
import { Dashboard } from '@/pages/DashboardPage';
import { StoriesPage } from '@/pages/StoriesPage';
import { TestCasesPage } from '@/pages/TestCasesPage';
import { BugsPage } from '@/pages/BugsPage';
import { BugDetailsPage } from '@/pages/BugDetailsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { useTestGenerationPolling } from '@/shared/lib/useTestGenerationPolling';

// Placeholder pages (to be created)

const SettingsPage = () => (
  <div className="card">
    <h1 className="text-2xl font-bold">⚙️ Project Settings</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

function App() {
  // Initialize test generation polling (runs in background)
  useTestGenerationPolling();

  return (
    <BrowserRouter>
      <ProjectProvider>
        <Layout>
          <Routes>
            {/* Landing: Project Selection (now with Layout) */}
            <Route path="/" element={<ProjectsListPage />} />

            {/* Project-scoped routes */}
            <Route path="/projects/:projectId">
              {/* Redirect /projects/:id to /projects/:id/dashboard */}
              <Route index element={<Navigate to="dashboard" replace />} />

              {/* Project pages */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="stories" element={<StoriesPage />} />
              <Route path="tests" element={<TestCasesPage />} />
              <Route path="bugs" element={<BugsPage />} />
              <Route path="bugs/:bugId" element={<BugDetailsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Layout>
      </ProjectProvider>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
