import React, { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice.jsx";

// Navigation Component
function Navigation() {
  const { user } = useSelector((state) => state.auth);
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const tabs = [
    { id: "stagiaires", label: "Stagiaires", icon: "bi-people", path: "/" },
    { id: "absences", label: "Absences", icon: "bi-calendar-x", path: "/absences" },
    { id: "saisie", label: "Saisie", icon: "bi-pencil-square", path: "/saisie" },
    ...(user?.role === 'admin' ? [
      { id: "profs", label: "Professeurs", icon: "bi-person-gear", path: "/profs" },
      { id: "statistics", label: "Statistiques", icon: "bi-graph-up", path: "/statistiques" },
    ] : []),
  ];

  // Show prof's assigned filières as badges in navbar
  const profFilieres = user?.role === 'prof' && user?.filieres?.length > 0 ? user.filieres : [];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-sm py-3 mb-4" style={{ backgroundColor: '#0A121A' }}>
      <div className="container">
        <NavLink className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <div className="bg-white text-dark p-2 rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <i className="bi bi-calendar-check-fill"></i>
          </div>
          <span className="tracking-tight text-white">ABSENCE MANAGER</span>
        </NavLink>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-2 mt-3 mt-lg-0 align-items-lg-center">
            {tabs.map((tab) => (
              <li className="nav-item" key={tab.id}>
                <NavLink
                  to={tab.path}
                  className={({ isActive }) =>
                    `nav-link px-3 py-2 rounded-pill d-flex align-items-center transition-all ${isActive
                      ? "active bg-white text-dark fw-bold shadow-sm"
                      : "text-white opacity-75 hover-opacity-100"
                    }`
                  }
                >
                  <i className={`bi ${tab.icon} me-2`}></i>
                  {tab.label}
                </NavLink>
              </li>
            ))}

            {/* User Profile & Logout */}
            {user && (
              <li className="nav-item ms-lg-3 mt-3 mt-lg-0 border-start-lg border-white-50 ps-lg-3 d-flex align-items-center">
                <div className="d-flex align-items-center text-white me-3">
                  <div className="bg-white text-dark rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold shadow-sm" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                    {(user.name || user.nom || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="lh-sm d-none d-xl-block">
                    <div className="fw-bold fs-6">{user.name || user.nom}</div>
                    <div className="d-flex align-items-center gap-1 flex-wrap">
                      <span className="small opacity-75 text-uppercase" style={{ fontSize: '0.7rem' }}>{user.role}</span>
                      {/* Show prof's filière badges */}
                      {profFilieres.map((f) => (
                        <span key={f} className="badge rounded-pill prof-badge" style={{ fontSize: '0.6rem' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-light text-dark fw-bold px-3 shadow-sm hover-lift"
                  title="Déconnexion"
                >
                  <i className="bi bi-box-arrow-right me-1"></i> <span className="d-lg-none d-xl-inline">Quitter</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
      <style>{`
        .navbar-brand { letter-spacing: -0.5px; }
        .nav-link { transition: all 0.3s ease; border: 1px solid transparent; }
        .nav-link:not(.active):hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); opacity: 1 !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
        .hover-opacity-100:hover { opacity: 1 !important; }
        .border-white-50 { border-color: rgba(255,255,255,0.2) !important; }
        @media (min-width: 992px) { .border-start-lg { border-left: 1px solid; } }
        .hover-lift { transition: transform 0.2s; }
        .hover-lift:hover { transform: translateY(-2px); }
        .prof-badge { background-color: #f59e0b; color: #000; }
      `}</style>
    </nav>
  );
}

export default Navigation;
