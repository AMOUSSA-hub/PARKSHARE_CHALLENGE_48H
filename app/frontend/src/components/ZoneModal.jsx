import React, { useEffect, useState } from 'react';

function ZoneModal({ zone, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay for entrance animation
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (!zone) return null;

  // Categorie Color
  let catColor = '#94a3b8';
  if (zone.categorie === 'Excellent') catColor = '#10b981';
  else if (zone.categorie === 'Bon') catColor = '#3b82f6';
  else if (zone.categorie === 'Moyen') catColor = '#f59e0b';
  else if (zone.categorie === 'Faible') catColor = '#ef4444';

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (zone.score_total / 100) * circumference;

  return (
    <div className={`modal-overlay ${show ? 'visible' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2>{zone.nom_commune}</h2>
        <div className="modal-subtitle">
          {zone.nom_departement} ({zone.code_departement}) — Rang national: #{zone.rang_national}
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
          <span className="modal-score-value" style={{color: catColor}}>{zone.score_total.toFixed(0)}</span>
        </div>

        <div className="modal-details">
          <div className="modal-detail-item">
            <span className="detail-label">Population</span>
            <span className="detail-value">{zone.population.toLocaleString('fr-FR')} hab.</span>
          </div>
          <div className="modal-detail-item">
            <span className="detail-label">Copropriétés</span>
            <span className="detail-value">{zone.nb_coproprietes}</span>
          </div>
          <div className="modal-detail-item">
            <span className="detail-label">Taille moy. copro</span>
            <span className="detail-value">{zone.taille_moyenne_copro.toFixed(1)} lots</span>
          </div>
          <div className="modal-detail-item">
            <span className="detail-label">Taux motorisation</span>
            <span className="detail-value">{(zone.taux_motorisation * 100).toFixed(1)} %</span>
          </div>
        </div>

        <div className="modal-scores-breakdown">
          <h3>Détail du Scoring</h3>
          
          <ScoreBar label="Nb Copropriétés" score={zone.score_coproprietes} />
          <ScoreBar label="Densité/Tension" score={zone.score_densite} />
          <ScoreBar label="Taille Moyenne" score={zone.score_taille_copro} />
          <ScoreBar label="Part Collectif" score={zone.score_logement_collectif} />
          <ScoreBar label="Opportunité Marché" score={zone.score_marche} />
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }) {
  // Use CSS gradient for the bar fill
  return (
    <div className="score-bar-item">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div 
          className="score-bar-fill" 
          style={{ width: `${score}%`, backgroundColor: 'var(--accent)' }}
        />
      </div>
      <span className="score-bar-value">{score.toFixed(1)}</span>
    </div>
  );
}

export default ZoneModal;
