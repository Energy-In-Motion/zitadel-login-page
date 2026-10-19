"use client";

import { useState } from "react";

type Dashboard = { name: string; url: string };

const PREVIEW_COUNT = 4;

function DashboardCard({ dash }: { dash: Dashboard }) {
  return (
    <a
      href={dash.url}
      target="_blank"
      rel="noopener noreferrer"
      className="dashboard-card"
    >
      <span className="font-medium">{dash.name}</span>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}

export function DashboardSection({ dashboards }: { dashboards: Dashboard[] }) {
  const [showAll, setShowAll] = useState(false);
  const preview = dashboards.slice(0, PREVIEW_COUNT);
  const hasMore = dashboards.length > PREVIEW_COUNT;

  return (
    <div className="mt-6 w-full">
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width: 3, height: 18, borderRadius: 2, background: "#38e0cf" }} />
        <h2
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: "#01363F", letterSpacing: "0.05em" }}
        >
          Your Dashboards
        </h2>
      </div>

      {/* Preview grid — first 4 */}
      <div className="dashboard-grid">
        {preview.map((dash) => (
          <DashboardCard key={dash.url} dash={dash} />
        ))}
      </div>

      {/* View all link */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="dashboard-view-all"
        >
          View all dashboards ({dashboards.length})
        </button>
      )}

      {/* Modal */}
      {showAll && (
        <div className="dashboard-modal-overlay" onClick={() => setShowAll(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h3>All Dashboards</h3>
              <button type="button" onClick={() => setShowAll(false)} className="dashboard-modal-close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-grid">
                {dashboards.map((dash) => (
                  <DashboardCard key={dash.url} dash={dash} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
