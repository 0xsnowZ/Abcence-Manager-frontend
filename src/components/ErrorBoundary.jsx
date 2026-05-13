import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "var(--color-bg)" }}>
        <div className="card-premium p-5 text-center" style={{ maxWidth: "480px", width: "100%" }}>
          <div className="avatar-circle avatar-xl mx-auto mb-4" style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "1.5rem" }}></i>
          </div>
          <h4 className="section-title mb-2">Une erreur inattendue s'est produite</h4>
          <p className="body-sm mb-4">
            {this.state.error?.message || "Veuillez recharger la page ou contacter l'administrateur."}
          </p>
          <button
            className="btn-navy px-5 py-2 mx-auto"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
