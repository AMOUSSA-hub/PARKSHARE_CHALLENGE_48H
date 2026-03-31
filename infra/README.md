# Infra — Conteneurisation & Déploiement

## Vue d'ensemble

La stack est entièrement conteneurisée avec Docker Compose et déployée sur une VM Debian hébergée sur un serveur Proxmox (OVH). Un reverse proxy Nginx route le trafic vers le frontend et l'API.

## Services Docker

| Service           | Image              | Port interne | Rôle                          |
|-------------------|--------------------|-------------|-------------------------------|
| `parkshare-proxy` | nginx:alpine       | 80          | Reverse proxy, point d'entrée |
| `parkshare-frontend` | Build local (Node 22) | 5173   | Interface React (Vite)        |
| `parkshare-api`   | Build local (Python 3.10) | 8000 | API FastAPI                   |
| `parkshare-db`    | postgres:15-alpine | 5432        | Base de données PostgreSQL    |

## Réseau

Tous les services communiquent via le réseau Docker interne `parkshare_net`. Seul le reverse proxy expose le port 80 vers l'extérieur. La base de données n'est **pas** accessible depuis l'extérieur.

```
Internet → :8080 (Proxmox NAT) → :80 (Nginx) → frontend / api
                                                    │
                                                    └→ PostgreSQL (réseau interne uniquement)
```

## Variables d'environnement

Fichier `.env` requis dans `/infra/` (voir `.env.example`) :

| Variable          | Description                       | Exemple         |
|-------------------|-----------------------------------|-----------------|
| `POSTGRES_USER`   | Utilisateur PostgreSQL            | `parkshare`     |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL         | `monMotDePasse` |
| `POSTGRES_DB`     | Nom de la base de données         | `parkshare`     |

> **Sécurité** : Le fichier `.env` contient les secrets et est listé dans `.gitignore`. Seul `.env.example` est versionné (sans valeurs réelles).

## Déploiement

### Lancer la stack en local

```bash
cd infra
cp .env.example .env    # puis éditer avec vos valeurs
docker compose up --build -d
```

### Vérifier que tout fonctionne

```bash
docker ps                    # 4 conteneurs UP
curl http://localhost        # Retourne le HTML du dashboard
docker logs parkshare-api    # Vérifier les logs de l'API
```

### Arrêter la stack

```bash
docker compose down
```

## Accès distant

Le dashboard est accessible depuis l'extérieur via un port forwarding NAT configuré sur le nœud Proxmox :

- **URL publique** : `http://51.77.216.208`
- **Mécanisme** : Mécanisme : Le nœud Proxmox redirige le port 80 (vmbr0, IP publique) vers le port 80 de la VM (vmbr1, réseau interne 10.0.0.10).

### Règles iptables sur le nœud Proxmox

```bash
iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 80 -j DNAT --to-destination 10.0.0.10:80
iptables -A FORWARD -p tcp -d 10.0.0.10 --dport 80 -j ACCEPT
iptables -t nat -A POSTROUTING -d 10.0.0.10 -o vmbr1 -j MASQUERADE
echo 1 > /proc/sys/net/ipv4/ip_forward
## Configuration Nginx

Le fichier `nginx/default.conf` définit le routage :

| Route     | Destination              | Rôle                       |
|-----------|--------------------------|----------------------------|
| `/`       | `http://frontend:5173`   | Interface React            |
| `/api/*`  | `http://api:8000/api/*`  | Endpoints FastAPI           |

Le proxy WebSocket est activé pour le hot-reload Vite en développement.

## Fichiers

```
infra/
├── docker-compose.yml     # Orchestration des 4 services
├── nginx/
│   └── default.conf       # Configuration du reverse proxy
├── .env.example           # Template des variables d'environnement
├── .env                   # Variables réelles (non versionné)
└── README.md              # Ce fichier
```
