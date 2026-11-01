import os
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, RandomizedSearchCV
from scipy.stats import randint, uniform
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    
    roc_auc_score,
    roc_curve,
)
from xgboost import XGBClassifier

# ============================================================
# 1. FEATURE SELECTION (13 CLASSIC UCI FEATURES)
# ============================================================

FEATURE_COLS = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal"
]

TARGET_COL = "target"

DEFAULT_FEATURE_VALUES = {
    "age": 55.0,
    "sex": 1.0,
    "cp": 0.0,
    "trestbps": 120.0,
    "chol": 200.0,
    "fbs": 0.0,
    "restecg": 0.0,
    "thalach": 150.0,
    "exang": 0.0,
    "oldpeak": 0.0,
    "slope": 1.0,
    "ca": 0.0,
    "thal": 2.0,
}


# ============================================================
# 2. LOAD DATASET
# ============================================================

def load_dataset():
    """
    Load and combine all available Heart Disease datasets (UCI, Cross-Dataset, 2026 Risk Dataset)
    into a unified multi-center training dataset.
    """
    dfs = []
    paths = [
        "../data/uci_heart_disease_4centers.csv",
        "data/uci_heart_disease_4centers.csv",
        "../data/heart_clean.csv",
        "data/heart_clean.csv",
    ]

    for path in paths:
        if os.path.exists(path):
            print(f"📥 Loading dataset: {path}")
            df_item = pd.read_csv(path, sep=';' if 'cardio_train' in path else ',')
            dfs.append(df_item)

    if not dfs:
        raise FileNotFoundError("\nNo dataset files found in data/\n")

    combined_df = pd.concat(dfs, ignore_index=True, sort=False)
    print(f"Combined {len(dfs)} dataset sources. Total rows: {len(combined_df)}")
    return combined_df


# ============================================================
# 3. PREPROCESS DATASET
# ============================================================

def preprocess_dataset(df):
    """
    Convert the dataset into a machine-learning-ready format matching 25 features.
    """

    df = df.copy()

    print("\nOriginal columns:")
    print(df.columns.tolist())

    # --------------------------------------------------------
    # Standardize column names
    # --------------------------------------------------------

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    # --------------------------------------------------------
    # Rename common Kaggle/UCI/Risk column names
    # --------------------------------------------------------

    rename_map = {
        "resting_bp_systolic": "trestbps",
        "resting_bp_diastolic": "trestbps_d",
        "cholesterol_total": "chol",
        "cholesterol": "chol",
        "max_heart_rate_achieved": "thalach",
        "maxhr": "thalach",
        "st_depression": "oldpeak",
        "alcohol_units_per_week": "alcohol",
        "exercise_minutes_per_week": "exercise_min",
        "sleep_hours": "sleep",
        "stress_score": "stress",
        "daily_steps": "steps",
        "diet_quality_score": "diet_quality",
        "chestpaintype": "cp",
        "chest_pain_type": "cp",
        "restingbp": "trestbps",
        "fastingbs": "fbs",
        "fasting_blood_sugar": "fbs",
        "exerciseangina": "exang",
        "exercise_induced_angina": "exang",
        "restingecg": "restecg",
        "heartdisease": "target",
        "has_heart_disease": "target",
        "num": "target",
        "smoker_status": "smoker",
    }

    df.rename(columns=rename_map, inplace=True)

    # Combine duplicate columns created by merging multiple dataset formats
    if df.columns.has_duplicates:
        df = df.loc[:, ~df.columns.duplicated()]

    # --------------------------------------------------------
    # Convert categorical columns
    # --------------------------------------------------------

    # Sex
    if "sex" in df.columns:
        if df["sex"].dtype == object:
            df["sex"] = (
                df["sex"]
                .astype(str)
                .str.strip()
                .str.lower()
                .map({
                    "male": 1,
                    "m": 1,
                    "1": 1,
                    "female": 0,
                    "f": 0,
                    "0": 0
                })
                .fillna(1)
            )

    # Chest pain type
    if "cp" in df.columns and df["cp"].dtype == object:
        cp_map = {
            "typical angina": 0,
            "atypical angina": 1,
            "non-anginal pain": 2,
            "non-anginal": 2,
            "asymptomatic": 3
        }
        df["cp"] = (
            df["cp"]
            .astype(str)
            .str.strip()
            .str.lower()
            .map(cp_map)
            .fillna(0)
        )

    # Exercise-induced angina
    if "exang" in df.columns and (df["exang"].dtype == object or df["exang"].dtype == bool):
        df["exang"] = (
            df["exang"]
            .astype(str)
            .str.strip()
            .str.lower()
            .map({
                "true": 1,
                "yes": 1,
                "y": 1,
                "1": 1,
                "false": 0,
                "no": 0,
                "n": 0,
                "0": 0
            })
            .fillna(0)
        )

    # Family history
    if "family_history" in df.columns and (df["family_history"].dtype == object or df["family_history"].dtype == bool):
        df["family_history"] = (
            df["family_history"]
            .astype(str)
            .str.strip()
            .str.lower()
            .map({
                "true": 1,
                "yes": 1,
                "1": 1,
                "false": 0,
                "no": 0,
                "0": 0
            })
            .fillna(0)
        )

    # Fasting blood sugar
    if "fbs" in df.columns:
        if df["fbs"].dtype == object or df["fbs"].dtype == bool:
            df["fbs"] = (
                df["fbs"]
                .astype(str)
                .str.strip()
                .str.lower()
                .map({
                    "true": 1,
                    "yes": 1,
                    "1": 1,
                    "false": 0,
                    "no": 0,
                    "0": 0
                })
                .fillna(0)
            )
        else:
            # If values > 120 (mg/dL), convert to binary flag
            if df["fbs"].max() > 1:
                df["fbs"] = (df["fbs"] > 120).astype(int)

    # Smoker
    if "smoker" in df.columns and df["smoker"].dtype == object:
        smoker_map = {
            "never": 0,
            "former": 1,
            "current": 2
        }
        df["smoker"] = (
            df["smoker"]
            .astype(str)
            .str.strip()
            .str.lower()
            .map(smoker_map)
            .fillna(0)
        )

    # Slope
    if "slope" in df.columns and df["slope"].dtype == object:
        slope_map = {"upsloping": 0, "flat": 1, "downsloping": 2}
        df["slope"] = df["slope"].astype(str).str.strip().str.lower().map(slope_map).fillna(1)

    # Thal
    if "thal" in df.columns and df["thal"].dtype == object:
        thal_map = {"normal": 1, "fixed defect": 2, "fixed": 2, "reversible defect": 3, "reversible": 3}
        df["thal"] = df["thal"].astype(str).str.strip().str.lower().map(thal_map).fillna(2)

    # --------------------------------------------------------
    # Target
    # --------------------------------------------------------

    target_names = ["target", "heart_disease", "has_heart_disease", "disease_type", "TenYearCHD", "cardio"]
    
    for name in target_names:
        if name in df.columns:
            df.rename(columns={name: "target"}, inplace=True)
            break

    # If this is the cardio_train dataset, map its specific columns
    if 'ap_hi' in df.columns:
        df = df.rename(columns={
            'gender': 'sex',
            'ap_hi': 'trestbps',
            'cholesterol': 'chol',
            'gluc': 'fbs',
            'smoke': 'smoker',
            'alco': 'alcohol',
            'active': 'exercise_min'
        })
        # Map gender (1: women, 2: men) to (0: female, 1: male)
        df['sex'] = df['sex'].map({1: 0, 2: 1})
        # Map cholesterol/gluc 1,2,3 to continuous/binary equivalents for compatibility
        df['chol'] = df['chol'].map({1: 200, 2: 240, 3: 280})
        df['fbs'] = (df['fbs'] > 1).astype(int)

    if "target" not in df.columns:
        raise ValueError(
            "Target column not found. "
            "Expected a heart disease target column."
        )

    # Convert target to binary
    if df["target"].dtype == object:
        df["target"] = (
            df["target"]
            .astype(str)
            .str.strip()
            .str.lower()
            .map({
                "yes": 1,
                "no": 0,
                "presence": 1,
                "absence": 0,
                "positive": 1,
                "negative": 0,
                "disease": 1,
                "no disease": 0,
                "true": 1,
                "false": 0
            })
        )

    df["target"] = pd.to_numeric(df["target"], errors="coerce")
    df["target"] = (df["target"] > 0).astype(int)

    # Drop target row missing
    df.dropna(subset=["target"], inplace=True)

    # --------------------------------------------------------
    # Ensure all 25 FEATURE_COLS exist in DataFrame
    # --------------------------------------------------------

    for col in FEATURE_COLS:
        if col not in df.columns:
            print(f"Column '{col}' missing. Filling with default value {DEFAULT_FEATURE_VALUES[col]}")
            df[col] = DEFAULT_FEATURE_VALUES[col]
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(DEFAULT_FEATURE_VALUES[col])

    print("\nProcessed columns:")
    print([c for c in FEATURE_COLS if c in df.columns])

    print("\nTarget distribution:")
    print(df["target"].value_counts())

    return df


# ============================================================
# 4. TRAIN MODEL
# ============================================================

def train_heart_disease_model():

    print("\n" + "=" * 60)
    print("HEART DISEASE ML TRAINING")
    print("=" * 60)

    # --------------------------------------------------------
    # Load & Preprocess
    # --------------------------------------------------------

    df = load_dataset()
    df = preprocess_dataset(df)

    # --------------------------------------------------------
    # X and Y
    # --------------------------------------------------------

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    print("\nFeature count:", len(FEATURE_COLS))
    print("Number of patients:", len(df))

    # --------------------------------------------------------
    # Train / Test Split
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print("\nTraining samples:", len(X_train))
    print("Testing samples :", len(X_test))

    # --------------------------------------------------------
    # XGBoost Pipeline with Hyperparameter Tuning
    # --------------------------------------------------------

    print("\nBuilding XGBoost pipeline...")

    base_pipeline = Pipeline([
        ("imputer",    SimpleImputer(strategy="median")),
        ("scaler",     StandardScaler()),
        ("classifier", XGBClassifier(
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )),
    ])

    # Param grid — prefix with "classifier__" to target the pipeline step
    param_dist = {
        "classifier__n_estimators":     randint(100, 600),
        "classifier__max_depth":        randint(3, 9),
        "classifier__learning_rate":    uniform(0.01, 0.29),   # 0.01 – 0.30
        "classifier__min_child_weight": randint(1, 8),
        "classifier__subsample":        uniform(0.6, 0.4),     # 0.6 – 1.0
        "classifier__colsample_bytree": uniform(0.5, 0.5),     # 0.5 – 1.0
        "classifier__gamma":            uniform(0.0, 0.5),
        "classifier__reg_alpha":        uniform(0.0, 1.0),
        "classifier__reg_lambda":       uniform(0.5, 2.0),
    }

    cv_inner = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    search = RandomizedSearchCV(
        estimator=base_pipeline,
        param_distributions=param_dist,
        n_iter=40,                  # increase for a broader search
        scoring="f1",
        cv=cv_inner,
        refit=True,                 # re-trains best params on full X_train
        verbose=2,
        random_state=42,
        n_jobs=-1,
        error_score="raise",
    )

    print("\nRunning RandomizedSearchCV (40 iterations × 5-fold CV)...")
    search.fit(X_train, y_train)

    print("\n" + "=" * 60)
    print("BEST HYPERPARAMETERS")
    print("=" * 60)
    for param, val in search.best_params_.items():
        print(f"  {param.replace('classifier__', ''):<22}: {val}")
    print(f"\n  Best CV F1 score : {search.best_score_ * 100:.2f}%")

    # Use the already-refitted best estimator as the final pipeline
    pipeline = search.best_estimator_

    print("\nTraining completed!")

    # --------------------------------------------------------
    # Prediction & Evaluation
    # --------------------------------------------------------

    y_pred = pipeline.predict(X_test)
    y_probability = pipeline.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    AUC = roc_auc_score(y_test, y_pred)

    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    print(f"Accuracy  : {accuracy * 100:.2f}%")
    print(f"Precision : {precision * 100:.2f}%")
    print(f"Recall    : {recall * 100:.2f}%")
    print(f"F1 Score  : {f1 * 100:.2f}%")
    print(f"AUC       : {AUC * 100:.2f}%")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=["No Heart Disease", "Heart Disease"],
            zero_division=0
        )
    )

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    # --------------------------------------------------------
    # Cross Validation
    # --------------------------------------------------------

    print("\nRunning 5-Fold Cross Validation...")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(
        pipeline,
        X,
        y,
        cv=cv,
        scoring="accuracy",
        n_jobs=-1
    )

    print(
        f"CV Accuracy: {cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%"
    )

    # --------------------------------------------------------
    # Save Model to expected paths
    # --------------------------------------------------------

    os.makedirs("model", exist_ok=True)
    os.makedirs("../model", exist_ok=True)

    joblib.dump(pipeline, "model/heart_disease_model.pkl")
    joblib.dump(pipeline, "../model/heart_disease_model.pkl")
    joblib.dump(pipeline, "model/cardio_model.pkl")
    joblib.dump(pipeline, "model/cardio_multiclass_model.pkl")
    joblib.dump(FEATURE_COLS, "model/feature_columns.pkl")
    joblib.dump(FEATURE_COLS, "../model/feature_columns.pkl")

    print("\n" + "=" * 60)
    print("MODEL SAVED")
    print("=" * 60)
    print("Saved to heart_disease_model.pkl, model/heart_disease_model.pkl, model/cardio_model.pkl, and model/cardio_multiclass_model.pkl")
    print(f"Features: {len(FEATURE_COLS)}")

    return pipeline


# ============================================================
# 5. TEST SINGLE PATIENT
# ============================================================

def predict_patient(model, **patient_kwargs):
    patient_data = {col: DEFAULT_FEATURE_VALUES[col] for col in FEATURE_COLS}
    patient_data.update({k: v for k, v in patient_kwargs.items() if k in patient_data})

    patient_df = pd.DataFrame([patient_data])
    prediction = model.predict(patient_df)[0]
    probability = model.predict_proba(patient_df)[0][1]

    print("\n" + "=" * 60)
    print("HEART DISEASE PREDICTION")
    print("=" * 60)

    if prediction == 1:
        print("️ Prediction: HEART DISEASE")
    else:
        print("Prediction: NO HEART DISEASE")

    print(f"Probability: {probability * 100:.2f}%")

    return prediction, probability


# ============================================================
# 6. MAIN
# ============================================================

if __name__ == "__main__":
    model = train_heart_disease_model()