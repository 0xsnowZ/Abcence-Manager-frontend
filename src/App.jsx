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

// Main App Layout for Protected Routes
function AppLayout() {
  const { user } = useSelector(state => state.auth);

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <Navigation />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<StagiairesPage />} />
          <Route path="/absences" element={<AbsencesPage />} />
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
      </main>
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div className="container">
          <small>
            <i className="bi bi-calendar-check me-2"></i>
            Gestion d'État des Absences - Projet React Redux
          </small>
        </div>
      </footer>
    </div>
  );
}

// Main App Component with Router Setup
function App() {
  return (
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
  );
}

export default App;
