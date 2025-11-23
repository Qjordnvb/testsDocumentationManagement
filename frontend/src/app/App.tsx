/**
 * Main App Component
 * Configures React Router and wraps pages with Layout
 * Implements multi-project architecture with authentication
 * UPDATED: Added authentication with role-based access control
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/app/providers';
import { ProtectedRoute } from '@/app/components';
import { ProjectProvider } from '@/app/providers/ProjectContext';
import { Layout } from '@/widgets/header/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { UsersManagementPage } from '@/pages/UsersManagementPage';
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
      <AuthProvider>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes: Require Authentication */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ProjectProvider>
                  <Layout>
                    <Routes>
                      {/* Landing: Project Selection */}
                      <Route path="/" element={<ProjectsListPage />} />

                      {/* Admin Only: User Management */}
                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute requiredRoles={['admin']}>
                            <UsersManagementPage />
                          </ProtectedRoute>
                        }
                      />

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
              </ProtectedRoute>
            }
          />
        </Routes>

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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
