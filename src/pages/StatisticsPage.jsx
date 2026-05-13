import Statistics from "../components/Statistics.jsx";

function StatisticsPage() {
  return (
    <div className="container-xxl px-4 py-5">

      {/* ── Page header ── */}
      <div className="d-flex justify-content-between align-items-start mb-5">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="stats-page-icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <h1 className="page-title mb-0">Statistiques</h1>
          </div>
          <p className="body-sm mb-0">Vue globale de l'activité commerciale et de l'assiduité.</p>
        </div>
      </div>

      <Statistics />

    </div>
  );
}

export default StatisticsPage;
