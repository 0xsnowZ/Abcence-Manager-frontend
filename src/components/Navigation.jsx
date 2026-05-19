import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/authSlice.jsx";
import ofpptLogo from "../assets/ofppt-logo.png";

function Navigation({ onCollapse }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  const tabs = [
    { id: "stagiaires", label: "Stagiaires", icon: "bi-people-fill", path: "/" },
    { id: "absences", label: "Absences", icon: "bi-calendar-x-fill", path: "/absences" },
    { id: "saisie", label: "Registre", icon: "bi-pencil-square", path: "/saisie" },
    ...(user?.role === "admin" ? [
      { id: "profs", label: "Professeurs", icon: "bi-person-gear", path: "/profs" },
      { id: "statistics", label: "Statistiques", icon: "bi-graph-up-arrow", path: "/statistiques" },
    ] : []),
  ];

  const profFilieres = user?.role === "prof"
    ? (user?.programmes || []).map((p) => p.code_diplome || p.code || p)
    : [];

  const initials = (user?.name || user?.nom || "U").charAt(0).toUpperCase();
  const displayName = user?.name || user?.nom || "";

  return (
    <>
      {/* ── Sidebar ── */}
      <aside className={`app-sidebar${collapsed ? " app-sidebar--collapsed" : ""}${mobileOpen ? " app-sidebar--open" : ""}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <img src={ofpptLogo} alt="OFPPT" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
          {!collapsed && (
            <div className="sidebar-logo-text">
              <div className="sidebar-brand-name">AbsenceApp</div>
              <div className="sidebar-brand-sub">Tableau de bord</div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {!collapsed && (
            <p className="sidebar-section-label">MENU PRINCIPAL</p>
          )}
          {tabs.map((tab) => {
            const isActive = tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                end={tab.path === "/"}
                title={collapsed ? tab.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link${isActive ? " sidebar-link--active" : ""}`}
              >
                <i className={`bi ${tab.icon} sidebar-link-icon`}></i>
                {!collapsed && <span className="sidebar-link-label">{tab.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer – user info + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{displayName}</div>
                <div className="d-flex align-items-center gap-1 flex-wrap">
                  <span className="sidebar-user-role">{user?.role}</span>
                  {profFilieres.map((f) => (
                    <span key={f} className="sidebar-badge">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="sidebar-logout" onClick={handleLogout} title="Déconnexion">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          className="sidebar-collapse-btn d-none d-md-flex"
          onClick={toggleCollapse}
          title={collapsed ? "Développer" : "Réduire"}
        >
          <i className={`bi bi-chevron-${collapsed ? "right" : "left"}`}></i>
        </button>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="sidebar-overlay d-md-none" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Top header bar ── */}
      <header className={`app-topbar${collapsed ? " app-topbar--collapsed" : ""}`}>
        {/* Hamburger (mobile only) */}
        <button
          className="topbar-hamburger d-flex d-md-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <i className={`bi bi-${mobileOpen ? "x-lg" : "list"}`}></i>
        </button>


        {/* Logout */}
        <div className="topbar-actions">
          <button className="topbar-logout-btn" onClick={handleLogout} title="Déconnexion">
            <i className="bi bi-box-arrow-right"></i>
            <span className="d-none d-sm-inline ms-1">Déconnexion</span>
          </button>
        </div>
      </header>

      <style>{`
        /* ── Sidebar ── */
        .app-sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          width: 260px;
          background: #0A121A;
          display: flex;
          flex-direction: column;
          z-index: 1040;
          transition: width 0.3s ease, transform 0.3s ease;
        }
        .app-sidebar--collapsed { width: 72px; }

        /* Mobile: hidden off-screen by default */
        @media (max-width: 767px) {
          .app-sidebar {
            transform: translateX(-100%);
            width: 260px !important;
          }
          .app-sidebar--open { transform: translateX(0); }
        }

        /* Logo */
        .sidebar-logo {
          display: flex;
          align-items: center;
          height: 64px;
          padding: 0 18px;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
          overflow: hidden;
        }
        .app-sidebar--collapsed .sidebar-logo { justify-content: center; padding: 0; }
        .sidebar-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sidebar-brand-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          line-height: 1.2;
          white-space: nowrap;
        }
        .sidebar-brand-sub {
          font-size: 0.62rem;
          color: rgba(255,255,255,0.38);
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          scrollbar-width: none;
        }
        .sidebar-nav::-webkit-scrollbar { display: none; }
        .sidebar-section-label {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.3);
          padding: 0 8px;
          margin: 0 0 8px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          text-decoration: none;
          color: rgba(255,255,255,0.55);
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          border-left: 3px solid transparent;
          white-space: nowrap;
          position: relative;
        }
        .sidebar-link:hover {
          background: rgba(255,255,255,0.07);
          color: #fff;
        }
        .sidebar-link--active {
          background: rgba(99,102,241,0.18) !important;
          color: #a5b4fc !important;
          border-left-color: #6366f1 !important;
          font-weight: 600;
        }
        .app-sidebar--collapsed .sidebar-link {
          justify-content: center;
          padding: 10px 0;
          border-left-color: transparent;
        }
        .app-sidebar--collapsed .sidebar-link--active {
          border-left-color: transparent !important;
          border-radius: 10px;
        }
        .sidebar-link-icon { font-size: 1rem; flex-shrink: 0; }

        /* Footer */
        .sidebar-footer {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .app-sidebar--collapsed .sidebar-footer { justify-content: center; }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .sidebar-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.35);
        }
        .sidebar-user-info { min-width: 0; }
        .sidebar-user-name {
          font-size: 0.84rem;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-user-role {
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .sidebar-badge {
          font-size: 0.6rem;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 99px;
          background: rgba(245,158,11,0.2);
          color: #fbbf24;
          border: 1px solid rgba(245,158,11,0.3);
        }
        .sidebar-logout {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          border-radius: 8px;
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .sidebar-logout:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
          color: #fca5a5;
        }

        /* Collapse button */
        .sidebar-collapse-btn {
          position: absolute;
          top: 80px;
          right: -16px;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #1e293b;
          border: 2px solid var(--color-bg, #f1f5f9);
          color: rgba(255,255,255,0.6);
          font-size: 0.75rem;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
          z-index: 10;
        }
        .sidebar-collapse-btn:hover { color: #fff; background: #334155; }

        /* Overlay */
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1035;
        }

        /* ── Top header ── */
        .app-topbar {
          position: fixed;
          top: 0;
          left: 260px;
          right: 0;
          height: 60px;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
          z-index: 1030;
          transition: left 0.3s ease;
        }
        .app-topbar--collapsed { left: 72px; }
        @media (max-width: 767px) {
          .app-topbar { left: 0 !important; }
        }

        .topbar-hamburger {
          background: none;
          border: none;
          color: var(--color-text-muted, #64748b);
          font-size: 1.25rem;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .topbar-hamburger:hover { background: var(--color-bg, #f1f5f9); }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
        }
        .topbar-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          font-size: 0.78rem;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .topbar-user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text, #0f172a);
        }
        .topbar-logout-btn {
          display: flex;
          align-items: center;
          background: none;
          border: 1px solid transparent;
          color: #ef4444;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .topbar-logout-btn:hover {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
        }
      `}</style>
    </>
  );
}

export default Navigation;
