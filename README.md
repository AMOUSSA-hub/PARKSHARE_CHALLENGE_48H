# Parkshare — Analyse de Potentiel Commercial

Dashboard interactif d'analyse géographique pour identifier les zones à fort potentiel commercial pour [Parkshare](https://parkshare.net/fr/), une plateforme de partage de places de stationnement entre résidents d'une même copropriété.

## Accès au dashboard

- **URL publique** : `http://51.77.216.208:8080`

## Structure du projet

```
/data       → Notebooks, scripts de collecte, fichiers de données
/app        → Backend FastAPI + Frontend React (Vite)
/infra      → Docker Compose, Nginx, configuration déploiement
```

## Stack technique

| Composant       | Technologie                     |
|-----------------|---------------------------------|
| Backend API     | Python 3.10, FastAPI, Pandas    |
| Frontend        | React 19, Vite, Leaflet, Chart.js |
| Base de données | PostgreSQL 15                   |
| Reverse proxy   | Nginx (Alpine)                  |
| Conteneurisation| Docker, Docker Compose          |
| Hébergement     | VM Debian sur Proxmox (OVH)     |

## Démarrage rapide

### Prérequis
- Docker et Docker Compose installés
- Git

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/AMOUSSA-hub/PARKSHARE_CHALLENGE_48H.git
cd PARKSHARE_CHALLENGE_48H

# 2. Configurer les variables d'environnement
cp infra/.env.example infra/.env
# Éditer infra/.env avec vos valeurs

# 3. Lancer la stack
cd infra
docker compose up --build -d

# 4. Accéder au dashboard
# http://localhost
```

## Architecture

```
Navigateur
    │
    ▼ :80
┌──────────┐
│  Nginx   │ (reverse proxy)
└────┬─────┘
     │
     ├── /        → Frontend React (Vite dev server :5173)
     │
     └── /api/*   → Backend FastAPI (Uvicorn :8000)
                        │
                        ▼
                   PostgreSQL :5432
```

## Équipe

| Profil | Responsabilité                                  |
|--------|------------------------------------------------|
| Data   | Collecte, nettoyage, scoring des communes       |
| Dev    | API, dashboard interactif, base de données      |
| Infra  | Conteneurisation, déploiement, sécurisation     |

## Documentation par profil

- [`/data/README.md`](data/README.md) — Sources de données, pipeline, KPIs
- [`/app/README.md`](app/README.md) — Schéma BDD, API, dashboard
- [`/infra/README.md`](infra/README.md) — Déploiement, Docker, accès distant
