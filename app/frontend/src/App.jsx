import React, { useState, useEffect } from 'react';
import { fetchZones, fetchKpis, fetchDepartements, fetchDistribution, fetchCorrelation } from './api';

// Components
import Sidebar from './components/Sidebar';
import KpiCards from './components/KpiCards';
import MapView from './components/MapView';
import ChartsView from './components/ChartsView';
import DataTable from './components/DataTable';
import ZoneModal from './components/ZoneModal';

function App() {
  const [zones, setZones] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [departements, setDepartements] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [filters, setFilters] = useState({
    departement: '',
    scoreMin: 0,
    categorie: '',
    search: '',
  });

  // State for modal
  const [selectedZone, setSelectedZone] = useState(null);
  
  // State for mobile sidebar
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // State for loading/searching
  const [isSearching, setSearching] = useState(false);

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [deptData, distData, corrData, zonesData] = await Promise.all([
        fetchDepartements(),
        fetchDistribution(),
        fetchCorrelation(),
        fetchZones(filters)
      ]);
      setDepartements(deptData.departements);
      setDistribution(distData);
      setCorrelation(corrData);
      setZones(zonesData.zones);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      setSearching(true);
      const data = await fetchZones(filters);
      setZones(data.zones);
    } catch (error) {
      console.error("Error loading zones:", error);
    } finally {
      setSearching(false);
    }
  };

  // Derived KPIs based on currently filtered zones
  const derivedKpis = React.useMemo(() => {
    if (!zones || zones.length === 0) return null;

    const totalPop = zones.reduce((sum, z) => sum + (z.population || 0), 0);
    const totalCopro = zones.reduce((sum, z) => sum + (z.nb_coproprietes || 0), 0);
    const avgScore = zones.reduce((sum, z) => sum + z.score_total, 0) / zones.length;
    const maxScoreZone = [...zones].sort((a, b) => b.score_total - a.score_total)[0];

    return {
      total_communes: zones.length,
      total_coproprietes: totalCopro,
      score_moyen: Number(avgScore).toFixed(1),
      score_max: maxScoreZone?.score_total || 0,
      meilleure_zone: maxScoreZone?.nom_commune || '—',
      nb_zones_excellent: zones.filter(z => z.categorie === 'Excellent').length,
      nb_zones_bon: zones.filter(z => z.categorie === 'Bon').length,
      nb_zones_moyen: zones.filter(z => z.categorie === 'Moyen').length,
      nb_zones_faible: zones.filter(z => z.categorie === 'Faible').length,
    };
  }, [zones]);

  if (loading && departements.length === 0) {
    return (
      <div className="loader-container full-page">
        <div className="spinner"></div>
        <p>Chargement initial de l'application...</p>
      </div>
    );
  }

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <header className="app-header">
        <div className="header-left">
          <button className="mobile-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isSidebarOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <h1>Parkshare</h1>
          </div>
          <span className="subtitle">Analyse de Potentiel Commercial</span>
        </div>
        <div className="header-right">
          <div className="header-badge">
            <span className="badge-value">{derivedKpis?.total_communes || 0}</span>
            <span className="badge-label">Communes</span>
          </div>
          <div className="header-badge">
            <span className="badge-value">{derivedKpis?.total_coproprietes.toLocaleString() || 0}</span>
            <span className="badge-label">Copropriétés</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Sidebar 
          filters={filters} 
          setFilters={setFilters} 
          departements={departements}
          topZones={zones.slice(0, 10)}
          onSelectZone={(zone) => {
            setSelectedZone(zone);
            setSidebarOpen(false); // Auto-close on selects for mobile
          }}
          onSearch={loadZones}
          isSearching={isSearching}
          isOpen={isSidebarOpen}
        />
        
        {/* Overlay for mobile sidebar */}
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>

        <div className="content">
          {isSearching && (
            <div className="searching-overlay">
              <div className="spinner"></div>
              <span>Recherche en cours...</span>
            </div>
          )}

          <KpiCards kpis={derivedKpis} />
          
          <MapView zones={zones} onSelectZone={setSelectedZone} />
          
          {distribution && correlation && departements.length > 0 && (
            <ChartsView 
              distribution={distribution} 
              departements={departements.slice(0, 10)} 
              zones={zones}
            />
          )}

          <DataTable zones={zones} onSelectZone={setSelectedZone} />
        </div>
      </main>

      {selectedZone && (
        <ZoneModal zone={selectedZone} onClose={() => setSelectedZone(null)} />
      )}
    </div>
  );
}

export default App;
