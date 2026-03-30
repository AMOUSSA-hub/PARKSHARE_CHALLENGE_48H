import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons in React
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;

const DEFAULT_CENTER = [46.603354, 1.888334]; // Centre de la France
const DEFAULT_ZOOM = 6;

// Composant pour recentrer la carte quand les zones changent
function MapUpdater({ zones }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (zones.length > 0) {
      if (zones.length === 1) {
        // Si une seule zone, on centre dessus
        map.setView([zones[0].latitude, zones[0].longitude], 12);
      } else {
        // Si plusieurs, on calcule les bounds
        const bounds = L.latLngBounds(zones.map(z => [z.latitude, z.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [zones, map]);
  
  return null;
}

function MapView({ zones, onSelectZone }) {
  const getColor = (categorie) => {
    switch(categorie) {
      case 'Excellent': return '#10b981';
      case 'Bon': return '#3b82f6';
      case 'Moyen': return '#f59e0b';
      case 'Faible': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <section className="map-section">
      <div className="section-header">
        <h2>Carte Interactive — Scoring par Zone</h2>
        <div className="map-legend">
          <span className="legend-item"><span className="legend-dot" style={{background:'#ef4444'}}></span>Faible</span>
          <span className="legend-item"><span className="legend-dot" style={{background:'#f59e0b'}}></span>Moyen</span>
          <span className="legend-item"><span className="legend-dot" style={{background:'#3b82f6'}}></span>Bon</span>
          <span className="legend-item"><span className="legend-dot" style={{background:'#10b981'}}></span>Excellent</span>
        </div>
      </div>
      
      <div className="map-container">
        <MapContainer 
          center={DEFAULT_CENTER} 
          zoom={DEFAULT_ZOOM} 
          style={{ height: '100%', width: '100%' }}
        >
          {/* Dark map variant from CartoDB */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapUpdater zones={zones} />

          {zones.map((zone) => (
            <CircleMarker
              key={zone.code_commune}
              center={[zone.latitude, zone.longitude]}
              pathOptions={{
                color: getColor(zone.categorie),
                fillColor: getColor(zone.categorie),
                fillOpacity: 0.7,
                weight: 2
              }}
              radius={Math.max(5, Math.min(20, zone.score_total / 5))}
            >
              <Popup className="premium-popup">
                <div className="popup-content">
                  <h3>{zone.nom_commune} ({zone.code_departement})</h3>
                  <div className="popup-score" style={{color: getColor(zone.categorie)}}>
                    {zone.score_total} <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>/ 100</span>
                  </div>
                  <div className="popup-row">
                    <span>Population:</span>
                    <span>{zone.population.toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="popup-row">
                    <span>Copropriétés:</span>
                    <span>{zone.nb_coproprietes}</span>
                  </div>
                  <button className="popup-btn" onClick={() => onSelectZone(zone)}>
                    Voir les détails
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

export default MapView;
