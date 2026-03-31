import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { family: 'Inter' } }
    },
    tooltip: {
      backgroundColor: 'rgba(26, 34, 51, 0.9)',
      titleColor: '#f1f5f9',
      bodyColor: '#e2e8f0',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
      ticks: { color: '#94a3b8', font: { family: 'Inter' } }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
      ticks: { color: '#94a3b8', font: { family: 'Inter' } }
    }
  }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } },
    tooltip: chartOptions.plugins.tooltip
  }
};

function ChartsView({ distribution, departements, zones }) {
  // Chart 1: Distribution (recalculated from current zones)
  const calculateDistribution = () => {
    const bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const labels = ["0-10", "10-20", "20-30", "30-40", "40-50", "50-60", "60-70", "70-80", "80-90", "90-100"];
    const values = new Array(labels.length).fill(0);

    zones.forEach(z => {
      const score = z.score_total;
      for (let i = 0; i < bins.length - 1; i++) {
        if (score >= bins[i] && (i === bins.length - 2 ? score <= bins[i+1] : score < bins[i+1])) {
          values[i]++;
          break;
        }
      }
    });

    return { labels, values };
  };

  const currentDist = calculateDistribution();

  const distData = {
    labels: currentDist.labels,
    datasets: [{
      label: 'Nombre de communes',
      data: currentDist.values,
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 4,
    }]
  };

  // Chart 2: Top 10 Communes
  const topZones = [...zones].sort((a,b) => b.score_total - a.score_total).slice(0, 10);
  const topCommunesData = {
    labels: topZones.map(z => z.nom_commune),
    datasets: [{
      label: 'Score potentiel',
      data: topZones.map(z => z.score_total),
      backgroundColor: topZones.map(z => 
        z.categorie === 'Excellent' ? 'rgba(16, 185, 129, 0.8)' : 
        z.categorie === 'Bon' ? 'rgba(59, 130, 246, 0.8)' : 
        z.categorie === 'Moyen' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(239, 68, 68, 0.8)'
      ),
      borderRadius: 4,
    }]
  };

  // Chart 3: Depts (recalculated from current zones)
  const calculateDeptStats = () => {
    const stats = {};
    zones.forEach(z => {
      if (!stats[z.nom_departement]) {
        stats[z.nom_departement] = { sum: 0, count: 0 };
      }
      stats[z.nom_departement].sum += z.score_total;
      stats[z.nom_departement].count++;
    });

    return Object.entries(stats)
      .map(([name, s]) => ({
        nom_departement: name,
        score_moyen: (s.sum / s.count).toFixed(1)
      }))
      .sort((a, b) => b.score_moyen - a.score_moyen)
      .slice(0, 10);
  };

  const currentDepts = calculateDeptStats();

  const departementsData = {
    labels: currentDepts.map(d => d.nom_departement),
    datasets: [{
      label: 'Score moyen',
      data: currentDepts.map(d => d.score_moyen),
      backgroundColor: 'rgba(139, 92, 246, 0.6)',
      borderColor: '#8b5cf6',
      borderWidth: 1,
      tension: 0.3,
      fill: true,
    }]
  };

  // Chart 4: Categories
  const excellent = zones.filter(z => z.categorie === 'Excellent').length;
  const bon = zones.filter(z => z.categorie === 'Bon').length;
  const moyen = zones.filter(z => z.categorie === 'Moyen').length;
  const faible = zones.filter(z => z.categorie === 'Faible').length;

  const categoriesData = {
    labels: ['Excellent', 'Bon', 'Moyen', 'Faible'],
    datasets: [{
      data: [excellent, bon, moyen, faible],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <section className="charts-section">
      <div className="chart-card">
        <h3>Distribution des Scores</h3>
        <div style={{ height: '250px' }}>
          <Bar data={distData} options={chartOptions} />
        </div>
      </div>
      
      <div className="chart-card">
        <h3>Top 10 Communes</h3>
        <div style={{ height: '250px' }}>
          <Bar data={topCommunesData} options={{...chartOptions, indexAxis: 'y'}} />
        </div>
      </div>
      
      <div className="chart-card">
        <h3>Score Moyen par Département (Top 10)</h3>
        <div style={{ height: '250px' }}>
          <Line data={departementsData} options={chartOptions} />
        </div>
      </div>
      
      <div className="chart-card">
        <h3>Répartition par Catégorie</h3>
        <div style={{ height: '250px' }}>
          <Pie data={categoriesData} options={pieOptions} />
        </div>
      </div>
    </section>
  );
}

export default ChartsView;
