import React, { useEffect, useState } from 'react';

function ZoneModal({ zone, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (!zone) return null;

  const s = (v, d = 0) => (v != null ? Number(v).toFixed(d) : '—');
  const n = (v) => (v != null ? Number(v).toLocaleString('fr-FR') : '—');

  let catColor = '#94a3b8';
  if (zone.categorie === 'Excellent') catColor = '#10b981';
  else if (zone.categorie === 'Bon') catColor = '#3b82f6';
  else if (zone.categorie === 'Moyen') catColor = '#f59e0b';
  else if (zone.categorie === 'Faible') catColor = '#ef4444';

  const circumference = 2 * Math.PI * 54;
  const score = zone.score_total || 0;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`modal-overlay ${show ? 'visible' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2>{zone.nom_commune}</h2>
        <div className="modal-subtitle">
          {zone.nom_departement} ({zone.code_departement}) — Rang national: #{zone.rang_national || '—'}
        </div>

        <div className="modal-score-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none"/>
            <circle 
              cx="60" cy="60" r="54" 
              stroke={catColor} strokeWidth="8" fill="none"
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <span className="modal-score-value" style={{color: catColor}}>{s(score, 0)}</span>
        </div>

        <div className="modal-details">
          <div className="modal-detail-item">
            <span className="detail-label">Population</span>
            <span className="detail-value">{n(zone.population)} hab.</span>
          </div>
          <div className="modal-detail-item">
            <span className="detail-label">Copropriétés</span>
            <span className="detail-value">{n(zone.nb_coproprietes)}</span>
          </div>
          <div className="modal-detail-item">
            <span className="detail-label">Taille moy. copro</span>
            <span className="detail-value">{s(zone.taille_moyenne_copro, 1)} lots</span>
          </div>
          <div className="modal-detail-item">
            <span className="detail-label">Taux motorisation</span>
            <span className="detail-value">{s(zone.taux_motorisation ? zone.taux_motorisation * 100 : null, 1)} %</span>
          </div>
        </div>

        <div className="modal-scores-breakdown">
          <h3>Détail du Scoring</h3>
          <ScoreBar label="Nb Copropriétés" score={zone.score_coproprietes} />
          <ScoreBar label="Densité/Tension" score={zone.score_densite} />
          <ScoreBar label="Taille Moyenne" score={zone.score_taille_copro} />
          <ScoreBar label="Motorisation" score={zone.score_motorisation} />
          <ScoreBar label="Opportunité Marché" score={zone.score_marche} />
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }) {
  const val = score != null ? Number(score) : 0;
  return (
    <div className="score-bar-item">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div 
          className="score-bar-fill" 
          style={{ width: `${val}%`, backgroundColor: 'var(--accent)' }}
        />
      </div>
      <span className="score-bar-value">{val.toFixed(1)}</span>
    </div>
  );
}

export default ZoneModal;
