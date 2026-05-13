import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/authSlice.jsx";

function Navigation() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const tabs = [
    { id: "stagiaires", label: "Stagiaires",   icon: "bi-people-fill",      path: "/" },
    { id: "absences",   label: "Absences",     icon: "bi-calendar-x-fill",  path: "/absences" },
    { id: "saisie",     label: "Registre",     icon: "bi-pencil-square",    path: "/saisie" },
    ...(user?.role === "admin" ? [
      { id: "profs",      label: "Professeurs",  icon: "bi-person-gear",      path: "/profs" },
      { id: "statistics", label: "Statistiques", icon: "bi-graph-up-arrow",   path: "/statistiques" },
    ] : []),
  ];

  const profFilieres = user?.role === "prof"
    ? (user?.programmes || []).map((p) => p.code_diplome || p.code || p)
    : [];

  const initials = (user?.name || user?.nom || "U").charAt(0).toUpperCase();
  const displayName = user?.name || user?.nom || "";

  return (
    <nav className="app-nav navbar navbar-expand-lg navbar-dark mb-0 py-0">
      <div className="container-xxl px-4">

        {/* Brand */}
        <NavLink className="navbar-brand d-flex align-items-center gap-3 py-3" to="/">
          <div className="nav-brand-icon">
            <i className="bi bi-calendar-check-fill"></i>
          </div>
          <div className="nav-brand-text">
            <div className="nav-brand-name">Gestion des Absences</div>
            <div className="nav-brand-sub">Tableau de bord</div>
          </div>
        </NavLink>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Nav links */}
          <ul className="navbar-nav mx-auto gap-1 mt-3 mt-lg-0 align-items-lg-center">
            {tabs.map((tab) => (
              <li className="nav-item" key={tab.id}>
                <NavLink
                  to={tab.path}
                  end={tab.path === "/"}
                  className={({ isActive }) =>
                    `nav-tab d-flex align-items-center gap-2 px-3 py-2 rounded${isActive ? " nav-tab--active" : ""}`
                  }
                >
                  <i className={`bi ${tab.icon}`}></i>
                  <span>{tab.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* User section */}
          {user && (
            <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0 ps-lg-4 nav-user-section">
              <div className="d-flex align-items-center gap-2">
                <div className="nav-avatar">
                  {initials}
                </div>
                <div className="d-none d-xl-block lh-sm">
                  <div className="nav-user-name">{displayName}</div>
                  <div className="d-flex align-items-center gap-1 flex-wrap">
                    <span className="nav-user-role">{user.role}</span>
                    {profFilieres.map((f) => (
                      <span key={f} className="nav-prof-badge">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="nav-logout-btn"
                title="Déconnexion"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span className="d-lg-none d-xl-inline ms-1">Quitter</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Bar */
        .app-nav {
          background: rgba(10, 18, 26, 0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          position: sticky;
          top: 0;
          z-index: 1030;
        }

        /* Brand */
        .nav-brand-icon {
          width: 38px; height: 38px;
          background: rgba(59,130,246,0.18);
          border: 1px solid rgba(59,130,246,0.35);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #60a5fa;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .nav-brand-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .nav-brand-sub {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.45);
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Tabs */
        .nav-tab {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
          position: relative;
        }
        .nav-tab:hover {
          color: #fff;
          background: rgba(255,255,255,0.08);
        }
        .nav-tab--active {
          color: #fff !important;
          background: rgba(59,130,246,0.15) !important;
          font-weight: 600;
        }
        .nav-tab--active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 2px;
          background: #3b82f6;
          border-radius: 2px;
        }

        /* User section divider */
        .nav-user-section {
          border-left: 1px solid rgba(255,255,255,0.1);
        }

        /* Avatar */
        .nav-avatar {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.3);
        }

        .nav-user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
        }
        .nav-user-role {
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .nav-prof-badge {
          font-size: 0.6rem;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 99px;
          background: rgba(245,158,11,0.2);
          color: #fbbf24;
          border: 1px solid rgba(245,158,11,0.3);
        }

        /* Logout */
        .nav-logout-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7);
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          display: flex; align-items: center;
          white-space: nowrap;
        }
        .nav-logout-btn:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
          color: #fca5a5;
        }

        @media (max-width: 991px) {
          .nav-user-section { border-left: none; padding-left: 0; }
          .nav-tab--active::after { display: none; }
        }
      `}</style>
    </nav>
  );
}

export default Navigation;
