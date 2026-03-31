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

import psycopg2
from psycopg2.extras import RealDictCursor

# ============================================================
# Connexion à la base de données PostgreSQL
# ============================================================

# Configuration par défaut (correspond au docker-compose)
PG_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "user": os.getenv("DB_USER", "parkshare_user"),
    "password": os.getenv("DB_PASSWORD", "parkshare_password"),
    "database": os.getenv("DB_NAME", "parkshare")
}

def get_db_connection():
    conn = psycopg2.connect(**PG_CONFIG, cursor_factory=RealDictCursor)
    return conn

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
    """Retourne la liste des zones avec leurs scores depuis la table transformed_communes."""
    query = "SELECT * FROM transformed_communes WHERE 1=1"
    params: list = []

    if departement:
        query += " AND code_departement = %s"
        params.append(departement)
    if score_min is not None:
        query += " AND score_total >= %s"
        params.append(score_min)
    if score_max is not None:
        query += " AND score_total <= %s"
        params.append(score_max)
    if categorie:
        query += " AND categorie = %s"
        params.append(categorie)
    if search:
        query += " AND nom_commune LIKE %s"
        params.append(f"%{search}%")

    # Tri (validation basique des colonnes autorisées)
    allowed_sort = ["score_total", "nom_commune", "population", "nb_coproprietes", "rang_national"]
    if sort_by in allowed_sort:
        order = "ASC" if sort_order == "asc" else "DESC"
        query += f" ORDER BY {sort_by} {order}"
    else:
        query += " ORDER BY score_total DESC"

    if limit:
        query += " LIMIT %s"
        params.append(limit)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    zones = [dict(row) for row in rows]
    return {
        "total": len(zones),
        "zones": zones
    }


@app.get("/api/zone/{code_commune}")
def get_zone_detail(code_commune: str):
    """Retourne les détails d'une commune."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM transformed_communes WHERE code_commune = %s", (code_commune,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return JSONResponse(status_code=404, content={"error": "Commune non trouvée"})

    return dict(row)


@app.get("/api/kpis")
def get_kpis():
    """Retourne les KPIs globaux depuis la table kpi_global."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM kpi_global")
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return JSONResponse(status_code=500, content={"error": "KPIs non disponibles"})
        
    return dict(row)


@app.get("/api/departements")
def get_departements():
    """Retourne les scores agrégés par département depuis la table kpi_departements."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM kpi_departements ORDER BY score_moyen DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    departements = [dict(row) for row in rows]
    return {
        "total": len(departements),
        "departements": departements
    }


@app.get("/api/distribution")
def get_distribution():
    """Retourne la distribution des scores par tranches."""
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
    SELECT 
        CASE 
            WHEN score_total <= 10 THEN '0-10'
            WHEN score_total <= 20 THEN '10-20'
            WHEN score_total <= 30 THEN '20-30'
            WHEN score_total <= 40 THEN '30-40'
            WHEN score_total <= 50 THEN '40-50'
            WHEN score_total <= 60 THEN '50-60'
            WHEN score_total <= 70 THEN '60-70'
            WHEN score_total <= 80 THEN '70-80'
            WHEN score_total <= 90 THEN '80-90'
            ELSE '90-100'
        END as tranche,
        COUNT(*) as count
    FROM transformed_communes
    GROUP BY tranche
    ORDER BY MIN(score_total)
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    return {
        "labels": [row["tranche"] for row in rows],
        "values": [row["count"] for row in rows]
    }


@app.get("/api/correlation")
def get_correlation():
    """Retourne la matrice de corrélation (calculée via Pandas pour la simplicité)."""
    cols = [
        "population", "densite_population", "nb_coproprietes",
        "taille_moyenne_copro", "taux_motorisation", "score_total"
    ]
    
    conn = get_db_connection()
    # Utiliser SQLAlchemy pour Pandas read_sql avec Postgres
    from sqlalchemy import create_engine
    engine = create_engine(f"postgresql://{PG_CONFIG['user']}:{PG_CONFIG['password']}@{PG_CONFIG['host']}:{PG_CONFIG['port']}/{PG_CONFIG['database']}")
    df = pd.read_sql(f"SELECT {','.join(cols)} FROM transformed_communes", engine)
    conn.close()
    
    corr = df.corr().round(2).replace({np.nan: None})
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

