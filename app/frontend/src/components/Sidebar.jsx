import React from 'react';

function Sidebar({ filters, setFilters, departements, topZones, onSelectZone, onSearch, isSearching }) {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ departement: '', scoreMin: 0, categorie: '', search: '' });
  };

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h2 className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          Filtres
        </h2>
        
        <div className="filter-group">
          <label htmlFor="search">Rechercher</label>
          <input 
            type="text" 
            id="search" 
            name="search"
            placeholder="Nom de commune..." 
            value={filters.search}
            onChange={handleFilterChange}
            autoComplete="off" 
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="departement">Département</label>
          <select id="departement" name="departement" value={filters.departement} onChange={handleFilterChange}>
            <option value="">Tous</option>
            {departements.map(d => (
              <option key={d.code_departement} value={d.code_departement}>
                {d.code_departement} - {d.nom_departement}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="categorie">Catégorie</label>
          <select id="categorie" name="categorie" value={filters.categorie} onChange={handleFilterChange}>
            <option value="">Toutes</option>
            <option value="Excellent">🟢 Excellent</option>
            <option value="Bon">🔵 Bon</option>
            <option value="Moyen">🟡 Moyen</option>
            <option value="Faible">🔴 Faible</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="scoreMin">Score minimum : {filters.scoreMin}</label>
          <input 
            type="range" 
            id="scoreMin" 
            name="scoreMin"
            min="0" max="100" step="1" 
            value={filters.scoreMin}
            onChange={handleFilterChange}
          />
        </div>
        
        <button 
          onClick={onSearch} 
          className="btn-search" 
          disabled={isSearching}
        >
          {isSearching ? 'Recherche...' : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '16px', height: '16px', marginRight: '8px'}}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Rechercher
            </>
          )}
        </button>
        
        <button onClick={resetFilters} className="btn-reset" disabled={isSearching}>Réinitialiser</button>
      </section>

      <section className="sidebar-section">
        <h2 className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Top Zones
        </h2>
        <div className="classement-list">
          {topZones.map((zone, idx) => (
            <div key={zone.code_commune} className="classement-item" onClick={() => onSelectZone(zone)}>
              <span className={`classement-rank ${idx < 3 ? `top-${idx+1}` : ''}`}>#{idx + 1}</span>
              <span className="classement-name">{zone.nom_commune}</span>
              <span className="classement-score">{zone.score_total}</span>
            </div>
          ))}
          {topZones.length === 0 && <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Aucune zone trouvée</span>}
        </div>
      </section>
    </aside>
  );
}

export default Sidebar;
