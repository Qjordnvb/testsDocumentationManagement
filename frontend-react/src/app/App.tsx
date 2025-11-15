/**
 * Main App Component
 * Configures React Router and wraps pages with Layout
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/widgets/header/Layout';
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
    <h1 className="text-2xl font-bold">⚙️ Settings</h1>
    <p className="text-gray-600 mt-2">Coming soon...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/tests" element={<TestCasesPage />} />
          <Route path="/bugs" element={<BugsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
