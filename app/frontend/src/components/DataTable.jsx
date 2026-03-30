import React, { useState } from 'react';

function DataTable({ zones, onSelectZone }) {
  const [sortField, setSortField] = useState('rang_national');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortClass = (field) => {
    if (sortField === field) {
      return `sorted-${sortDirection}`;
    }
    return '';
  };

  const sortedZones = [...zones].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // Sort strings
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    // Sort numbers
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <section className="table-section">
      <div className="section-header">
        <h2>Détail des Zones</h2>
        <span className="table-count">{zones.length} résultats</span>
      </div>
      
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className={getSortClass('rang_national')} onClick={() => handleSort('rang_national')}># Rang</th>
              <th className={getSortClass('nom_commune')} onClick={() => handleSort('nom_commune')}>Commune</th>
              <th className={getSortClass('nom_departement')} onClick={() => handleSort('nom_departement')}>Département</th>
              <th className={getSortClass('population')} onClick={() => handleSort('population')}>Population</th>
              <th className={getSortClass('nb_coproprietes')} onClick={() => handleSort('nb_coproprietes')}>Copros.</th>
              <th className={getSortClass('densite_population')} onClick={() => handleSort('densite_population')}>Densité</th>
              <th className={getSortClass('score_total')} onClick={() => handleSort('score_total')}>Score</th>
              <th className={getSortClass('categorie')} onClick={() => handleSort('categorie')}>Catégorie</th>
            </tr>
          </thead>
          <tbody>
            {sortedZones.map((zone) => (
              <tr key={zone.code_commune} onClick={() => onSelectZone(zone)}>
                <td>{zone.rang_national || '-'}</td>
                <td style={{fontWeight: 600}}>{zone.nom_commune} <span style={{color:'var(--text-muted)', fontSize:'11px'}}>({zone.code_commune})</span></td>
                <td>{zone.nom_departement}</td>
                <td>{zone.population.toLocaleString('fr-FR')}</td>
                <td>{zone.nb_coproprietes.toLocaleString('fr-FR')}</td>
                <td>{Math.round(zone.densite_population).toLocaleString('fr-FR')} / km²</td>
                <td>
                  <span className={`score-badge ${zone.categorie?.toLowerCase()}`}>
                    {zone.score_total.toFixed(1)}
                  </span>
                </td>
                <td>
                  <span className={`categorie-badge ${zone.categorie?.toLowerCase()}`}>
                    {zone.categorie === 'Excellent' && '🟢'}
                    {zone.categorie === 'Bon' && '🔵'}
                    {zone.categorie === 'Moyen' && '🟡'}
                    {zone.categorie === 'Faible' && '🔴'}
                    {zone.categorie}
                  </span>
                </td>
              </tr>
            ))}
            {sortedZones.length === 0 && (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '30px', color: 'var(--text-muted)'}}>
                  Aucune zone ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default DataTable;
