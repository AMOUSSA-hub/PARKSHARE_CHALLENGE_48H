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

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload zones when filters change
  useEffect(() => {
    loadZones();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [kpiData, deptData, distData, corrData, zonesData] = await Promise.all([
        fetchKpis(),
        fetchDepartements(),
        fetchDistribution(),
        fetchCorrelation(),
        fetchZones()
      ]);
      setKpis(kpiData);
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
      const data = await fetchZones(filters);
      setZones(data.zones);
    } catch (error) {
      console.error("Error loading zones:", error);
    }
  };

  if (loading && !kpis) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Chargement des données...</div>;
  }

  return (
    <>
      <header className="app-header">
        <div className="header-left">
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
            <span className="badge-value">{kpis?.total_communes || 0}</span>
            <span className="badge-label">Communes</span>
          </div>
          <div className="header-badge">
            <span className="badge-value">{kpis?.total_coproprietes || 0}</span>
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
          onSelectZone={setSelectedZone}
        />
        
        <div className="content">
          <KpiCards kpis={kpis} />
          
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
    </>
  );
}

export default App;
