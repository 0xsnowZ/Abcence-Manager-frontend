/**
 * Skeleton loading components — replace page-level spinners.
 * All variants share the same shimmer animation via .skeleton-box CSS class.
 *
 * Exports:
 *  - SkeletonTableRows   → table rows (used in StagiaireList, ProfsPage, AbsencesPage, Statistics)
 *  - SkeletonCardList    → sector / filière grid (used in StagiairesPage)
 *  - SkeletonStatCards   → KPI stat cards (used in Statistics)
 *  - SkeletonProgrammeCards → programme cards inside a secteur (used in StagiairesPage)
 */

const shimmerCSS = `
@keyframes skeleton-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
.skeleton-box {
  background: linear-gradient(
    90deg,
    #e2e8f0 25%,
    #f1f5f9 50%,
    #e2e8f0 75%
  );
  background-size: 1200px 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}
`;

function SkeletonStyle() {
  return <style>{shimmerCSS}</style>;
}

/* ── Table rows ──────────────────────────────────────────────────────────────
   Renders `rows` placeholder rows each with `cols` cells.
   Usage: <SkeletonTableRows rows={5} cols={4} />
*/
export function SkeletonTableRows({ rows = 5, cols = 4 }) {
  return (
    <>
      <SkeletonStyle />
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="py-3 px-4">
                <div
                  className="skeleton-box"
                  style={{
                    height: 16,
                    width: c === 0 ? "60%" : c === cols - 1 ? "40%" : "80%",
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  );
}

/* ── Sector / filière grid ───────────────────────────────────────────────────
   Renders `count` placeholder cards in a responsive grid.
   Usage: <SkeletonCardList count={6} />
*/
export function SkeletonCardList({ count = 6 }) {
  return (
    <>
      <SkeletonStyle />
      <div className="row g-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="col-md-4 col-lg-3">
            <div
              className="card-premium text-center p-4"
              style={{ minHeight: 140 }}
            >
              {/* Icon placeholder */}
              <div
                className="skeleton-box mx-auto mb-3"
                style={{ width: 56, height: 56, borderRadius: 14 }}
              />
              {/* Title */}
              <div
                className="skeleton-box mx-auto mb-2"
                style={{ height: 14, width: "50%" }}
              />
              {/* Subtitle */}
              <div
                className="skeleton-box mx-auto"
                style={{ height: 12, width: "35%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── KPI stat cards ──────────────────────────────────────────────────────────
   3-column stat card skeletons used in Statistics page.
   Usage: <SkeletonStatCards count={3} />
*/
export function SkeletonStatCards({ count = 3 }) {
  return (
    <>
      <SkeletonStyle />
      <div className="row g-4 mb-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-4">
            <div
              className="p-4"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div
                  className="skeleton-box"
                  style={{ width: 44, height: 44, borderRadius: 10 }}
                />
                <div
                  className="skeleton-box"
                  style={{ width: 36, height: 22, borderRadius: 99 }}
                />
              </div>
              <div
                className="skeleton-box mb-2"
                style={{ height: 32, width: "45%" }}
              />
              <div
                className="skeleton-box"
                style={{ height: 13, width: "65%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Programme cards (inside a secteur) ─────────────────────────────────────
   Usage: <SkeletonProgrammeCards count={4} />
*/
export function SkeletonProgrammeCards({ count = 4 }) {
  return (
    <>
      <SkeletonStyle />
      <div className="row g-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="col-md-4 col-lg-3">
            <div className="card-premium text-center p-4" style={{ minHeight: 120 }}>
              <div
                className="skeleton-box mx-auto mb-3"
                style={{ width: 48, height: 48, borderRadius: 12 }}
              />
              <div
                className="skeleton-box mx-auto mb-2"
                style={{ height: 13, width: "55%" }}
              />
              <div
                className="skeleton-box mx-auto"
                style={{ height: 11, width: "40%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
