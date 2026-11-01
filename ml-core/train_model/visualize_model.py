import joblib
import pandas as pd
import shap
import matplotlib.pyplot as plt
from xgboost import plot_importance

# --------------------------------------------------
# 1. Load model and dataset
# --------------------------------------------------
pipeline = joblib.load("outputs/heart_disease_model.pkl")
df = pd.read_csv("data/heart_clean.csv")

X = df.drop(columns=["target"])

# Last step should be XGBClassifier
xgb_model = pipeline[-1]

# --------------------------------------------------
# 2. Transform the data exactly as the model sees it
# --------------------------------------------------
preprocessor = pipeline[:-1]
X_transformed = preprocessor.transform(X)

# --------------------------------------------------
# 3. Get feature names after preprocessing
# --------------------------------------------------
try:
    feature_names = preprocessor.get_feature_names_out()
except Exception:
    feature_names = [f"feature_{i}" for i in range(X_transformed.shape[1])]

# Convert transformed data to DataFrame
X_transformed_df = pd.DataFrame(
    X_transformed.toarray() if hasattr(X_transformed, "toarray") else X_transformed,
    columns=feature_names,
    index=X.index
)

print("Original features:", X.shape[1])
print("Transformed features:", X_transformed_df.shape[1])
print("\nTransformed feature names:")
print(feature_names)

# --------------------------------------------------
# 4. SHAP Tree Explainer
# --------------------------------------------------
explainer = shap.TreeExplainer(xgb_model)

shap_values = explainer.shap_values(X_transformed_df)

# Handle SHAP versions that return a list
if isinstance(shap_values, list):
    shap_values = shap_values[1]

# --------------------------------------------------
# 5. SHAP Summary - Beeswarm
# --------------------------------------------------
plt.figure(figsize=(12, 8))

shap.summary_plot(
    shap_values,
    X_transformed_df,
    max_display=20,
    show=False
)

plt.title("SHAP Feature Impact on Heart Disease Prediction")
plt.tight_layout()
plt.savefig(
    "outputs/shap_summary_beeswarm.png",
    dpi=300,
    bbox_inches="tight"
)
plt.close()

print("Saved: outputs/shap_summary_beeswarm.png")

# --------------------------------------------------
# 6. SHAP Bar Plot - Global Importance
# --------------------------------------------------
plt.figure(figsize=(12, 8))

shap.summary_plot(
    shap_values,
    X_transformed_df,
    plot_type="bar",
    max_display=20,
    show=False
)

plt.title("Global Feature Importance - SHAP")
plt.tight_layout()
plt.savefig(
    "outputs/shap_summary_bar.png",
    dpi=300,
    bbox_inches="tight"
)
plt.close()

print("Saved: outputs/shap_summary_bar.png")

# --------------------------------------------------
# 7. XGBoost Feature Importance
# --------------------------------------------------
plt.figure(figsize=(12, 8))

plot_importance(
    xgb_model,
    max_num_features=20,
    importance_type="gain"
)

plt.title("XGBoost Feature Importance (Gain)")
plt.tight_layout()
plt.savefig(
    "outputs/xgboost_feature_importance.png",
    dpi=300,
    bbox_inches="tight"
)
plt.close()

print("Saved: outputs/xgboost_feature_importance.png")