"""
Parkshare - Backend API (FastAPI)
Lit les données depuis le fichier Excel et expose les endpoints pour le dashboard.
"""

import os
import math
import pandas as pd
import numpy as np
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional

app = FastAPI(title="Parkshare API", version="1.0.0")

# ============================================================
# Chargement des données depuis Excel
# ============================================================

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "scoring_communes.csv")

def load_data():
    """Charge et enrichit les données depuis le fichier CSV réel."""
    df = pd.read_csv(DATA_PATH, dtype={"codeinsee": str, "dep_code": str})

    # Renommage des colonnes pour correspondre au schéma attendu par le frontend
    df = df.rename(columns={
        "codeinsee": "code_commune",
        "dep_code": "code_departement",
        "departement": "nom_departement",
        "densite_pop": "densite_population",
        "taille_moy_copro": "taille_moyenne_copro",
        "ratio_parking": "taux_motorisation", 
        "score_potentiel": "score_total",
    })

    # Création des colonnes manquantes
    df["nb_lots_coproprietes"] = df["total_lots_habitation"].fillna(0) + df["total_lots_parking"].fillna(0)
    df["part_logements_collectifs"] = 50.0  # Non fourni dans le fichier, mocké
    df["population"] = df["population"].fillna(0)
    df["nb_coproprietes"] = df["nb_coproprietes"].fillna(0)
    df["taille_moyenne_copro"] = df["taille_moyenne_copro"].fillna(0)

    # Recalcul de quelques sous-scores nécessaires pour le Modal Frontend
    def normalize(series):
        min_val = series.min()
        max_val = series.max()
        if max_val == min_val:
            return pd.Series([50.0] * len(series), index=series.index)
        return ((series - min_val) / (max_val - min_val)) * 100

    df["score_coproprietes"] = normalize(df["nb_coproprietes"])
    df["score_taille_copro"] = normalize(df["taille_moyenne_copro"])
    df["score_densite"] = normalize(df["densite_population"])
    df["score_marche"] = normalize(df["nb_coproprietes"] * df["taille_moyenne_copro"])
    df["score_logement_collectif"] = 50.0  # Mocké
    
    # Motorisation a été mappée depuis ratio_parking, on normalise (inversé = plus de parking -> moins bon ?)
    # Ou juste une normalisation simple :
    df["score_motorisation"] = normalize(df["taux_motorisation"])
    
    df["ratio_copro_population"] = df["nb_coproprietes"] / df["population"].replace(0, 1) * 1000
    df["score_ratio_copro"] = normalize(df["ratio_copro_population"])

    # On conserve le score total de l'équipe Data qui est déjà sur ~100
    df["score_total"] = df["score_total"].round(1)

    # Catégorisation ajustée pour la distribution réelle très asymétrique :
    # Excellent (Top 5%): >= 11.5
    # Bon (Top 25%): >= 8.5
    # Moyen (Top 50%): >= 6.0
    # Faible: < 6.0
    def categorize(score):
        if score >= 11.5: return "Excellent"
        elif score >= 8.5: return "Bon"
        elif score >= 6.0: return "Moyen"
        else: return "Faible"

    df["categorie"] = df["score_total"].apply(categorize)

    # Classement national
    df = df.sort_values("score_total", ascending=False).reset_index(drop=True)
    df["rang_national"] = range(1, len(df) + 1)

    # Classement départemental
    df["rang_departemental"] = df.groupby("code_departement")["score_total"].rank(
        ascending=False, method="min"
    ).fillna(0).astype(int)

    return df


# Charger les données au démarrage
df_data = load_data()


# ============================================================
# API Endpoints
# ============================================================

@app.get("/api/zones")
def get_zones(
    departement: Optional[str] = Query(None, description="Filtrer par code département"),
    score_min: Optional[float] = Query(None, description="Score minimum"),
    score_max: Optional[float] = Query(None, description="Score maximum"),
    categorie: Optional[str] = Query(None, description="Filtrer par catégorie"),
    search: Optional[str] = Query(None, description="Recherche par nom de commune"),
    limit: Optional[int] = Query(None, description="Limiter le nombre de résultats"),
    sort_by: Optional[str] = Query("score_total", description="Colonne de tri"),
    sort_order: Optional[str] = Query("desc", description="Ordre de tri (asc/desc)"),
):
    """Retourne la liste des zones avec leurs scores."""
    filtered = df_data.copy()

    if departement:
        filtered = filtered[filtered["code_departement"] == departement]
    if score_min is not None:
        filtered = filtered[filtered["score_total"] >= score_min]
    if score_max is not None:
        filtered = filtered[filtered["score_total"] <= score_max]
    if categorie:
        filtered = filtered[filtered["categorie"] == categorie]
    if search:
        filtered = filtered[filtered["nom_commune"].str.contains(search, case=False, na=False)]

    # Tri
    ascending = sort_order == "asc"
    if sort_by in filtered.columns:
        filtered = filtered.sort_values(sort_by, ascending=ascending)

    if limit:
        filtered = filtered.head(limit)

    # Remplacer NaN par None pour JSON
    filtered = filtered.replace({np.nan: None, np.inf: None, -np.inf: None})

    return {
        "total": len(filtered),
        "zones": filtered.to_dict(orient="records")
    }


@app.get("/api/zone/{code_commune}")
def get_zone_detail(code_commune: str):
    """Retourne les détails d'une commune."""
    commune = df_data[df_data["code_commune"] == code_commune]
    if commune.empty:
        return JSONResponse(status_code=404, content={"error": "Commune non trouvée"})

    record = commune.iloc[0].replace({np.nan: None, np.inf: None, -np.inf: None})
    return record.to_dict()


@app.get("/api/kpis")
def get_kpis():
    """Retourne les KPIs globaux."""
    top_zone = df_data.iloc[0]
    return {
        "total_communes": len(df_data),
        "total_coproprietes": int(df_data["nb_coproprietes"].sum()),
        "total_lots": int(df_data["nb_lots_coproprietes"].sum()),
        "score_moyen": round(float(df_data["score_total"].mean()), 1),
        "score_max": round(float(df_data["score_total"].max()), 1),
        "score_min": round(float(df_data["score_total"].min()), 1),
        "meilleure_zone": top_zone["nom_commune"],
        "meilleur_score": round(float(top_zone["score_total"]), 1),
        "top_departement": df_data.groupby("nom_departement")["score_total"].mean().idxmax(),
        "nb_zones_excellent": int((df_data["categorie"] == "Excellent").sum()),
        "nb_zones_bon": int((df_data["categorie"] == "Bon").sum()),
        "nb_zones_moyen": int((df_data["categorie"] == "Moyen").sum()),
        "nb_zones_faible": int((df_data["categorie"] == "Faible").sum()),
        "population_totale": int(df_data["population"].sum()),
    }


@app.get("/api/departements")
def get_departements():
    """Retourne les scores agrégés par département."""
    dept_agg = df_data.groupby(["code_departement", "nom_departement"]).agg(
        nb_communes=("code_commune", "count"),
        nb_total_coproprietes=("nb_coproprietes", "sum"),
        population_totale=("population", "sum"),
        score_moyen=("score_total", "mean"),
        score_max=("score_total", "max"),
        meilleure_commune=("nom_commune", "first"),  # premier = meilleur score (déjà trié)
    ).reset_index()

    dept_agg["score_moyen"] = dept_agg["score_moyen"].round(1)
    dept_agg = dept_agg.sort_values("score_moyen", ascending=False)
    dept_agg = dept_agg.replace({np.nan: None, np.inf: None, -np.inf: None})

    return {
        "total": len(dept_agg),
        "departements": dept_agg.to_dict(orient="records")
    }


@app.get("/api/distribution")
def get_distribution():
    """Retourne la distribution des scores par tranches."""
    bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    labels = ["0-10", "10-20", "20-30", "30-40", "40-50", "50-60", "60-70", "70-80", "80-90", "90-100"]
    df_data["tranche"] = pd.cut(df_data["score_total"], bins=bins, labels=labels, include_lowest=True)
    distribution = df_data["tranche"].value_counts().sort_index()
    return {
        "labels": distribution.index.astype(str).tolist(),
        "values": distribution.values.tolist()
    }


@app.get("/api/correlation")
def get_correlation():
    """Retourne la matrice de corrélation entre les variables clés."""
    cols = [
        "population", "densite_population", "nb_coproprietes",
        "taille_moyenne_copro", "taux_motorisation",
        "part_logements_collectifs", "score_total"
    ]
    corr = df_data[cols].corr().round(2).replace({np.nan: None})
    return {
        "labels": cols,
        "matrix": corr.values.tolist()
    }


# ============================================================
# Servir le frontend React (build pre-generé)
# ============================================================

REACT_DIST_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.exists(REACT_DIST_DIR):
    # Servir les assets statiques (js, css, images) sous /assets, etc.
    app.mount("/assets", StaticFiles(directory=os.path.join(REACT_DIST_DIR, "assets")), name="assets")
    
    # Catch-all route pour SPA React
    @app.get("/{full_path:path}")
    def serve_react_app(full_path: str):
        # Si le fichier demandé existe directement dans dist (ex: vite.svg), le servir
        file_path = os.path.join(REACT_DIST_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Sinon, retourner index.html pour que React Router gère côté client
        return FileResponse(os.path.join(REACT_DIST_DIR, "index.html"))

