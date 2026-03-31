import React from 'react';

function KpiCards({ kpis }) {
  if (!kpis) return null;
  
  return (
    <section className="kpi-section">
      <div className="kpi-card" id="kpi-best-zone">
        <div className="kpi-icon">🏆</div>
        <div className="kpi-info">
          <span className="kpi-value">{kpis.meilleure_zone || '—'}</span>
          <span className="kpi-label">Meilleure zone</span>
        </div>
      </div>
      
      <div className="kpi-card" id="kpi-score-max">
        <div className="kpi-icon">📈</div>
        <div className="kpi-info">
          <span className="kpi-value">{Number(kpis.score_max).toLocaleString()}</span>
          <span className="kpi-label">Score maximum</span>
        </div>
      </div>
      
      <div className="kpi-card" id="kpi-score-moyen">
        <div className="kpi-icon">📊</div>
        <div className="kpi-info">
          <span className="kpi-value">{kpis.score_moyen}</span>
          <span className="kpi-label">Score moyen</span>
        </div>
      </div>
      
      <div className="kpi-card" id="kpi-excellent">
        <div className="kpi-icon">🟢</div>
        <div className="kpi-info">
          <span className="kpi-value">{Number(kpis.nb_zones_excellent).toLocaleString()}</span>
          <span className="kpi-label">Zones « Excellent »</span>
        </div>
      </div>
    </section>
  );
}

export default KpiCards;
