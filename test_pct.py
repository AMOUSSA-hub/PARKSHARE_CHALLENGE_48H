import pandas as pd
df = pd.read_csv("data/scoring_communes.csv", dtype={"codeinsee": str})
s = df["score_potentiel"]
print(s.quantile([0.5, 0.75, 0.9, 0.95, 0.99]))
