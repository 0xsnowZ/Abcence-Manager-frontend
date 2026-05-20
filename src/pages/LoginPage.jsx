import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice.jsx";
import { useNavigate } from "react-router-dom";
import logo from "../assets/ofppt-logo.jpeg";
import leftBg from "../assets/left-bg.webp";

function LoginPage() {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading: isLoading } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="login-root">
      <div className="login-card">

        {/* ── Left panel ── */}
        <div className="login-left d-none d-md-flex" style={{ backgroundImage: `url(${leftBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Color overlay (like old design) */}
          <div className="login-left-overlay" />
          {/* Dot grid overlay */}
          <div className="login-left-dots" />

          <div className="login-left-content">
            <h2 className="login-hero-title">
              Bienvenue au système<br />
              de Gestion des Absences
            </h2>
            <p className="login-hero-sub">
              Plateforme de suivi et de gestion des absences des stagiaires —
              <strong style={{color:'rgba(255,255,255,0.85)'}}> ISTA Inezgane</strong>.
            </p>

            {/* Feature pills */}
            <div className="d-flex flex-column gap-2 mt-4">
              {[
                { icon: "bi-people-fill",      text: "Suivi par stagiaire" },
                { icon: "bi-calendar-check",   text: "Registre d'appel numérique" },
                { icon: "bi-graph-up-arrow",   text: "Statistiques en temps réel" },
              ].map((f) => (
                <div key={f.text} className="login-feature-pill">
                  <i className={`bi ${f.icon}`}></i>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="login-left-footer">
            © 2026 ISTA Inezgane — OFPPT
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="login-right">
          <div className="login-form-wrap">

            {/* Logo */}
            <div className="text-center mb-4">
              <img src={logo} alt="OFPPT Logo" className="login-logo" />
            </div>

            {/* Heading */}
            <div className="text-center mb-4">
              <span className="login-institute-badge">
                <i className="bi bi-building-fill me-1"></i>ISTA Inezgane
              </span>
            </div>
            <div className="text-center mb-5">
              <h3 className="login-title">Connexion</h3>
              <p className="login-subtitle">Connectez-vous pour accéder au système</p>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">
                <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-4">
                <label className="login-label">Nom d'utilisateur</label>
                <div className="login-input-wrap">
                  <i className="bi bi-person login-input-icon"></i>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="Entrez votre identifiant"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <label className="login-label">Mot de passe</label>
                <div className="login-input-wrap">
                  <i className="bi bi-lock login-input-icon"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-input login-input--padded-end"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <i className={`bi bi-eye${showPassword ? "-slash" : ""}`}></i>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <>Se connecter <i className="bi bi-arrow-right ms-1"></i></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Root ── */
        .login-root {
          min-height: 100vh;
          background: var(--color-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        /* ── Card ── */
        .login-card {
          display: flex;
          width: 100%;
          max-width: 980px;
          min-height: 620px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-lg), 0 0 0 1px var(--color-border);
        }

        /* ── Left ── */
        .login-left {
          flex: 1;
          background-color: #0A121A;
          position: relative;
          flex-direction: column;
          justify-content: center;
          padding: 3rem;
          color: #fff;
          overflow: hidden;
        }

        /* Color overlay */
        .login-left-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(10, 18, 26, 0.82);
          pointer-events: none;
        }

        /* Dot grid pattern */
        .login-left-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }

        /* Glowing circle decoration */
        .login-left::before {
          content: '';
          position: absolute;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%);
          bottom: -80px; right: -80px;
          pointer-events: none;
        }
        .login-left::after {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
          top: -40px; left: -40px;
          pointer-events: none;
        }

        .login-left-content { position: relative; z-index: 1; }

        .login-brand-mark {
          width: 52px; height: 52px;
          background: rgba(59,130,246,0.2);
          border: 1px solid rgba(59,130,246,0.4);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem;
          color: #60a5fa;
          margin-bottom: 1.5rem;
        }

        .login-hero-title {
          font-size: 1.65rem;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
          color: #fff;
        }

        .login-hero-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
          margin-bottom: 0;
        }

        .login-feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-pill);
          padding: 0.4rem 1rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.8);
        }
        .login-feature-pill i { color: #60a5fa; }

        .login-left-footer {
          position: absolute;
          bottom: 1.5rem; left: 3rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.35);
          z-index: 1;
        }

        /* ── Right ── */
        .login-right {
          flex: 1;
          background: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
          border-top: 4px solid var(--color-accent);
        }

        .login-form-wrap {
          width: 100%;
          max-width: 360px;
        }

        .login-logo {
          height: 80px;
          object-fit: contain;
        }

        .login-title {
          font-size: 1.65rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text);
          margin-bottom: 0.25rem;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin: 0;
        }

        /* Institute badge */
        .login-institute-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(30,58,138,0.12));
          border: 1.5px solid rgba(59,130,246,0.3);
          border-radius: var(--radius-pill);
          padding: 0.3rem 0.9rem;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-accent);
        }

        /* Error */
        .login-error {
          background: var(--color-danger-light);
          color: var(--color-danger);
          border: 1px solid rgba(220,38,38,0.2);
          border-radius: var(--radius-md);
          padding: 0.6rem 0.9rem;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
        }

        /* Label */
        .login-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 0.5rem;
        }

        /* Input */
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 0.875rem;
          color: var(--color-text-light);
          font-size: 0.95rem;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          height: 48px;
          padding: 0 1rem 0 2.5rem;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          color: var(--color-text);
          background: var(--color-surface);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }

        .login-input--padded-end { padding-right: 2.75rem; }

        .login-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }

        .login-input::placeholder { color: var(--color-text-light); }

        .login-eye-btn {
          position: absolute;
          right: 0.875rem;
          background: none;
          border: none;
          color: var(--color-text-light);
          cursor: pointer;
          padding: 0;
          font-size: 0.95rem;
          line-height: 1;
          transition: color 0.15s;
        }
        .login-eye-btn:hover { color: var(--color-text-muted); }

        /* Submit */
        .login-submit-btn {
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, var(--color-primary) 0%, #1e3a5f 100%);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s, box-shadow 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }

        .login-submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(10,18,26,0.3);
          transform: translateY(-1px);
          opacity: 0.95;
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Mobile ── */
        @media (max-width: 767px) {
          .login-card { flex-direction: column; min-height: auto; border-radius: var(--radius-lg); }
          .login-right { border-top: 4px solid var(--color-accent); padding: 2rem 1.5rem; }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
