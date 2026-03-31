#!/bin/sh
echo "[startup] Initialisation de la base de données..."
python init_db.py
echo "[startup] Démarrage de l'API..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
