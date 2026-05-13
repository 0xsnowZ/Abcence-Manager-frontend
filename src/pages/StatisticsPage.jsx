import Statistics from "../components/Statistics.jsx";

// Statistics Page

function StatisticsPage() {
  return (
    <div className="container py-4 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-graph-up-arrow me-3 text-dark-navy"></i>
            Statistiques
          </h2>
          <p className="text-muted mb-0">
            Vue globale de l'activité commerciale et de l'assiduité.
          </p>
        </div>
      </div>

      {/* Main Statistics Component */}
      <div className="mb-5">
        <Statistics />
      </div>

      {/* Removed Global Summary Table */}
      <style>{`
        .bg-soft-primary { background-color: #e7f1ff; }
        .bg-soft-success { background-color: #e6f9ed; }
        .bg-soft-danger { background-color: #fceaea; }
        .bg-soft-warning { background-color: #fff8e6; }
        .avatar-circle { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; }
        .custom-table tbody tr { transition: all 0.2s; border-color: #f8f9fa; }
        .custom-table tbody tr:hover { background-color: #fcfcfc; }
      `}</style>
    </div>
  );
}

export default StatisticsPage;
