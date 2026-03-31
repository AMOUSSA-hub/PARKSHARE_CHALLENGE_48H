# Database Schema Documentation

The Parkshare database is an SQLite database located at `data/parkshare.db`. It contains three levels of tables as per requirements.

## 1. Raw Source Tables (Données Brutes)
Contains original data as received from the Data team.

### `raw_communes`
| Column | Type | Description |
|--------|------|-------------|
| `codeinsee` | TEXT | Official Insee code |
| `dep_code` | TEXT | Department code |
| `departement` | TEXT | Department name |
| `region` | TEXT | Region name |
| `nom_commune` | TEXT | Name of the commune |
| `nb_coproprietes` | INTEGER | Number of co-owned properties |
| `total_lots_habitation` | INTEGER | Total housing lots |
| `total_lots_parking` | INTEGER | Total parking lots |
| `ratio_parking` | REAL | Parking ratio |
| `taille_moy_copro` | REAL | Average size per co-owned property |
| `population` | REAL | Population |
| `densite_pop` | REAL | Population density |
| `surface_commune` | REAL | Area in km2 |
| `latitude` | REAL | Latitude |
| `longitude` | REAL | Longitude |
| `score_potentiel` | REAL | Raw potential score |

## 2. Transformed Tables (Données Transformées)
Contains cleaned, enriched, and normalized data for application logic.

### `transformed_communes`
| Column | Type | Description |
|--------|------|-------------|
| `code_commune` | TEXT (PK) | Official Insee code |
| `nom_commune` | TEXT | Name of the commune |
| `code_departement` | TEXT | Department code |
| `nom_departement` | TEXT | Department name |
| `score_total` | REAL | Final potential score (rounded) |
| `categorie` | TEXT | Excellent / Bon / Moyen / Faible |
| `rang_national` | INTEGER | National ranking |
| `rang_departemental` | INTEGER | Ranking within department |
| `nb_lots_coproprietes` | REAL | habitation + parking lots |
| `score_coproprietes` | REAL | Normalized score for volume of copros |
| `score_taille_copro` | REAL | Normalized score for size of copros |
| `score_densite` | REAL | Normalized score for density |
| `score_marche` | REAL | Combined market score |
| `score_motorisation` | REAL | Normalized score for motorization |

## 3. KPI Tables (Données de KPIs)
Contains pre-aggregated results for fast retrieval in the dashboard.

### `kpi_departements`
| Column | Type | Description |
|--------|------|-------------|
| `code_departement` | TEXT | Code |
| `nom_departement` | TEXT | Name |
| `nb_communes` | INTEGER | Number of communes in dept |
| `nb_total_coproprietes` | INTEGER | Sum of copros in dept |
| `population_totale` | REAL | Sum of population in dept |
| `score_moyen` | REAL | Average score in department |
| `score_max` | REAL | Max score in department |
| `meilleure_commune` | TEXT | Top commune in department |

### `kpi_global`
Contains a single row of global metrics used for the dashboard header.
| Column | Type | Description |
|--------|------|-------------|
| `total_communes` | INTEGER | Total communes |
| `total_coproprietes` | INTEGER | Total copros |
| `total_lots` | INTEGER | Total lots |
| `score_moyen` | REAL | Global average score |
| `meilleure_zone` | TEXT | Name of the best commune |
| `meilleur_score` | REAL | Score of the best commune |
| `top_departement` | TEXT | Name of the best department |
| `nb_zones_excellent` | INTEGER | Count of 'Excellent' zones |
| `nb_zones_bon` | INTEGER | Count of 'Bon' zones |
| `nb_zones_moyen` | INTEGER | Count of 'Moyen' zones |
| `nb_zones_faible` | INTEGER | Count of 'Faible' zones |
