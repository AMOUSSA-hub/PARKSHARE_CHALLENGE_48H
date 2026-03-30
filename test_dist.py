import pandas as pd
import numpy as np

DATA_PATH = "data/scoring_communes.csv"
df = pd.read_csv(DATA_PATH, dtype={"codeinsee": str, "dep_code": str})
df = df.rename(columns={"score_potentiel": "score_total"})
df["score_total"] = df["score_total"].round(1)

bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
labels = ["0-10", "10-20", "20-30", "30-40", "40-50", "50-60", "60-70", "70-80", "80-90", "90-100"]
df["tranche"] = pd.cut(df["score_total"], bins=bins, labels=labels, include_lowest=True)
distribution = df["tranche"].value_counts().sort_index()
print(list(distribution.index.astype(str)))
print(list(distribution.values.astype(int)))
