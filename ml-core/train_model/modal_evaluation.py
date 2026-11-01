import os
import joblib
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score

# ─── Must match train_model.py exactly ───────────────────────────────────────
FEATURE_COLS = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs',
    'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal',
]

TARGET_COL = 'target'

DEFAULT_VALUES = {
    'age': 55.0, 'sex': 1.0, 'cp': 0.0, 'trestbps': 120.0,
    'chol': 200.0, 'fbs': 0.0, 'restecg': 0.0, 'thalach': 150.0,
    'exang': 0.0, 'oldpeak': 0.0, 'slope': 1.0, 'ca': 0.0, 'thal': 2.0,
}


# ─────────────────────────────────────────────────────────────────────────────
# DATA LOADING  (mirrors train_model.py)
# ─────────────────────────────────────────────────────────────────────────────

def load_dataset() -> pd.DataFrame:
    """Load heart_clean.csv — columns are already in UCI standard format."""
    paths = [
        '../data/uci_heart_disease_4centers.csv',
        'data/uci_heart_disease_4centers.csv',
        '../data/heart_clean.csv',
        'data/heart_clean.csv',
    ]
    for p in paths:
        if os.path.exists(p):
            print(f'   ✅ Dataset loaded: {p}')
            df = pd.read_csv(p)
            # Normalise column names to lowercase/underscore (safety)
            df.columns = (
                df.columns.astype(str).str.strip().str.lower().str.replace(' ', '_')
            )
            return df
    raise FileNotFoundError('Dataset not found. Expected ../data/heart_clean.csv')


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure all 13 FEATURE_COLS exist with numeric values."""
    X = pd.DataFrame()
    for col in FEATURE_COLS:
        if col in df.columns:
            X[col] = pd.to_numeric(df[col], errors='coerce').fillna(DEFAULT_VALUES[col])
        else:
            print(f'   ⚠️  Column "{col}" missing — using default {DEFAULT_VALUES[col]}')
            X[col] = DEFAULT_VALUES[col]
    return X


# ─────────────────────────────────────────────────────────────────────────────
# PLOT HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _plot_dir() -> str:
    """Return the output directory (one level up, in ml-core root)."""
    d = os.path.join(os.path.dirname(__file__), '..', 'visualization')
    os.makedirs(d, exist_ok=True)
    return d


def plot_confusion_matrix(y_true, y_pred, title='Confusion Matrix', filename='confusion_matrix.png'):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(
        cm, annot=True, fmt='d', cmap='Blues',
        xticklabels=['No Disease', 'Disease'],
        yticklabels=['No Disease', 'Disease'],
    )
    plt.title(title, fontsize=12, fontweight='bold')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.tight_layout()
    path = os.path.join(_plot_dir(), filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f'   📊 Saved: {path}')


def plot_roc_curve(y_true, y_prob, filename='roc_curve.png'):
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    auc = roc_auc_score(y_true, y_prob)
    plt.figure(figsize=(7, 5))
    plt.plot(fpr, tpr, color='steelblue', lw=2, label=f'ROC AUC = {auc:.4f}')
    plt.plot([0, 1], [0, 1], color='gray', linestyle='--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve — Heart Disease Classifier', fontsize=12, fontweight='bold')
    plt.legend(loc='lower right')
    plt.tight_layout()
    path = os.path.join(_plot_dir(), filename)
    plt.savefig(path, dpi=150)
    plt.close()
    print(f'   📊 Saved: {path}')


def plot_feature_importance(pipeline, filename='feature_importance.png'):
    """Plot XGBoost gain-based feature importances from the pipeline."""
    try:
        xgb_model = pipeline[-1]  # last step
        importances = xgb_model.feature_importances_
        fi = (
            pd.Series(importances, index=FEATURE_COLS)
            .sort_values(ascending=True)
        )
        plt.figure(figsize=(8, 6))
        bars = plt.barh(fi.index, fi.values, color='steelblue')
        plt.xlabel('Importance (Gain)')
        plt.title('XGBoost Feature Importances', fontsize=12, fontweight='bold')
        plt.tight_layout()
        path = os.path.join(_plot_dir(), filename)
        plt.savefig(path, dpi=150)
        plt.close()
        print(f'   📊 Saved: {path}')
    except Exception as e:
        print(f'   ⚠️  Could not plot feature importances: {e}')


# ─────────────────────────────────────────────────────────────────────────────
# EVALUATION PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_pipeline():
    print('\n' + '=' * 62)
    print('🩺  HEART DISEASE MODEL EVALUATION')
    print('=' * 62)

    # ── 1. Load model ─────────────────────────────────────────────────────
    print('\n📥 1. Loading Pipeline...')
    pipeline = None
    for p in [
        '../model/heart_disease_model.pkl',
        'model/heart_disease_model.pkl',
        'heart_disease_model.pkl',
    ]:
        if os.path.exists(p):
            pipeline = joblib.load(p)
            print(f'   ✅ Loaded: {p}')
            break

    if pipeline is None:
        print("❌ No model found. Run 'uv run train_model.py' first.")
        return

    # ── 2. Load dataset ───────────────────────────────────────────────────
    print('\n📥 2. Loading Dataset...')
    df = load_dataset()
    print(f'   Rows: {len(df)}  |  Columns: {list(df.columns)}')

    X = prepare_features(df)

    # Target
    if TARGET_COL not in df.columns:
        print(f"❌ Target column '{TARGET_COL}' not found in dataset.")
        return
    y = pd.to_numeric(df[TARGET_COL], errors='coerce').fillna(0)
    y = (y > 0).astype(int)

    print(f'\n   Target distribution:\n{y.value_counts().to_string()}')

    # ── 3. Train / Test Split (same seed as train_model.py) ───────────────
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── 4. Predict ────────────────────────────────────────────────────────
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    # ── 5. Metrics ────────────────────────────────────────────────────────
    acc      = accuracy_score(y_test, y_pred)
    b_acc    = balanced_accuracy_score(y_test, y_pred)
    prec     = precision_score(y_test, y_pred, zero_division=0)
    rec      = recall_score(y_test, y_pred, zero_division=0)
    f1       = f1_score(y_test, y_pred, zero_division=0)
    auc      = roc_auc_score(y_test, y_prob)

    print('\n' + '=' * 62)
    print('📈  EVALUATION RESULTS  (20% Hold-Out Test Set)')
    print('=' * 62)
    print(f'• Accuracy          : {acc   * 100:.2f}%')
    print(f'• Balanced Accuracy : {b_acc * 100:.2f}%')
    print(f'• Precision         : {prec  * 100:.2f}%')
    print(f'• Recall            : {rec   * 100:.2f}%')
    print(f'• F1 Score          : {f1    * 100:.2f}%')
    print(f'• ROC-AUC           : {auc   :.4f}')
    print('=' * 62)

    print('\n📋 Classification Report:')
    print(
        classification_report(
            y_test, y_pred,
            target_names=['No Heart Disease', 'Heart Disease'],
            zero_division=0,
        )
    )

    # ── 6. Cross-Validation ───────────────────────────────────────────────
    print('🔁 5-Fold Cross-Validation (full dataset)...')
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring='accuracy', n_jobs=-1)
    print(f'   CV Accuracy: {cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%')

    # ── 7. Plots ──────────────────────────────────────────────────────────
    print('\n📊 Generating plots...')
    plot_confusion_matrix(
        y_test, y_pred,
        title='Heart Disease Classification — Confusion Matrix',
    )
    plot_roc_curve(y_test, y_prob)
    plot_feature_importance(pipeline)

    print('\n' + '=' * 62)
    print('✅  Evaluation complete.')
    print(f'📐 Features used: {len(FEATURE_COLS)}  |  Test samples: {len(y_test)}')
    print('=' * 62)


if __name__ == '__main__':
    evaluate_pipeline()