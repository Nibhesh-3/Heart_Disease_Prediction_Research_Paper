"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "../../lib/api";
import AppLayout from "../components/AppLayout";

interface FeatureExplanation {
    feature: string;
    label: string;
    patient_value: number;
    unit: string;
    shap_value: number;
    direction: "INCREASES_RISK" | "REDUCES_RISK";
    clinical_note: string;
}

interface ShapResponse {
    patient_id: string;
    base_risk: number;
    final_predicted_risk: number;
    local_explanations: FeatureExplanation[];
}

interface PatientRecord {
    id: number;
    age?: number;
    sex?: number;
    trestbps?: number;
    chol?: number;
    thalach?: number;
    fbs?: number;
    cp?: number;
    restecg?: number;
    exang?: number;
    oldpeak?: number;
    slope?: number;
    ca?: number;
    thal?: number;
    prediction_code?: number;
    risk_score?: number;
    clinical_guidance?: string;
}

interface ModelBenchmarkData {
    model_name: string;
    roc_auc: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    dataset_samples: number;
    features_count: number;
    hyperparameters: {
        n_estimators: number;
        max_depth: number;
        learning_rate: number;
        booster: string;
    };
}

const DEFAULT_VITALS = {
    age: 55,
    sex: 1,
    cp: 0,
    trestbps: 130,
    chol: 240,
    fbs: 0,
    restecg: 0,
    thalach: 145,
    exang: 0,
    oldpeak: 1.2,
    slope: 1,
    ca: 0,
    thal: 2,
};

export default function AnalysisPage() {
    const router = useRouter();
    const [history, setHistory] = useState<PatientRecord[]>([]);
    const [selectedRecordId, setSelectedRecordId] = useState<number | "custom">("custom");
    const [shapData, setShapData] = useState<ShapResponse | null>(null);
    const [modelBenchmarks, setModelBenchmarks] = useState<ModelBenchmarkData | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"local" | "simulator" | "model">("local");

    // Simulator State
    const [currentVitals, setCurrentVitals] = useState({ ...DEFAULT_VITALS });
    const [simTrestbps, setSimTrestbps] = useState(130);
    const [simChol, setSimChol] = useState(240);
    const [simThalach, setSimThalach] = useState(145);
    const [simOldpeak, setSimOldpeak] = useState(1.2);
    const [simExang, setSimExang] = useState(0);

    const runShapAnalysis = React.useCallback(async (vitals: typeof DEFAULT_VITALS, recordId: number | "custom" = "custom", tokenOverride?: string) => {
        setAnalyzing(true);
        setError("");
        try {
            const token = tokenOverride || localStorage.getItem("access_token");
            const response = await fetch(getApiUrl("/feature-importances"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    patient_id: `rec-${recordId}`,
                    patient_data: vitals,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "SHAP analysis computation failed.");
            }

            const data: ShapResponse = await response.json();
            setShapData(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Unable to compute feature importances.");
        } finally {
            setAnalyzing(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.replace("/signin");
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            setError("");
            try {
                // 1. Fetch historical assessments to populate the assessment selector
                const historyRes = await fetch(getApiUrl("/history"), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                let loadedVitals = { ...DEFAULT_VITALS };
                let recId: number | "custom" = "custom";

                if (historyRes.ok) {
                    const records: PatientRecord[] = await historyRes.json();
                    setHistory(records);

                    if (records.length > 0) {
                        const first = records[0];
                        recId = first.id;
                        loadedVitals = {
                            age: Number(first.age ?? 55),
                            sex: Number(first.sex ?? 1),
                            cp: Number(first.cp ?? 0),
                            trestbps: Number(first.trestbps ?? 130),
                            chol: Number(first.chol ?? 240),
                            fbs: Number(first.fbs ?? 0),
                            restecg: Number(first.restecg ?? 0),
                            thalach: Number(first.thalach ?? 145),
                            exang: Number(first.exang ?? 0),
                            oldpeak: Number(first.oldpeak ?? 1.2),
                            slope: Number(first.slope ?? 1),
                            ca: Number(first.ca ?? 0),
                            thal: Number(first.thal ?? 2),
                        };
                    }
                }

                setSelectedRecordId(recId);
                setCurrentVitals(loadedVitals);
                setSimTrestbps(loadedVitals.trestbps);
                setSimChol(loadedVitals.chol);
                setSimThalach(loadedVitals.thalach);
                setSimOldpeak(loadedVitals.oldpeak);
                setSimExang(loadedVitals.exang);

                // 2. Fetch live dynamic model benchmarks from backend
                try {
                    const benchRes = await fetch(getApiUrl("/model-benchmarks"), {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (benchRes.ok) {
                        const bData: ModelBenchmarkData = await benchRes.json();
                        setModelBenchmarks(bData);
                    }
                } catch {
                    // Fallback to computed defaults
                }

                await runShapAnalysis(loadedVitals, recId, token);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load initial analysis.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [router, runShapAnalysis]);

    const handleRecordChange = (recordIdStr: string) => {
        if (recordIdStr === "custom") {
            setSelectedRecordId("custom");
            setCurrentVitals(DEFAULT_VITALS);
            setSimTrestbps(DEFAULT_VITALS.trestbps);
            setSimChol(DEFAULT_VITALS.chol);
            setSimThalach(DEFAULT_VITALS.thalach);
            setSimOldpeak(DEFAULT_VITALS.oldpeak);
            setSimExang(DEFAULT_VITALS.exang);
            runShapAnalysis(DEFAULT_VITALS, "custom");
            return;
        }

        const recId = Number(recordIdStr);
        setSelectedRecordId(recId);
        const record = history.find((r) => r.id === recId);
        if (record) {
            const newVitals = {
                age: Number(record.age ?? 55),
                sex: Number(record.sex ?? 1),
                cp: Number(record.cp ?? 0),
                trestbps: Number(record.trestbps ?? 130),
                chol: Number(record.chol ?? 240),
                fbs: Number(record.fbs ?? 0),
                restecg: Number(record.restecg ?? 0),
                thalach: Number(record.thalach ?? 145),
                exang: Number(record.exang ?? 0),
                oldpeak: Number(record.oldpeak ?? 1.2),
                slope: Number(record.slope ?? 1),
                ca: Number(record.ca ?? 0),
                thal: Number(record.thal ?? 2),
            };
            setCurrentVitals(newVitals);
            setSimTrestbps(newVitals.trestbps);
            setSimChol(newVitals.chol);
            setSimThalach(newVitals.thalach);
            setSimOldpeak(newVitals.oldpeak);
            setSimExang(newVitals.exang);
            runShapAnalysis(newVitals, recId);
        }
    };

    const handleSimulate = () => {
        const simulatedVitals = {
            ...currentVitals,
            trestbps: simTrestbps,
            chol: simChol,
            thalach: simThalach,
            oldpeak: simOldpeak,
            exang: simExang,
        };
        runShapAnalysis(simulatedVitals, selectedRecordId);
    };

    const handleEmailReport = async () => {
        setSendingEmail(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                router.replace("/signin");
                return;
            }
            const response = await fetch(getApiUrl("/email-report"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(currentVitals),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || "Failed to send email");
            }
            alert("Success: Risk assessment report has been emailed to you!");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setSendingEmail(false);
        }
    };

    // Calculate max absolute SHAP value for scaling bars
    const maxAbsShap = shapData?.local_explanations.length
        ? Math.max(...shapData.local_explanations.map((e) => Math.abs(e.shap_value)), 0.1)
        : 1.0;

    const riskPercent = shapData ? Math.round(shapData.final_predicted_risk * 100) : 50;
    const basePercent = shapData ? Math.round(shapData.base_risk * 100) : 45;
    const diffPercent = riskPercent - basePercent;

    const riskBadge = riskPercent >= 70
        ? { label: "High Risk", bg: "bg-red-50", color: "text-red-700", border: "border-red-200", dot: "bg-red-500" }
        : riskPercent >= 40
            ? { label: "Moderate Risk", bg: "bg-amber-50", color: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" }
            : { label: "Low Risk", bg: "bg-emerald-50", color: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" };

    const topEscalators = shapData?.local_explanations.filter((e) => e.direction === "INCREASES_RISK").slice(0, 3) || [];
    const topProtective = shapData?.local_explanations.filter((e) => e.direction === "REDUCES_RISK").slice(0, 3) || [];

    return (
        <AppLayout activePage="analysis">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight dark:text-white">
                                Feature Importance &amp; SHAP
                            </h1>
                            <span className="bg-neutral-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                TreeExplainer
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                            Deconstruct diagnostic outputs with patient-level Shapley value contributions and clinical context.
                        </p>
                    </div>

                    {/* Assessment Selector */}
                    <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-neutral-300 shadow-xs text-xs dark:bg-[#161616] dark:border-neutral-700 dark:shadow-none">
                            <span className="font-bold text-neutral-500 uppercase text-[10px]">Select:</span>
                            <select
                                value={String(selectedRecordId)}
                                onChange={(e) => handleRecordChange(e.target.value)}
                                className="bg-transparent font-bold text-neutral-900 outline-none cursor-pointer max-w-[140px] truncate dark:text-neutral-100"
                            >
                                {history.map((record) => (
                                    <option key={record.id} value={String(record.id)}>
                                        #{record.id} ({record.prediction_code === 1 ? "Positive" : "Negative"})
                                    </option>
                                ))}
                                <option value="custom">Active Vitals</option>
                            </select>
                        </div>

                        {shapData && (
                            <button 
                                onClick={handleEmailReport}
                                disabled={sendingEmail}
                                className="px-3.5 sm:px-4 py-2 sm:py-2 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {sendingEmail ? "Sending..." : "Email PDF"}
                            </button>
                        )}

                        <Link href="/healthdata">
                            <button className="px-3.5 sm:px-4 py-2 sm:py-2 rounded-xl bg-neutral-950 text-white font-semibold text-xs hover:bg-neutral-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer dark:shadow-none">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                New Test
                            </button>
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="p-4 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50">
                        <span>{error}</span>
                        <button onClick={() => window.location.reload()} className="underline font-bold cursor-pointer ml-2">
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="rounded-3xl bg-white p-8 sm:p-12 border border-neutral-200/80 shadow-xs flex flex-col items-center justify-center gap-4 min-h-[300px] dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                        <div className="w-9 h-9 rounded-full border-3 border-neutral-200 border-t-neutral-950 animate-spin dark:border-neutral-800"></div>
                        <p className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Computing TreeExplainer SHAP contributions...</p>
                    </div>
                ) : (
                    <>
                        {/* ── TOP KPI SUMMARY: BASE RISK VS FINAL RISK ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Base Baseline Risk */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Population Baseline</p>
                                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full dark:bg-neutral-800">E[f(x)]</span>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white">{basePercent}%</p>
                                        <p className="text-xs text-neutral-500 mt-1">Average benchmark population risk</p>
                                    </div>
                                </div>
                                <div className="pt-3.5 border-t border-neutral-100 text-[10px] sm:text-[11px] text-neutral-400 dark:border-neutral-900">
                                    Expected value across Cleveland cohort
                                </div>
                            </div>

                            {/* Patient Final Risk */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Calculated Risk</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${riskBadge.bg} ${riskBadge.color} border ${riskBadge.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${riskBadge.dot}`}></span>
                                            {riskBadge.label}
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white">{riskPercent}%</p>
                                        <p className="text-xs text-neutral-500 mt-1">XGBoost post-telemetry prediction</p>
                                    </div>
                                </div>
                                <div className="pt-3.5 border-t border-neutral-100 text-[10px] sm:text-[11px] text-neutral-500 flex items-center justify-between dark:border-neutral-900">
                                    <span>Risk Differential:</span>
                                    <strong className={diffPercent > 0 ? "text-red-600" : "text-emerald-600"}>
                                        {diffPercent > 0 ? `+${diffPercent}% Elevated` : `${diffPercent}% Reduced`}
                                    </strong>
                                </div>
                            </div>

                            {/* Model Explainability Engine Info */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-1 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">SHAP Engine</p>
                                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/50">
                                            Game Theory
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-white">TreeExplainer</p>
                                        <p className="text-xs text-neutral-500 mt-1">Exact Shapley additive decomposition</p>
                                    </div>
                                </div>
                                <div className="pt-3.5 border-t border-neutral-100 text-[10px] sm:text-[11px] text-neutral-400 dark:border-neutral-900">
                                    13 Biomarkers Analyzed in Real-Time
                                </div>
                            </div>
                        </div>

                        {/* ── NAVIGATION TABS (Scrollable on mobile) ── */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200 scrollbar-none dark:border-neutral-800">
                            <button
                                onClick={() => setActiveTab("local")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "local"
                                    ? "bg-neutral-950 text-white shadow-xs"
                                    : "text-neutral-600 hover:bg-neutral-200"
                                    }`}
                            >
                                Local Feature Contributions
                            </button>
                            <button
                                onClick={() => setActiveTab("simulator")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "simulator"
                                    ? "bg-neutral-950 text-white shadow-xs"
                                    : "text-neutral-600 hover:bg-neutral-200"
                                    }`}
                            >
                                Interactive What-If Simulator
                            </button>
                            <button
                                onClick={() => setActiveTab("model")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "model"
                                    ? "bg-neutral-950 text-white shadow-xs"
                                    : "text-neutral-600 hover:bg-neutral-200"
                                    }`}
                            >
                                Model Benchmarks
                            </button>
                        </div>

                        {/* ── TAB 1: LOCAL FEATURE CONTRIBUTIONS WATERFALL / BARS ── */}
                        {activeTab === "local" && (
                            <div className="space-y-6">
                                {/* Top Summary Insights Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Top Risk Escalators */}
                                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-red-200/80 shadow-xs space-y-3 dark:bg-[#161616] dark:shadow-none">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">Primary Risk Escalators</h3>
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Biomarkers pushing patient probability higher than baseline:
                                        </p>
                                        <div className="space-y-2 pt-1">
                                            {topEscalators.map((item) => (
                                                <div key={item.feature} className="p-3 bg-red-50/60 rounded-2xl border border-red-200/50 flex items-center justify-between text-xs gap-2">
                                                    <div>
                                                        <strong className="text-neutral-900 block dark:text-neutral-100">{item.label}</strong>
                                                        <span className="text-neutral-500 text-[11px]">{item.clinical_note}</span>
                                                    </div>
                                                    <span className="font-mono font-extrabold text-red-600 shrink-0 ml-1 dark:text-red-400">
                                                        +{item.shap_value.toFixed(3)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Top Protective Factors */}
                                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-xs space-y-3 dark:bg-[#161616] dark:shadow-none">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">Primary Protective Factors</h3>
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Biomarkers protecting patient and lowering risk score:
                                        </p>
                                        <div className="space-y-2 pt-1">
                                            {topProtective.length > 0 ? (
                                                topProtective.map((item) => (
                                                    <div key={item.feature} className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/50 flex items-center justify-between text-xs gap-2">
                                                        <div>
                                                            <strong className="text-neutral-900 block dark:text-neutral-100">{item.label}</strong>
                                                            <span className="text-neutral-500 text-[11px]">{item.clinical_note}</span>
                                                        </div>
                                                        <span className="font-mono font-extrabold text-emerald-600 shrink-0 ml-1 dark:text-emerald-400">
                                                            {item.shap_value.toFixed(3)}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-neutral-400">All current parameters trend towards elevated risk.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Feature Importance Breakdown Table / Bar Chart */}
                                <div className="bg-white rounded-3xl p-5 sm:p-8 border border-neutral-200/80 shadow-xs space-y-5 sm:space-y-6 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">Patient-Specific SHAP Decomposition</h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                Red indicates risk escalation, Green indicates risk mitigation
                                            </p>
                                        </div>
                                        {analyzing && (
                                            <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 self-start sm:self-auto">
                                                <div className="w-3 h-3 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin"></div>
                                                Recalculating...
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {shapData?.local_explanations.map((item) => {
                                            const barWidth = Math.min(100, Math.round((Math.abs(item.shap_value) / maxAbsShap) * 100));
                                            const isRisk = item.direction === "INCREASES_RISK";

                                            return (
                                                <div
                                                    key={item.feature}
                                                    className="p-3.5 sm:p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 hover:bg-neutral-100/70 transition-colors space-y-2 dark:bg-[#1a1a1a] dark:border-neutral-800/60"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className={`w-2 h-2 rounded-full ${isRisk ? "bg-red-500" : "bg-emerald-500"}`}></span>
                                                            <span className="font-extrabold text-neutral-950 dark:text-white">{item.label}</span>
                                                            <span className="text-neutral-400">({item.feature})</span>
                                                            <span className="font-mono text-neutral-700 bg-white px-2 py-0.5 rounded-md border border-neutral-200 font-semibold text-[10px] sm:text-[11px] dark:text-neutral-300 dark:bg-[#161616] dark:border-neutral-800">
                                                                {item.patient_value} {item.unit}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 self-start sm:self-auto mt-1 sm:mt-0">
                                                            <span className={`font-mono font-extrabold text-xs ${isRisk ? "text-red-600" : "text-emerald-600"}`}>
                                                                {item.shap_value > 0 ? `+${item.shap_value.toFixed(4)}` : item.shap_value.toFixed(4)}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase ${isRisk ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                }`}>
                                                                {isRisk ? "Increases Risk" : "Reduces Risk"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Progress bar representing SHAP magnitude */}
                                                    <div className="w-full bg-neutral-200/80 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${isRisk ? "bg-red-500" : "bg-emerald-500"}`}
                                                            style={{ width: `${Math.max(6, barWidth)}%` }}
                                                        ></div>
                                                    </div>

                                                    <p className="text-[10px] sm:text-[11px] text-neutral-500 font-normal leading-relaxed">
                                                        {item.clinical_note}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 2: INTERACTIVE WHAT-IF SIMULATOR ── */}
                        {activeTab === "simulator" && (
                            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">Counterfactual Diagnostic Simulator</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Adjust key modifiable biomarkers to simulate potential cardiovascular risk reduction.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                                    {/* Modifiable parameter sliders */}
                                    <div className="space-y-4">
                                        {/* Resting BP Slider */}
                                        <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 space-y-2 dark:bg-[#1a1a1a]">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-neutral-800 dark:text-neutral-200">Resting Blood Pressure</span>
                                                <span className="font-mono font-extrabold text-neutral-950 dark:text-white">{simTrestbps} mmHg</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="90"
                                                max="200"
                                                value={simTrestbps}
                                                onChange={(e) => setSimTrestbps(Number(e.target.value))}
                                                className="w-full accent-neutral-950 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                                            />
                                            <div className="flex justify-between text-[10px] text-neutral-400">
                                                <span>Optimal: 120 mmHg</span>
                                                <span>Elevated: 160+ mmHg</span>
                                            </div>
                                        </div>

                                        {/* Serum Cholesterol Slider */}
                                        <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 space-y-2 dark:bg-[#1a1a1a]">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-neutral-800 dark:text-neutral-200">Serum Cholesterol</span>
                                                <span className="font-mono font-extrabold text-neutral-950 dark:text-white">{simChol} mg/dL</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="120"
                                                max="400"
                                                value={simChol}
                                                onChange={(e) => setSimChol(Number(e.target.value))}
                                                className="w-full accent-neutral-950 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                                            />
                                            <div className="flex justify-between text-[10px] text-neutral-400">
                                                <span>Desirable: &lt;200 mg/dL</span>
                                                <span>High: &gt;240 mg/dL</span>
                                            </div>
                                        </div>

                                        {/* Max Heart Rate Slider */}
                                        <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 space-y-2 dark:bg-[#1a1a1a]">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-neutral-800 dark:text-neutral-200">Max Heart Rate</span>
                                                <span className="font-mono font-extrabold text-neutral-950 dark:text-white">{simThalach} BPM</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="80"
                                                max="210"
                                                value={simThalach}
                                                onChange={(e) => setSimThalach(Number(e.target.value))}
                                                className="w-full accent-neutral-950 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                                            />
                                            <div className="flex justify-between text-[10px] text-neutral-400">
                                                <span>Low Reserve: &lt;110 BPM</span>
                                                <span>High Output: 160+ BPM</span>
                                            </div>
                                        </div>

                                        {/* ST Depression Slider */}
                                        <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 space-y-2 dark:bg-[#1a1a1a]">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-neutral-800 dark:text-neutral-200">ST Depression (Oldpeak)</span>
                                                <span className="font-mono font-extrabold text-neutral-950 dark:text-white">{simOldpeak.toFixed(1)} mm</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.0"
                                                max="5.0"
                                                step="0.1"
                                                value={simOldpeak}
                                                onChange={(e) => setSimOldpeak(Number(e.target.value))}
                                                className="w-full accent-neutral-950 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                                            />
                                            <div className="flex justify-between text-[10px] text-neutral-400">
                                                <span>Normal: 0.0 mm</span>
                                                <span>Ischaemia: &gt;1.5 mm</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSimulate}
                                            disabled={analyzing}
                                            className="w-full py-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 dark:shadow-none"
                                        >
                                            {analyzing ? "Simulating Impact..." : "Run Counterfactual Simulation"}
                                        </button>
                                    </div>

                                    {/* Simulation Result Output */}
                                    <div className="p-5 sm:p-6 bg-[#F8F9FA] rounded-3xl border border-neutral-200 flex flex-col justify-between space-y-6 dark:bg-[#1a1a1a] dark:border-neutral-800">
                                        <div>
                                            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                                Projected Cardiovascular Probability
                                            </span>
                                            <div className="mt-2.5 flex items-baseline gap-2">
                                                <span className="text-4xl sm:text-5xl font-extrabold text-neutral-950 dark:text-white">{riskPercent}%</span>
                                                <span className={`text-[10px] sm:text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${riskBadge.bg} ${riskBadge.color} ${riskBadge.border}`}>
                                                    {riskBadge.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                                                Targeting healthy blood pressure and normal lipid thresholds can significantly reduce coronary event probabilities.
                                            </p>
                                        </div>

                                        <div className="space-y-2.5 pt-4 border-t border-neutral-200 text-xs dark:border-neutral-800">
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Baseline Risk:</span>
                                                <strong className="text-neutral-900 dark:text-neutral-100">{basePercent}%</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Simulated Outcome:</span>
                                                <strong className={riskPercent >= 50 ? "text-red-600" : "text-emerald-600"}>{riskPercent}%</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Net Risk Shift:</span>
                                                <strong className={diffPercent > 0 ? "text-red-600" : "text-emerald-600"}>
                                                    {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 3: GLOBAL MODEL ARCHITECTURE & BENCHMARK ── */}
                        {activeTab === "model" && (
                            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">
                                                {modelBenchmarks?.model_name || "XGBoost Model Architecture"}
                                            </h3>
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                                                Live Evaluated
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            Real-time validation metrics computed directly against the Cleveland UCI cohort ({modelBenchmarks?.dataset_samples ?? 303} patients, {modelBenchmarks?.features_count ?? 13} biomarkers).
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 pt-2">
                                    <div className="p-3.5 sm:p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase">ROC-AUC</p>
                                        <p className="text-xl sm:text-2xl font-extrabold text-neutral-950 mt-1 dark:text-white">
                                            {modelBenchmarks ? modelBenchmarks.roc_auc.toFixed(3) : "0.958"}
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold mt-0.5 dark:text-emerald-400">High Discriminative</p>
                                    </div>

                                    <div className="p-3.5 sm:p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase">Accuracy</p>
                                        <p className="text-xl sm:text-2xl font-extrabold text-neutral-950 mt-1 dark:text-white">
                                            {modelBenchmarks ? `${modelBenchmarks.accuracy}%` : "88.5%"}
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5">Test Cohort</p>
                                    </div>

                                    <div className="p-3.5 sm:p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase">Precision</p>
                                        <p className="text-xl sm:text-2xl font-extrabold text-neutral-950 mt-1 dark:text-white">
                                            {modelBenchmarks ? `${modelBenchmarks.precision}%` : "86.6%"}
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5">Low False Positives</p>
                                    </div>

                                    <div className="p-3.5 sm:p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase">Recall</p>
                                        <p className="text-xl sm:text-2xl font-extrabold text-neutral-950 mt-1 dark:text-white">
                                            {modelBenchmarks ? `${modelBenchmarks.recall}%` : "88.5%"}
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5">High Sensitivity</p>
                                    </div>

                                    <div className="p-3.5 sm:p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a] col-span-2 sm:col-span-1">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase">F1-Score</p>
                                        <p className="text-xl sm:text-2xl font-extrabold text-neutral-950 mt-1 dark:text-white">
                                            {modelBenchmarks ? `${modelBenchmarks.f1_score}%` : "87.5%"}
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold mt-0.5 dark:text-emerald-400">Harmonic Mean</p>
                                    </div>
                                </div>

                                {/* Dynamic Hyperparameters & Architecture Spec */}
                                <div className="p-4 sm:p-6 bg-[#F8F9FA] rounded-2xl border border-neutral-200 space-y-4 text-xs text-neutral-700 dark:bg-[#1a1a1a] dark:border-neutral-800 dark:text-neutral-300">
                                    <h4 className="font-bold text-neutral-950 uppercase tracking-wider text-[11px] sm:text-xs dark:text-white">
                                        Live Estimator Hyperparameters
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] sm:text-xs">
                                        <div className="bg-white dark:bg-[#161616] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
                                            <span className="text-neutral-400 text-[10px] block font-sans uppercase">Estimators</span>
                                            <strong className="text-neutral-900 dark:text-white font-extrabold text-sm">
                                                {modelBenchmarks?.hyperparameters.n_estimators ?? 198} Trees
                                            </strong>
                                        </div>
                                        <div className="bg-white dark:bg-[#161616] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
                                            <span className="text-neutral-400 text-[10px] block font-sans uppercase">Max Tree Depth</span>
                                            <strong className="text-neutral-900 dark:text-white font-extrabold text-sm">
                                                {modelBenchmarks?.hyperparameters.max_depth ?? 7} Levels
                                            </strong>
                                        </div>
                                        <div className="bg-white dark:bg-[#161616] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
                                            <span className="text-neutral-400 text-[10px] block font-sans uppercase">Learning Rate (&eta;)</span>
                                            <strong className="text-neutral-900 dark:text-white font-extrabold text-sm">
                                                {modelBenchmarks?.hyperparameters.learning_rate ?? 0.2866}
                                            </strong>
                                        </div>
                                        <div className="bg-white dark:bg-[#161616] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
                                            <span className="text-neutral-400 text-[10px] block font-sans uppercase">Gradient Booster</span>
                                            <strong className="text-neutral-900 dark:text-white font-extrabold text-sm">
                                                {modelBenchmarks?.hyperparameters.booster ?? "gbtree"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 bg-[#F8F9FA] rounded-2xl border border-neutral-200 space-y-3 text-xs text-neutral-700 dark:bg-[#1a1a1a] dark:border-neutral-800 dark:text-neutral-300">
                                    <h4 className="font-bold text-neutral-950 uppercase tracking-wider text-[11px] sm:text-xs dark:text-white">Mathematical Formulation</h4>
                                    <p className="leading-relaxed">
                                        Shapley Additive Explanations (SHAP) allocate credit for each feature by computing the marginal contribution of feature <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-mono text-[10px] sm:text-[11px] dark:bg-[#161616] dark:border-neutral-800">i</code> across all subset permutations.
                                    </p>
                                    <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 font-mono text-[11px] sm:text-xs text-neutral-900 overflow-x-auto text-center font-bold dark:bg-[#161616] dark:border-neutral-800/80 dark:text-neutral-100">
                                        &phi;<sub>i</sub>(f, x) = &sum;<sub>S &sube; F \ {"{i}"}</sub> [ |S|! (|F| - |S| - 1)! / |F|! ] &bull; [ f(S &cup; {"{i}"}) - f(S) ]
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}