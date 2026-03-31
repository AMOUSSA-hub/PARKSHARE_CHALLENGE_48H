# App — Backend API & Frontend Dashboard

## Architecture

L'application est composée de deux services :
- **Backend** : API REST avec FastAPI (Python 3.10)
- **Frontend** : Dashboard interactif avec React 19 + Vite

## Backend (FastAPI)

### Endpoints API

| Méthode | Route                  | Description                              |
|---------|------------------------|------------------------------------------|
| GET     | `/api/zones`           | Liste des zones avec filtres et tri      |
| GET     | `/api/zone/{code}`     | Détail d'une commune par code INSEE      |
| GET     | `/api/kpis`            | KPIs globaux (totaux, moyennes, top)     |
| GET     | `/api/departements`    | Scores agrégés par département           |
| GET     | `/api/distribution`    | Distribution des scores par tranches     |
| GET     | `/api/correlation`     | Matrice de corrélation entre variables   |

### Filtres disponibles sur `/api/zones`

| Paramètre    | Type   | Description                    |
|-------------|--------|--------------------------------|
| `departement`| string | Filtrer par code département   |
| `score_min`  | float  | Score minimum                  |
| `score_max`  | float  | Score maximum                  |
| `categorie`  | string | Excellent, Bon, Moyen, Faible  |
| `search`     | string | Recherche par nom de commune   |
| `limit`      | int    | Nombre max de résultats        |
| `sort_by`    | string | Colonne de tri                 |
| `sort_order` | string | asc ou desc                    |

### Schéma de données

L'API charge les données depuis `scoring_communes.csv` et les enrichit au démarrage :

**Tables logiques (colonnes principales)** :

| Catégorie         | Colonnes                                                        |
|-------------------|-----------------------------------------------------------------|
| Identification    | `code_commune`, `nom_commune`, `code_departement`, `nom_departement` |
| Données brutes    | `population`, `densite_population`, `nb_coproprietes`, `taille_moyenne_copro` |
| Scores calculés   | `score_total`, `score_coproprietes`, `score_densite`, `score_marche`, `score_motorisation` |
| Classement        | `rang_national`, `rang_departemental`, `categorie`              |

**Catégorisation des scores** :

| Catégorie  | Seuil           |
|------------|-----------------|
| Excellent  | score ≥ 11.5    |
| Bon        | score ≥ 8.5     |
| Moyen      | score ≥ 6.0     |
| Faible     | score < 6.0     |

### Dépendances backend

```
fastapi==0.115.0
uvicorn==0.30.6
pandas==2.2.2
openpyxl==3.1.5
sqlalchemy
psycopg2-binary
```

## Frontend (React + Vite)

### Fonctionnalités du dashboard

- **Carte interactive** (Leaflet) : visualisation géographique du scoring par commune
- **Filtres dynamiques** : département, catégorie, score minimum, recherche par nom
- **KPI Cards** : indicateurs clés en haut du dashboard (communes, copropriétés, scores)
- **Tableau de données** : liste triable et filtrable des zones
- **Graphiques** (Chart.js) : distribution des scores, corrélations
- **Modal détail** : clic sur une commune pour voir le détail des sous-scores

### Librairies frontend

| Librairie        | Usage                           |
|------------------|---------------------------------|
| React 19         | Framework UI                    |
| Vite 8           | Build tool / dev server         |
| Leaflet          | Carte interactive               |
| react-leaflet    | Intégration React de Leaflet    |
| Chart.js         | Graphiques (barres, distribution)|
| react-chartjs-2  | Intégration React de Chart.js   |
| Axios            | Appels HTTP vers l'API          |

## Fichiers

```
app/
├── main.py              # API FastAPI (endpoints + chargement données)
├── Dockerfile           # Image Python 3.10 + Uvicorn
├── requirements.txt     # Dépendances Python
├── frontend/
│   ├── src/
│   │   ├── api.js       # Service centralisé d'appels API
│   │   ├── App.jsx      # Composant principal
│   │   └── components/  # MapView, Sidebar, DataTable, KpiCards, etc.
│   ├── Dockerfile       # Image Node 22 + Vite dev server
│   ├── package.json     # Dépendances Node
│   └── vite.config.js   # Config Vite + proxy API
└── README.md            # Ce fichier
```
