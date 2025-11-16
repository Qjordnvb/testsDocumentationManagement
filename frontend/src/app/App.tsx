/**
 * Main App Component
 * Configures React Router and wraps pages with Layout
 * Implements multi-project architecture
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from '@/app/providers/ProjectContext';
import { Layout } from '@/widgets/header/Layout';
import { ProjectsListPage } from '@/pages/ProjectsListPage';
import { Dashboard } from '@/pages/DashboardPage';
import { StoriesPage } from '@/pages/StoriesPage';
import { TestCasesPage } from '@/pages/TestCasesPage';

// Placeholder pages (to be created)

const BugsPage = () => (
  <div className="card">
    <h1 className="text-2xl font-bold">🐛 Bug Reports</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

const ReportsPage = () => (
  <div className="card">
    <h1 className="text-2xl font-bold">📄 Reports</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

const SettingsPage = () => (
  <div className="card">
    <h1 className="text-2xl font-bold">⚙️ Project Settings</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          {/* Landing: Project Selection */}
          <Route path="/" element={<ProjectsListPage />} />

          {/* Project-scoped routes */}
          <Route
            path="/projects/:projectId/*"
            element={
              <Layout>
                <Routes>
                  {/* Redirect /projects/:id to /projects/:id/dashboard */}
                  <Route index element={<Navigate to="dashboard" replace />} />

                  {/* Project pages */}
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="stories" element={<StoriesPage />} />
                  <Route path="tests" element={<TestCasesPage />} />
                  <Route path="bugs" element={<BugsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  );
}

export default App;
