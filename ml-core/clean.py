import io
import os
import urllib.request
import zipfile
import numpy as np
import pandas as pd

print("📥 Fetching Full 4-Center Heart Disease Dataset from UCI...")
url = "https://archive.ics.uci.edu/static/public/45/heart+disease.zip"

try:
    req = urllib.request.urlopen(url)
    z = zipfile.ZipFile(io.BytesIO(req.read()))
except Exception as e:
    print(f"Network error fetching from UCI: {e}. Falling back to local file if available.")
    z = None

cols = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope",
    "ca", "thal", "num"
]

center_files = {
    "Cleveland": "processed.cleveland.data",
    "Hungarian": "processed.hungarian.data",
    "Switzerland": "processed.switzerland.data",
    "Long Beach VA": "processed.va.data"
}

dfs = []
if z is not None:
    for hospital, fname in center_files.items():
        with z.open(fname) as f:
            df = pd.read_csv(f, header=None, names=cols, na_values=["?", "-9", -9])
            df["hospital"] = hospital
            dfs.append(df)
            print(f"  ✓ Loaded {hospital:<15}: {len(df)} records")
else:
    # Local fallback
    fallback_path = "data/uci_heart_disease_4centers.csv"
    if os.path.exists(fallback_path):
        combined = pd.read_csv(fallback_path)
        print(f"  ✓ Loaded existing 4-center dataset: {len(combined)} records")
    else:
        raise FileNotFoundError("Could not download or find 4-center dataset.")

if dfs:
    combined = pd.concat(dfs, ignore_index=True)

print(f"\n📊 Total raw records fetched: {len(combined)} across 4 medical centers")

# 1. Standardize Target: 0 = Healthy, > 0 = Disease
if "num" in combined.columns:
    combined["target"] = (combined["num"] > 0).astype(int)
    combined.drop(columns=["num"], inplace=True)
elif "target" in combined.columns:
    combined["target"] = (combined["target"] > 0).astype(int)

# 2. Clean Physiologically Impossible Zero Values (replace with NaN for proper imputation)
combined.loc[combined["trestbps"] <= 50, "trestbps"] = np.nan
combined.loc[combined["chol"] <= 50, "chol"] = np.nan
combined.loc[combined["thalach"] <= 50, "thalach"] = np.nan

# 3. Clinical Imputation: Medians for continuous vitals, Modes for categorical flags
continuous_cols = ["trestbps", "chol", "thalach", "oldpeak"]
for col in continuous_cols:
    med = combined[col].median()
    combined[col] = combined[col].fillna(med)

categorical_cols = ["fbs", "restecg", "exang", "slope", "ca", "thal"]
for col in categorical_cols:
    mod = combined[col].mode()[0]
    combined[col] = combined[col].fillna(mod)

# 4. Remove Duplicate Patient Records & Hospital Column
if "hospital" in combined.columns:
    combined.drop(columns=["hospital"], inplace=True)
elif "center" in combined.columns:
    combined.drop(columns=["center"], inplace=True)

before_len = len(combined)
combined = combined.drop_duplicates()
after_len = len(combined)
if before_len - after_len > 0:
    print(f"  ✓ Removed {before_len - after_len} duplicate records.")

# 5. Save the Clean Dataset (13 Clinical Features + Target)
os.makedirs("data", exist_ok=True)
output_path = "data/heart_clean.csv"
combined.to_csv(output_path, index=False)

# Also save copy to uci_heart_disease_4centers.csv for consistency
combined.to_csv("data/uci_heart_disease_4centers.csv", index=False)

print(f"\n✅ Data cleaned successfully!")
print(f"✅ Saved cleaned full 4-center dataset to: {output_path}")
print(f"📊 Final Dataset Shape: {combined.shape[0]} rows, {combined.shape[1]} columns")
print(f"🏥 Medical Centers included: Cleveland (303), Hungarian (294), Switzerland (123), Long Beach VA (200)")
print(f"⚖️ Class Balance: {(combined['target'] == 0).sum()} Healthy (0) | {(combined['target'] == 1).sum()} Heart Disease (1)")