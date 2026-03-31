# Parkshare - Dashboard d'Analyse du Potentiel Commercial

Ce répertoire contient le backend (FastAPI) et le frontend (React) de l'application Parkshare.

## 🗄️ Schéma de la Base de Données (PostgreSQL)

La base de données est structurée en trois niveaux pour assurer la traçabilité et faciliter l'analyse :

### 1. Table Brute (`raw_communes`)
Contient les données importées directement du fichier CSV sans transformation majeure.
- Colonnes : Toutes les colonnes d'origine du fichier de scoring (population, densite, nb_copro, etc.)

### 2. Table Transformée (`transformed_communes`)
Données nettoyées, dédoublonnées et enrichies avec des scores normalisés (0-100).
- `code_commune` / `nom_commune` : Identifiants géographiques.
- `score_total` : Score final de potentiel commercial.
- `categorie` : Qualification de la zone (Excellent, Bon, Moyen, Faible).
- `rang_national` / `rang_departemental` : Classement de la commune.
- `population`, `nb_coproprietes`, `densite_population`, `taux_motorisation` : Indicateurs clés.

### 3. Tables de KPIs
- **`kpi_departements`** : Agrégations par département (score moyen, nombre de communes, meilleure commune du département).
- **`kpi_global`** : Métriques globales du projet (total copropriétés, score max/min, meilleure zone nationale).

---

## 🔌 Instructions de Connexion

L'application utilise **PostgreSQL** (version 15-alpine) via Docker.

### Paramètres de connexion (par défaut)
- **Hôte** : `localhost` (ou `db` si vous êtes dans un conteneur Docker)
- **Port** : `5432`
- **Utilisateur** : `parkshare_user`
- **Mot de passe** : `parkshare_password`
- **Base de données** : `parkshare`

### Accès direct (via terminal)
Si Docker est lancé, vous pouvez accéder à la base via :
```bash
docker exec -it parkshare_db psql -U parkshare_user -d parkshare
```

---

## 📊 Utilisation du Dashboard

Le dashboard est accessible sur [http://localhost:8000](http://localhost:8000).

### 🔍 Filtrage des données
Utilisez la **barre latérale gauche** pour affiner l'analyse :
- **Recherche** : Filtrer par nom de commune.
- **Département** : Isoler une zone géographique spécifique.
- **Catégorie** : Filtrer par niveau de potentiel (ex: "Excellent").
- **Score Minimum** : Curseur pour exclure les zones à faible potentiel.
- *N'oubliez pas de cliquer sur le bouton **"Rechercher"** pour appliquer les filtres.*

### 🗺️ Carte Interactive
- La carte affiche des marqueurs de couleur selon le score.
- Cliquez sur un marqueur pour ouvrir une **fiche détaillée** de la commune (population, détails du score, rang).

### 📈 Analyse Graphique
- **Distribution des scores** : Visualisez la répartition globale du marché.
- **Classement par département** : Identifiez les territoires les plus porteurs.
- **Corrélation** : Comprenez quels facteurs (population, motorisation) influencent le plus le score.

### 📋 Tableau de Données
Le bas de page affiche la liste exhaustive des résultats filtrés. Vous pouvez cliquer sur n'importe quelle ligne pour voir le détail d'une commune.
