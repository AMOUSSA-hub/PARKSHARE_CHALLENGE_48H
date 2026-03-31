import React from 'react';

function Sidebar({ filters, departements, onSelectZone, onSearch, isSearching }) {
  const [localFilters, setLocalFilters] = React.useState(filters);

  // Sync potential outside filter resets (like App's initial load)
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    const defaultFilters = { departement: '', scoreMin: 0, categorie: '', search: '' };
    setLocalFilters(defaultFilters);
    onSearch(defaultFilters);
  };

  const handleSearchClick = () => {
    onSearch(localFilters);
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
            value={localFilters.search}
            onChange={handleFilterChange}
            autoComplete="off" 
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="departement">Département</label>
          <select id="departement" name="departement" value={localFilters.departement} onChange={handleFilterChange}>
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
          <select id="categorie" name="categorie" value={localFilters.categorie} onChange={handleFilterChange}>
            <option value="">Toutes</option>
            <option value="Excellent">🟢 Excellent (≥ 11.5)</option>
            <option value="Bon">🔵 Bon (8.5 - 11.5)</option>
            <option value="Moyen">🟡 Moyen (6.0 - 8.5)</option>
            <option value="Faible">🔴 Faible (&lt; 6.0)</option>
          </select>
        </div>
        
        <button 
          onClick={handleSearchClick} 
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
    </aside>
  );
}

export default Sidebar;
