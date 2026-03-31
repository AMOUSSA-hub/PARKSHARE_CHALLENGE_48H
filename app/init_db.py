"""
Parkshare - Initialisation de la base PostgreSQL
Crée les tables et importe les données depuis scoring_communes.csv
"""
import os, sys, time
import pandas as pd
import psycopg2

PG = {
    "host": os.getenv("DB_HOST", "db"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "user": os.getenv("DB_USER", "parkshare"),
    "password": os.getenv("DB_PASSWORD", "parkshare2024"),
    "database": os.getenv("DB_NAME", "parkshare"),
}
CSV_PATH = "/data/scoring_communes.csv"

def wait_pg(retries=30):
    for i in range(retries):
        try:
            c = psycopg2.connect(**PG); c.close()
            print(f"[init] PostgreSQL OK ({i+1} tentative(s))"); return True
        except psycopg2.OperationalError:
            print(f"[init] Attente PG... {i+1}/{retries}"); time.sleep(2)
    print("[init] ERREUR: PG indisponible"); return False

def create_tables(conn):
    cur = conn.cursor()
    cur.execute("""
    DROP TABLE IF EXISTS kpi_departements, kpi_global, transformed_communes, raw_communes CASCADE;
    
    CREATE TABLE raw_communes (
        codeinsee VARCHAR(10) PRIMARY KEY,
        dep_code VARCHAR(5), departement VARCHAR(100), region VARCHAR(100),
        nom_commune VARCHAR(200), nb_coproprietes INTEGER,
        total_lots_habitation FLOAT, total_lots_parking FLOAT,
        ratio_parking FLOAT, taille_moy_copro FLOAT,
        population FLOAT, surface_km2 FLOAT, densite_pop FLOAT,
        latitude FLOAT, longitude FLOAT,
        nb_coproprietes_norm FLOAT, total_lots_habitation_norm FLOAT,
        densite_pop_norm FLOAT, ratio_parking_norm FLOAT, score_potentiel FLOAT
    );

    CREATE TABLE transformed_communes (
        code_commune VARCHAR(10) PRIMARY KEY,
        code_departement VARCHAR(5), nom_departement VARCHAR(100),
        region VARCHAR(100), nom_commune VARCHAR(200),
        nb_coproprietes INTEGER, total_lots_habitation FLOAT,
        total_lots_parking FLOAT, taux_motorisation FLOAT,
        taille_moyenne_copro FLOAT, population FLOAT,
        surface_km2 FLOAT, densite_population FLOAT,
        latitude FLOAT, longitude FLOAT,
        nb_lots_coproprietes FLOAT, score_total FLOAT,
        score_coproprietes FLOAT, score_taille_copro FLOAT,
        score_densite FLOAT, score_marche FLOAT,
        score_motorisation FLOAT, categorie VARCHAR(20),
        rang_national INTEGER, rang_departemental INTEGER
    );

    CREATE TABLE kpi_global (
        id SERIAL PRIMARY KEY,
        total_communes INTEGER, total_coproprietes BIGINT,
        total_lots BIGINT, score_moyen FLOAT, score_max FLOAT,
        score_min FLOAT, meilleure_zone VARCHAR(200),
        meilleur_score FLOAT, top_departement VARCHAR(100),
        nb_zones_excellent INTEGER, nb_zones_bon INTEGER,
        nb_zones_moyen INTEGER, nb_zones_faible INTEGER,
        population_totale BIGINT
    );

    CREATE TABLE kpi_departements (
        code_departement VARCHAR(5) PRIMARY KEY,
        nom_departement VARCHAR(100), nb_communes INTEGER,
        nb_total_coproprietes BIGINT, population_totale BIGINT,
        score_moyen FLOAT, score_max FLOAT,
        meilleure_commune VARCHAR(200)
    );
    """)
    conn.commit(); cur.close()
    print("[init] Tables créées")

def norm(s):
    mn, mx = s.min(), s.max()
    if mx == mn: return pd.Series([50.0]*len(s), index=s.index)
    return ((s - mn) / (mx - mn)) * 100

def categorize(score):
    if score >= 11.5: return "Excellent"
    elif score >= 8.5: return "Bon"
    elif score >= 6.0: return "Moyen"
    return "Faible"

def import_data(conn):
    cur = conn.cursor()
    print(f"[init] Lecture CSV: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH, dtype={"codeinsee": str, "dep_code": str})
    print(f"[init] {len(df)} lignes lues")

    # --- RAW ---
    for _, r in df.iterrows():
        vals = [None if pd.isna(v) else v for v in r.values]
        cur.execute("""INSERT INTO raw_communes VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING""", vals)
    conn.commit()
    print(f"[init] raw_communes: {len(df)} lignes")

    # --- TRANSFORM ---
    tf = df.rename(columns={
        "codeinsee": "code_commune", "dep_code": "code_departement",
        "departement": "nom_departement", "densite_pop": "densite_population",
        "taille_moy_copro": "taille_moyenne_copro",
        "ratio_parking": "taux_motorisation", "score_potentiel": "score_total",
    })
    tf["nb_lots_coproprietes"] = tf["total_lots_habitation"].fillna(0) + tf["total_lots_parking"].fillna(0)
    for c in ["population","nb_coproprietes","taille_moyenne_copro","densite_population","taux_motorisation"]:
        tf[c] = tf[c].fillna(0)
    tf["score_coproprietes"] = norm(tf["nb_coproprietes"])
    tf["score_taille_copro"] = norm(tf["taille_moyenne_copro"])
    tf["score_densite"] = norm(tf["densite_population"])
    tf["score_marche"] = norm(tf["nb_coproprietes"] * tf["taille_moyenne_copro"])
    tf["score_motorisation"] = norm(tf["taux_motorisation"])
    tf["score_total"] = tf["score_total"].round(1)
    tf["categorie"] = tf["score_total"].apply(categorize)
    tf = tf.sort_values("score_total", ascending=False).reset_index(drop=True)
    tf["rang_national"] = range(1, len(tf) + 1)
    tf["rang_departemental"] = tf.groupby("code_departement")["score_total"].rank(
        ascending=False, method="min").fillna(0).astype(int)

    # Insert transformed
    cols_t = ["code_commune","code_departement","nom_departement","region","nom_commune",
        "nb_coproprietes","total_lots_habitation","total_lots_parking","taux_motorisation",
        "taille_moyenne_copro","population","surface_km2","densite_population",
        "latitude","longitude","nb_lots_coproprietes","score_total",
        "score_coproprietes","score_taille_copro","score_densite","score_marche",
        "score_motorisation","categorie","rang_national","rang_departemental"]
    for _, r in tf[cols_t].iterrows():
        vals = [None if pd.isna(v) else v for v in r.values]
        ph = ",".join(["%s"]*len(vals))
        cur.execute(f"INSERT INTO transformed_communes ({','.join(cols_t)}) VALUES ({ph}) ON CONFLICT DO NOTHING", vals)
    conn.commit()
    print(f"[init] transformed_communes: {len(tf)} lignes")

    # --- KPI GLOBAL ---
    top = tf.iloc[0]
    cur.execute("""INSERT INTO kpi_global 
        (total_communes, total_coproprietes, total_lots, score_moyen, score_max, score_min,
         meilleure_zone, meilleur_score, top_departement,
         nb_zones_excellent, nb_zones_bon, nb_zones_moyen, nb_zones_faible, population_totale)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""", (
        len(tf), int(tf["nb_coproprietes"].sum()), int(tf["nb_lots_coproprietes"].sum()),
        round(float(tf["score_total"].mean()),1), round(float(tf["score_total"].max()),1),
        round(float(tf["score_total"].min()),1),
        top["nom_commune"], round(float(top["score_total"]),1),
        tf.groupby("nom_departement")["score_total"].mean().idxmax(),
        int((tf["categorie"]=="Excellent").sum()), int((tf["categorie"]=="Bon").sum()),
        int((tf["categorie"]=="Moyen").sum()), int((tf["categorie"]=="Faible").sum()),
        int(tf["population"].sum())
    ))
    conn.commit()
    print("[init] kpi_global OK")

    # --- KPI DEPARTEMENTS ---
    dept = tf.groupby(["code_departement","nom_departement"]).agg(
        nb_communes=("code_commune","count"),
        nb_total_coproprietes=("nb_coproprietes","sum"),
        population_totale=("population","sum"),
        score_moyen=("score_total","mean"),
        score_max=("score_total","max"),
        meilleure_commune=("nom_commune","first"),
    ).reset_index()
    dept["score_moyen"] = dept["score_moyen"].round(1)
    for _, r in dept.iterrows():
        cur.execute("""INSERT INTO kpi_departements VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING""", (
            r["code_departement"], r["nom_departement"], int(r["nb_communes"]),
            int(r["nb_total_coproprietes"]), int(r["population_totale"]),
            float(r["score_moyen"]), float(r["score_max"]), r["meilleure_commune"]
        ))
    conn.commit()
    print(f"[init] kpi_departements: {len(dept)} départements")
    cur.close()
    print("[init] Import terminé avec succès!")

if __name__ == "__main__":
    if not wait_pg():
        sys.exit(1)
    conn = psycopg2.connect(**PG)
    create_tables(conn)
    import_data(conn)
    conn.close()
    print("[init] Base de données prête!")
