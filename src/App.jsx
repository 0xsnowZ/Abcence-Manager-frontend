import { useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navigation from "./components/Navigation.jsx";
import StagiairesPage from "./pages/StagiairesPage.jsx";
import AbsencesPage from "./pages/AbsencesPage.jsx";
import StatisticsPage from "./pages/StatisticsPage.jsx";
import SaisiePage from "./pages/SaisiePage.jsx";
import ProfsPage from "./pages/ProfsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ToastProvider } from "./components/ToastProvider.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Main App Layout for Protected Routes
function AppLayout() {
  const { user } = useSelector(state => state.auth);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <Navigation onCollapse={setCollapsed} />
      <div className={collapsed ? "app-body app-body--collapsed" : "app-body"}>
        <Routes>
          <Route path="/" element={<StagiairesPage />} />
          <Route path="/absences" element={user?.role === 'admin' ? <AbsencesPage /> : <Navigate to="/" replace />} />
          <Route path="/saisie" element={<SaisiePage />} />
          <Route
            path="/statistiques"
            element={user?.role === 'admin' ? <StatisticsPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/profs"
            element={user?.role === 'admin' ? <ProfsPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// Main App Component with Router Setup
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
