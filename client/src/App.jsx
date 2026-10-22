import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import { PublicOnly, RequireAuth } from './components/common/RouteGuards.jsx';
import ComingSoon from './components/common/ComingSoon.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import PrepHubPage from './pages/PrepHubPage.jsx';
import SheetPage from './pages/SheetPage.jsx';
import ProblemPage from './pages/ProblemPage.jsx';
import MySpacesPage from './pages/MySpacesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Navigate to="/prep" replace />} />
        <Route path="prep" element={<PrepHubPage />} />
        <Route path="prep/:sheetId" element={<SheetPage />} />
        <Route path="prep/:sheetId/problem/:problemId" element={<ProblemPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-spaces" element={<MySpacesPage />} />
        <Route
          path="practice"
          element={<ComingSoon title="Practice" body="Timed drills and random unsolved picks will live here." />}
        />
        <Route
          path="community"
          element={<ComingSoon title="Community" body="A place to discuss problems with the other people on this LifeSheet." />}
        />
        {/* FUTURE: /admin — user management for the admin role (API already at GET /api/admin/users). */}
        <Route path="*" element={<ComingSoon title="Page not found" body="This page doesn’t exist. Head back to the Prep Hub." />} />
      </Route>
    </Routes>
  );
}
