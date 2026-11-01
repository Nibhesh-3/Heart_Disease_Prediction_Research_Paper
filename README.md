# 🫀 AI-Powered Cardio Care Prediction System

**A robust, full-stack cardiovascular risk assessment platform providing early detection, clinical guidance, and Explainable AI (XAI) insights.**

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-00a393.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-React-black.svg)](https://nextjs.org/)
[![Expo](https://img.shields.io/badge/Expo-React_Native-black.svg)](https://expo.dev/)

---

## 🎯 System Overview

This project implements a comprehensive heart disease prediction platform spanning a responsive web application, a native mobile app, and a machine learning backend. 

*   **Machine Learning Engine**: Powered by Scikit-Learn, generating accurate predictions based on patient vitals.
*   **Explainable AI (XAI)**: Integrated with SHAP (`TreeExplainer` & `KernelExplainer`) to break down model decisions, providing localized per-feature importances for maximum transparency and clinical trust.
*   **Dual-Platform Frontends**: A Next.js web application and an Expo (React Native) mobile application, both communicating with the central API gateway.
*   **PDF Reporting**: Generates detailed, downloadable clinical risk assessment reports.

---

## ✨ Key Features

*   **Accurate Disease Prediction**: ML-driven pipeline to assess cardiovascular risk levels.
*   **Transparent Insights**: Visual feature importance charts to show *why* a prediction was made.
*   **Cross-Platform Experience**: Seamlessly switch between the web dashboard and mobile app with synchronized patient history.
*   **Patient History Tracking**: Securely store and review past health data and prediction outcomes.
*   **Secure Authentication**: JWT-based authentication system safeguarding patient records.

---

## 🏗️ System Architecture

```text
       [ User Frontends ]                 [ API Gateway ]                 [ Prediction Engine ]
      
+-------------------------+             +---------------+            +---------------------------+
|    Web App (Next.js)    | <---------> |               | <--------> |  Scikit-Learn ML Models   |
+-------------------------+             |    FastAPI    |            +---------------------------+
| Mobile App (React Native| <---------> |    Backend    | <--------> | SHAP Explainable AI (XAI) |
+-------------------------+             +---------------+            +---------------------------+
                                                ^
                                                |
                                        +---------------+
                                        |  PostgreSQL/  |
                                        |    SQLite     |
                                        +---------------+
                                        [   Database  ]
```

---

## 🚀 Technology Stack

### Backend (`back-end/`)
*   **Framework**: FastAPI
*   **ML & Data Processing**: Scikit-Learn, Pandas, NumPy, XGBoost
*   **Explainable AI**: SHAP
*   **Database**: SQLAlchemy (PostgreSQL / SQLite)
*   **PDF Generation**: ReportLab
*   **Auth**: Authlib, passlib, python-jose

### Web Frontend (`web-app/`)
*   **Framework**: Next.js (React)
*   **Styling**: Tailwind CSS
*   **Routing**: App Router

### Mobile Frontend (`my-app/`)
*   **Framework**: React Native / Expo
*   **Routing**: Expo Router
*   **Styling**: NativeWind / Tailwind

---

## 🔧 Installation & Setup

### 1. Backend Setup

```bash
cd back-end

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*API will be available at: `http://localhost:8000`*

### 2. Web Application Setup

```bash
cd web-app

# Install dependencies
npm install

# Run the development server
npm run dev
```
*Web app will be available at: `http://localhost:3000`*

### 3. Mobile Application Setup

```bash
cd my-app

# Install dependencies
npm install

# Start the Expo Metro Bundler
npx expo start
```
*Use the Expo Go app on your phone to scan the QR code and run the mobile app locally.*

---

## 🔄 Core API Endpoints

*   **`POST /predict`**: Takes 13 clinical features and returns the risk score and probability of heart disease.
*   **`POST /feature-importances`**: Returns local per-patient SHAP explanations with clinical context to drive the frontend visualizations.
*   **`GET /history`**: Retrieves all past prediction records for the authenticated user.
*   **`POST /pdfcreate`**: Generates a downloadable PDF medical report summarizing the risk assessment.
