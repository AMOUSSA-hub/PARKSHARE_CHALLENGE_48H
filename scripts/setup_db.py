import sqlite3
import pandas as pd
import numpy as np
import os
import argparse

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

# Configuration
BASE_DIR = "C:/Users/rafik/Documents/GitHub/PARKSHARE_CHALLENGE_48H/"
CSV_PATH = os.path.join(BASE_DIR, "data", "scoring_communes.csv")
SQLITE_DB_PATH = os.path.join(BASE_DIR, "data", "parkshare.db")

# Postgres default credentials from docker-compose
PG_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "user": "parkshare_user",
    "password": "parkshare_password",
    "database": "parkshare"
}

def normalize(series):
    min_val = series.min()
    max_val = series.max()
    if max_val == min_val:
        return pd.Series([50.0] * len(series), index=series.index)
    return ((series - min_val) / (max_val - min_val)) * 100

def categorize(score):
    if score >= 11.5: return "Excellent"
    elif score >= 8.5: return "Bon"
    elif score >= 6.0: return "Moyen"
    else: return "Faible"

def get_data_prepared():
    print(f"Loading data from {CSV_PATH}...")
    df_raw = pd.read_csv(CSV_PATH)
    
    # Transform
    df = df_raw.copy()
    df = df.rename(columns={
        "codeinsee": "code_commune",
        "dep_code": "code_departement",
        "departement": "nom_departement",
        "densite_pop": "densite_population",
        "taille_moy_copro": "taille_moyenne_copro",
        "ratio_parking": "taux_motorisation", 
        "score_potentiel": "score_total",
    })

    df["nb_lots_coproprietes"] = df["total_lots_habitation"].fillna(0) + df["total_lots_parking"].fillna(0)
    df["part_logements_collectifs"] = 50.0
    df["population"] = df["population"].fillna(0).astype(float)
    df["nb_coproprietes"] = df["nb_coproprietes"].fillna(0).astype(int)
    df["taille_moyenne_copro"] = df["taille_moyenne_copro"].fillna(0).astype(float)

    df["score_coproprietes"] = normalize(df["nb_coproprietes"])
    df["score_taille_copro"] = normalize(df["taille_moyenne_copro"])
    df["score_densite"] = normalize(df["densite_population"])
    df["score_marche"] = normalize(df["nb_coproprietes"] * df["taille_moyenne_copro"])
    df["score_logement_collectif"] = 50.0
    df["score_motorisation"] = normalize(df["taux_motorisation"])
    
    df["ratio_copro_population"] = df["nb_coproprietes"] / df["population"].replace(0, 1) * 1000
    df["score_ratio_copro"] = normalize(df["ratio_copro_population"])
    df["score_total"] = df["score_total"].round(1)
    df["categorie"] = df["score_total"].apply(categorize)

    # Deduplicate: if multiple entries for same code_commune, keep the one with best score
    df = df.sort_values(["code_commune", "score_total"], ascending=[True, False])
    df = df.drop_duplicates(subset=["code_commune"])

    # Clean departments: ensure one name per code_departement
    # First, discard "non connu" if possible
    df["nom_departement"] = df["nom_departement"].replace("non connu", np.nan)
    dept_names = df.groupby("code_departement")["nom_departement"].first().reset_index()
    dept_names["nom_departement"] = dept_names["nom_departement"].fillna("Inconnu")
    
    # Merge back the clean department names
    df = df.drop(columns=["nom_departement"]).merge(dept_names, on="code_departement")

    # Rankings (re-calculated after deduplication)
    df = df.sort_values("score_total", ascending=False).reset_index(drop=True)
    df["rang_national"] = range(1, len(df) + 1)
    df["rang_departemental"] = df.groupby("code_departement")["score_total"].rank(
        ascending=False, method="min"
    ).fillna(0).astype(int)
    
    return df_raw, df

def setup_sqlite(df_raw, df):
    conn = sqlite3.connect(SQLITE_DB_PATH)
    df_raw.to_sql("raw_communes", conn, if_exists="replace", index=False)
    df.to_sql("transformed_communes", conn, if_exists="replace", index=False)
    
    # KPI Tables (updated group by to avoid duplicates)
    kpi_dept = df.groupby(["code_departement", "nom_departement"]).agg(
        nb_communes=("code_commune", "count"),
        nb_total_coproprietes=("nb_coproprietes", "sum"),
        population_totale=("population", "sum"),
        score_moyen=("score_total", "mean"),
        score_max=("score_total", "max"),
        meilleure_commune=("nom_commune", "first"),
    ).reset_index()
    kpi_dept["score_moyen"] = kpi_dept["score_moyen"].round(1)
    kpi_dept.to_sql("kpi_departements", conn, if_exists="replace", index=False)

    top_zone = df.iloc[0]
    top_dept = kpi_dept.sort_values("score_moyen", ascending=False).iloc[0]["nom_departement"]
    kpi_global_data = [{
        "total_communes": len(df),
        "total_coproprietes": int(df["nb_coproprietes"].sum()),
        "total_lots": int(df["nb_lots_coproprietes"].sum()),
        "score_moyen": round(float(df["score_total"].mean()), 1),
        "score_max": round(float(df["score_total"].max()), 1),
        "score_min": round(float(df["score_total"].min()), 1),
        "meilleure_zone": top_zone["nom_commune"],
        "meilleur_score": round(float(top_zone["score_total"]), 1),
        "top_departement": top_dept,
        "nb_zones_excellent": int((df["categorie"] == "Excellent").sum()),
        "nb_zones_bon": int((df["categorie"] == "Bon").sum()),
        "nb_zones_moyen": int((df["categorie"] == "Moyen").sum()),
        "nb_zones_faible": int((df["categorie"] == "Faible").sum()),
        "population_totale": int(df["population"].sum()),
    }]
    pd.DataFrame(kpi_global_data).to_sql("kpi_global", conn, if_exists="replace", index=False)
    
    cur = conn.cursor()
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transformed_commune_code ON transformed_communes(code_commune)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transformed_dept_code ON transformed_communes(code_departement)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transformed_score ON transformed_communes(score_total)")
    conn.commit()
    conn.close()
    print("SQLite database updated.")

def setup_postgres(df_raw, df):
    if not POSTGRES_AVAILABLE:
        print("Error: psycopg2 is not installed. Please install it with 'pip install psycopg2-binary'.")
        return

    print("Connecting to PostgreSQL...")
    from sqlalchemy import create_engine
    engine = create_engine(f"postgresql://{PG_CONFIG['user']}:{PG_CONFIG['password']}@{PG_CONFIG['host']}:{PG_CONFIG['port']}/{PG_CONFIG['database']}")
    
    print("Writing tables to PostgreSQL...")
    df_raw.to_sql("raw_communes", engine, if_exists="replace", index=False)
    df.to_sql("transformed_communes", engine, if_exists="replace", index=False)
    
    # KPI Tables
    kpi_dept = df.groupby(["code_departement", "nom_departement"]).agg(
        nb_communes=("code_commune", "count"),
        nb_total_coproprietes=("nb_coproprietes", "sum"),
        population_totale=("population", "sum"),
        score_moyen=("score_total", "mean"),
        score_max=("score_total", "max"),
        meilleure_commune=("nom_commune", "first"),
    ).reset_index()
    kpi_dept["score_moyen"] = kpi_dept["score_moyen"].round(1)
    kpi_dept.to_sql("kpi_departements", engine, if_exists="replace", index=False)

    top_zone = df.iloc[0]
    top_dept = kpi_dept.sort_values("score_moyen", ascending=False).iloc[0]["nom_departement"]
    kpi_global_data = [{
        "total_communes": len(df),
        "total_coproprietes": int(df["nb_coproprietes"].sum()),
        "total_lots": int(df["nb_lots_coproprietes"].sum()),
        "score_moyen": round(float(df["score_total"].mean()), 1),
        "score_max": round(float(df["score_total"].max()), 1),
        "score_min": round(float(df["score_total"].min()), 1),
        "meilleure_zone": top_zone["nom_commune"],
        "meilleur_score": round(float(top_zone["score_total"]), 1),
        "top_departement": top_dept,
        "nb_zones_excellent": int((df["categorie"] == "Excellent").sum()),
        "nb_zones_bon": int((df["categorie"] == "Bon").sum()),
        "nb_zones_moyen": int((df["categorie"] == "Moyen").sum()),
        "nb_zones_faible": int((df["categorie"] == "Faible").sum()),
        "population_totale": int(df["population"].sum()),
    }]
    pd.DataFrame(kpi_global_data).to_sql("kpi_global", engine, if_exists="replace", index=False)
    
    # Indices via raw psycopg2 for efficiency
    conn = psycopg2.connect(**PG_CONFIG)
    cur = conn.cursor()
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transformed_commune_code ON transformed_communes(code_commune)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transformed_dept_code ON transformed_communes(code_departement)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transformed_score ON transformed_communes(score_total)")
    conn.commit()
    conn.close()
    print("PostgreSQL database updated.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--postgres", action="store_true", help="Populate PostgreSQL database")
    parser.add_argument("--sqlite", action="store_true", help="Populate SQLite database")
    args = parser.parse_args()

    df_raw, df = get_data_prepared()
    
    if args.postgres:
        setup_postgres(df_raw, df)
    elif args.sqlite:
        setup_sqlite(df_raw, df)
    else:
        # Default behavior: if no arg, do nothing or explain
        print("Please specify --postgres or --sqlite")
