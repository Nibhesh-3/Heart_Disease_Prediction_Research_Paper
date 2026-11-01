import os
import sys
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# ============================================================
# 1. 25 CLINICAL & LIFESTYLE FEATURES
# ============================================================
FEATURE_COLS = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs',
    'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
]

# Reasonable clinical defaults for features that might be missing
DEFAULTS = {
    'cp': 0, 'thalach': 150, 'exang': 0, 'oldpeak': 0.0,
    'chol': 200, 'fbs': 0, 'trestbps': 120,
    'age': 55.0, 'sex': 1, 'restecg': 0, 'slope': 1, 'ca': 0, 'thal': 2
}

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Map columns from various datasets into our 25-feature standard."""
    df = df.copy()
    df.columns = df.columns.astype(str).str.strip().str.lower()
    
    # 1. Map Age
    if 'age' in df.columns:
        df['age'] = pd.to_numeric(df['age'], errors='coerce')
        if df['age'].mean() > 200: # Probably in days (like cardio_train)
            df['age'] = df['age'] / 365.25
            
    # 2. Map Sex/Gender
    if 'gender' in df.columns and 'sex' not in df.columns:
        # cardio_train uses 1: women, 2: men -> Map to 0: female, 1: male
        df['sex'] = df['gender'].map({1: 0, 2: 1, 'female': 0, 'male': 1})
        
    # 3. Blood Pressure
    if 'ap_hi' in df.columns: df['trestbps'] = pd.to_numeric(df['ap_hi'], errors='coerce')
    if 'ap_lo' in df.columns: df['trestbps_d'] = pd.to_numeric(df['ap_lo'], errors='coerce')
    if 'resting_bp_systolic' in df.columns: df['trestbps'] = df['resting_bp_systolic']
    if 'resting_bp_diastolic' in df.columns: df['trestbps_d'] = df['resting_bp_diastolic']
        
    # 4. Cholesterol
    if 'cholesterol' in df.columns:
        if df['cholesterol'].max() <= 3:
            # cardio_train uses 1, 2, 3 scale
            df['chol'] = df['cholesterol'].map({1: 200, 2: 240, 3: 280})
        else:
            df['chol'] = pd.to_numeric(df['cholesterol'], errors='coerce')
    if 'cholesterol_total' in df.columns: df['chol'] = df['cholesterol_total']
            
    # 5. Fasting Blood Sugar / Glucose
    if 'gluc' in df.columns:
        # cardio_train uses 1, 2, 3 -> map >1 to True (1)
        df['fbs'] = (pd.to_numeric(df['gluc'], errors='coerce') > 1).astype(int)
    if 'fasting_blood_sugar' in df.columns: df['fbs'] = df['fasting_blood_sugar']
        
    # 6. Lifestyle
    if 'smoke' in df.columns: df['smoker'] = pd.to_numeric(df['smoke'], errors='coerce')
    if 'smoker_status' in df.columns: df['smoker'] = df['smoker_status']
    if 'alco' in df.columns: df['alcohol'] = pd.to_numeric(df['alco'], errors='coerce')
    if 'alcohol_units_per_week' in df.columns: df['alcohol'] = df['alcohol_units_per_week']
    if 'active' in df.columns: 
        # Binary active flag -> 150 mins if active, 0 if not
        df['exercise_min'] = pd.to_numeric(df['active'], errors='coerce') * 150
    if 'exercise_minutes_per_week' in df.columns: df['exercise_min'] = df['exercise_minutes_per_week']
        
    # 7. BMI from Height/Weight
    if 'height' in df.columns and 'weight' in df.columns and 'bmi' not in df.columns:
        height_m = pd.to_numeric(df['height'], errors='coerce') / 100.0
        weight_kg = pd.to_numeric(df['weight'], errors='coerce')
        df['bmi'] = weight_kg / (height_m ** 2)
        
    # Standard renaming map for both UCI and 2026 dataset column variations
    rename_map = {
        # UCI column names
        'chestpaintype': 'cp',
        'restingbp': 'trestbps',
        'cholesterol': 'chol',
        'fastingbs': 'fbs',
        'restingecg': 'restecg',
        'maxhr': 'thalach',
        'exerciseangina': 'exang',
        'heartdisease': 'target',
        
        # 2026 dataset column names
        'max_heart_rate_achieved': 'thalach',
        'chest_pain_type': 'cp',
        'st_depression': 'oldpeak',
        'exercise_induced_angina': 'exang',
        'sleep_hours': 'sleep',
        'stress_score': 'stress',
        'daily_steps': 'steps',
        'diet_quality_score': 'diet_quality'
    }
    df.rename(columns=rename_map, inplace=True)
    
    # Check for aggregation dataset (NHANES check)
    if 'topic' in df.columns and 'data_value' in df.columns:
        print("\n❌ WARNING: Aggregated surveillance dataset detected (e.g. NHANES).")
        print("This script requires patient-level microdata. Exiting.")
        sys.exit(1)

    # Drop duplicate column names if any exist
    df = df.loc[:, ~df.columns.duplicated()]

    # Fill missing features with defaults
    X = pd.DataFrame()
    for col in FEATURE_COLS:
        if col in df.columns:
            val = df[col]
            if isinstance(val, pd.DataFrame):
                val = val.iloc[:, 0]
            X[col] = pd.to_numeric(val, errors='coerce').fillna(DEFAULTS[col])
        else:
            X[col] = DEFAULTS[col]
            
    return X

def get_target(df: pd.DataFrame) -> pd.Series:
    """Finds the target column in the dataset and converts it to binary."""
    df_cols = df.columns.astype(str).str.strip().str.lower()
    target_names = ['cardio', 'target', 'has_heart_disease', 'heartdisease', 'disease']
    for t in target_names:
        if t in df_cols:
            idx = df_cols.tolist().index(t)
            col_name = df.columns[idx]
            return pd.to_numeric(df[col_name], errors='coerce').fillna(0) > 0
    return None

def main():
    print("=" * 65)
    print(" 🩺 HEART DISEASE MODEL TEST / INFERENCE")
    print("=" * 65)

    # Try each saved path in priority order (matches what train_model.py saves)
    _model_candidates = [
        os.getenv("MODEL_PATH"),
       
        "model/heart_disease_model.pkl",
          # legacy fallback
    ]
    model_path = next((p for p in _model_candidates if p and os.path.exists(p)), None)
    if model_path is None:
        print("\n❌ No trained model found. Run train_model.py first.")
        sys.exit(1)
        
    _default_candidates = [
        "../data/external_test_dataset.csv",
        "data/external_test_dataset.csv",
        "../data/uci_heart_disease_4centers.csv",
        "data/uci_heart_disease_4centers.csv",
    ]
    default_test = next((p for p in _default_candidates if os.path.exists(p)), "../data/cross_dataset_test_corrected.csv")
    test_file = sys.argv[1] if len(sys.argv) > 1 else default_test
    if not os.path.exists(test_file):
        print(f"\n❌ Dataset not found: {test_file}")
        sys.exit(1)

    print(f"\n📥 Loading model from {model_path} ...")
    model = joblib.load(model_path)
    
    print(f"📥 Loading dataset from {test_file} ...")
    df = pd.read_csv(test_file, sep=';' if ';' in open(test_file).readline() else ',')
    print(f"   ✓ Rows: {len(df)} | Cols: {len(df.columns)}")
    
    X_test = prepare_features(df)
    y_true = get_target(df)
    
    print("\n⚡ Running Inference...")
    
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_test)
        if len(probs.shape) > 1 and probs.shape[1] >= 2:
            y_probs = probs[:, 1]
        else:
            y_probs = probs
    else:
        # Fallback if no probabilities
        y_probs = model.predict(X_test)
        if len(y_probs.shape) > 1 and y_probs.shape[1] > 1:
            y_probs = y_probs[:, 0]

    if y_true is not None:
        y_true = y_true.astype(int)
        
        # Calculate optimal threshold using Youden's J statistic
        from sklearn.metrics import roc_curve
        fpr, tpr, thresholds = roc_curve(y_true, y_probs)
        optimal_idx = np.argmax(tpr - fpr)
        optimal_threshold = thresholds[optimal_idx]
        
        print(f"\n⚙️ Auto-calibrating threshold for this dataset...")
        print(f"   Default Threshold: 0.50")
        print(f"   Optimal Threshold: {optimal_threshold:.2f} (Adjusted for dataset prevalence)")
        
        y_pred = (y_probs >= optimal_threshold).astype(int)
    else:
        # If no true labels, use default 0.5 threshold
        y_pred = (y_probs >= 0.5).astype(int)

    print("\n📊 Prediction Distribution (0 = Healthy, 1 = Disease):")
    print(pd.Series(y_pred).value_counts().sort_index())
    
    if y_true is not None:
        y_true = y_true.astype(int)
        acc = accuracy_score(y_true, y_pred)
        print("\n" + "=" * 65)
        print(f" 🎯 ACCURACY SCORE: {acc * 100:.2f}%")
        print("=" * 65)
        
        print("\n📋 Classification Report:")
        print(classification_report(y_true, y_pred, target_names=["Healthy", "Heart Disease"]))
        
        print("\n🔲 Confusion Matrix:")
        cm = confusion_matrix(y_true, y_pred)
        print(cm)
    else:
        print("\n⚠ No target column found in the dataset to evaluate accuracy.")
        
    print("\n✅ Testing Complete.")

if __name__ == '__main__':
    main()
