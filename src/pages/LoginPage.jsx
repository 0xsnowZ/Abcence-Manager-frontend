import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice.jsx";
import { useNavigate } from "react-router-dom";
import logo from "../assets/ofppt-logo.jpeg";
import leftBg from "../assets/left-bg.webp";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error } = useSelector((state) => state.auth);

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Dispatch thunk -> waits for mock API -> updates state
    await dispatch(loginUser({ email, password }));

    setIsLoading(false);
  };

  return (
    <div
      style={{
        backgroundColor: "#eef2f5",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          width: "100%",
          maxWidth: "1000px",
          borderRadius: "1rem",
          overflow: "hidden",
          minHeight: "600px",
        }}
      >
        <div className="row g-0 h-100" style={{ minHeight: "600px" }}>
          {/* Left Side */}
          <div
            className="col-md-6 d-none d-md-flex flex-column justify-content-center p-5 position-relative"
            style={{
              backgroundColor: "#0f7162",
              backgroundImage: `url(${leftBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              color: "white",
            }}
          >
            {/* Adding a subtle overlay so the text remains readable over the image */}
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ backgroundColor: "rgba(15, 113, 98, 0.85)" }}
            ></div>
            <div
              className="position-relative z-1"
              style={{ maxWidth: "400px", margin: "0 auto" }}
            >
              <h2
                className="fw-bold mb-3"
                style={{ fontSize: "2rem", lineHeight: "1.2" }}
              >
                Bienvenue au système
                <br />
                de Gestion des Absences
              </h2>
              <p className="mb-0" style={{ fontSize: "1rem", opacity: "0.9" }}>
                Plateforme de suivi et de gestion des absences des stagiaires de
                l'OFPPT.
              </p>

              <div className="mt-4 d-flex gap-2">
                <span
                  style={{
                    width: "40px",
                    height: "4px",
                    backgroundColor: "#fff",
                    display: "block",
                    borderRadius: "2px",
                  }}
                ></span>
                <span
                  style={{
                    width: "40px",
                    height: "4px",
                    backgroundColor: "rgba(255,255,255,0.4)",
                    display: "block",
                    borderRadius: "2px",
                  }}
                ></span>
                <span
                  style={{
                    width: "40px",
                    height: "4px",
                    backgroundColor: "rgba(255,255,255,0.4)",
                    display: "block",
                    borderRadius: "2px",
                  }}
                ></span>
              </div>
            </div>

            <div
              className="position-absolute"
              style={{
                bottom: "2rem",
                left: "3rem",
                fontSize: "0.85rem",
                opacity: "0.8",
              }}
            >
              © 2026 OFPPT — La voie de l'avenir
            </div>
          </div>

          {/* Right Side */}
          <div className="col-md-6 d-flex flex-column justify-content-center p-5 bg-white">
            <div
              className="w-100"
              style={{ maxWidth: "380px", margin: "0 auto" }}
            >
              <div className="text-center mb-4">
                <img
                  src={logo}
                  alt="OFPPT Logo"
                  style={{ height: "90px", objectFit: "contain" }}
                />
              </div>

              <div className="text-center mb-5">
                <h3
                  className="fw-bold mb-1"
                  style={{ color: "#111827", fontSize: "1.75rem" }}
                >
                  Connexion
                </h3>
                <p className="text-muted" style={{ fontSize: "0.95rem" }}>
                  Connectez-vous pour accéder au système
                </p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small rounded mb-4 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label
                    className="form-label fw-bold text-secondary text-uppercase mb-2"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}
                  >
                    Nom d'utilisateur
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text bg-transparent text-muted px-3"
                      style={{
                        borderRight: "none",
                        borderRadius: "0.5rem 0 0 0.5rem",
                      }}
                    >
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control text-muted"
                      style={{
                        borderLeft: "none",
                        borderRadius: "0 0.5rem 0.5rem 0",
                        padding: "0.7rem 0.7rem 0.7rem 0",
                        boxShadow: "none",
                      }}
                      placeholder="Entrez votre identifiant"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    className="form-label fw-bold text-secondary text-uppercase mb-2"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}
                  >
                    Mot de passe
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text bg-transparent text-muted px-3"
                      style={{
                        borderRight: "none",
                        borderRadius: "0.5rem 0 0 0.5rem",
                      }}
                    >
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control text-muted"
                      style={{
                        borderLeft: "none",
                        borderRight: "none",
                        padding: "0.7rem 0",
                        boxShadow: "none",
                      }}
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      className="input-group-text bg-transparent text-muted px-3 cursor-pointer"
                      style={{
                        borderLeft: "none",
                        borderRadius: "0 0.5rem 0.5rem 0",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`bi bi-eye${showPassword ? "-slash" : ""}`}
                      ></i>
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 fw-bold d-flex align-items-center justify-content-center gap-2 mb-4"
                  style={{
                    backgroundColor: "#009665",
                    color: "#fff",
                    padding: "0.8rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px rgba(0, 150, 101, 0.2)",
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    <>
                      Se connecter <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
