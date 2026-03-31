# Data — Collecte, nettoyage & analyse

## Objectif

Collecter et analyser des données ouvertes pour produire un scoring des communes françaises selon leur potentiel commercial pour Parkshare (partage de places de stationnement en copropriété).

## Sources de données

| Source                        | Données utilisées                              | Format |
|-------------------------------|------------------------------------------------|--------|
| Registre des copropriétés     | Nombre de copropriétés, lots d'habitation et de parking par commune | CSV |
| Données INSEE                 | Population, densité de population par commune  | CSV    |
| Base DVF / data.gouv.fr       | Transactions immobilières, lots de stationnement | CSV  |

## KPIs produits

### KPI 1 — Score de potentiel (par commune)

Score composite croisant plusieurs indicateurs, normalisé sur 100 :

| Sous-score             | Description                                    |
|------------------------|------------------------------------------------|
| Score copropriétés     | Nombre de copropriétés (normalisé)             |
| Score taille copro     | Taille moyenne des copropriétés (normalisé)    |
| Score densité          | Densité de population (normalisé)              |
| Score marché           | Volume copropriétés × taille (normalisé)       |
| Score motorisation     | Ratio parking par copropriété (normalisé)      |

### KPI 2 — Classement des zones

Top N des communes prioritaires pour la prospection commerciale, triées par score décroissant, avec classement national et départemental.

### KPI 3 — Agrégation par département

Score moyen, score max, nombre de communes analysées et meilleure commune par département.

### KPI 4 — Distribution des scores

Répartition des communes par tranches de score (0-10, 10-20, ..., 90-100) pour visualiser la distribution globale.

## Pipeline de traitement

1. **Collecte** : téléchargement des datasets depuis les sources ouvertes
2. **Nettoyage** : suppression des doublons, gestion des valeurs manquantes, normalisation des codes INSEE
3. **Enrichissement** : jointures entre les sources, calcul des ratios
4. **Scoring** : normalisation min-max des indicateurs, calcul du score composite pondéré
5. **Export** : génération du fichier `scoring_communes.csv` pour l'API

## Reproduire le pipeline

```bash
# Prérequis : Python 3.10+, pip
pip install pandas numpy openpyxl jupyter matplotlib seaborn

# Lancer le notebook
jupyter notebook parkshare_data.ipynb
```

Le notebook génère le fichier `scoring_communes.csv` utilisé par l'API.

## Graphiques produits

| Fichier                              | Description                                |
|--------------------------------------|--------------------------------------------|
| `graphique1_top20.png`               | Top 20 communes par score de potentiel     |
| `graphique2_distribution_scores.png` | Distribution des scores                    |
| `graphique3_top_departements.png`    | Top départements par score moyen           |
| `graphique4_ratio_vs_score.png`      | Ratio parking vs score de potentiel        |

## Fichiers

```
data/
├── parkshare_data.ipynb           # Notebook principal (collecte + nettoyage + scoring)
├── scoring_communes.csv           # Fichier de livraison (consommé par l'API)
├── parkshare.db                   # Base SQLite (export alternatif)
├── graphique1_top20.png           # Visualisation top 20
├── graphique2_distribution_scores.png  # Distribution des scores
├── graphique3_top_departements.png     # Top départements
├── graphique4_ratio_vs_score.png       # Ratio vs score
└── README.md                      # Ce fichier
```
