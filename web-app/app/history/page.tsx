"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "../../lib/api";
import AppLayout from "../components/AppLayout";

interface PatientRecord {
    id: number;
    user_id?: number;
    name?: string;
    age?: number;
    sex?: number;
    cp?: number;
    trestbps?: number;
    chol?: number;
    fbs?: number;
    restecg?: number;
    thalach?: number;
    exang?: number;
    oldpeak?: number;
    slope?: number;
    ca?: number;
    thal?: number;
    prediction_code?: number;
    risk_score?: number;
    prediction?: string;
    clinical_guidance?: string;
}

interface RiskTrendData {
    trend: string;
    prediction_codes: number[];
    overall_llm_analysis?: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<PatientRecord[]>([]);
    const [riskTrend, setRiskTrend] = useState<RiskTrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [pdfError, setPdfError] = useState("");

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<"all" | "positive" | "negative">("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "bp" | "chol">("newest");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.replace("/signin");
            return;
        }

        const fetchHistoryData = async () => {
            setLoading(true);
            setError("");
            try {
                // 1. Fetch History records
                const res = await fetch(getApiUrl("/history"), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data: PatientRecord[] = await res.json();
                    setHistory(data);
                } else if (res.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    router.replace("/signin");
                    return;
                } else if (res.status === 404) {
                    setHistory([]);
                } else {
                    throw new Error("Unable to retrieve diagnostic history.");
                }

                // 2. Fetch Overall Risk Trend
                try {
                    const trendRes = await fetch(getApiUrl("/overall-risk"), {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (trendRes.ok) {
                        const trendData: RiskTrendData = await trendRes.json();
                        setRiskTrend(trendData);
                    }
                } catch {
                    // Trend is optional
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load history.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistoryData();
    }, [router]);

    // Download PDF for a specific record
    const handleDownloadPdf = async (record: PatientRecord) => {
        setIsDownloadingPdf(true);
        setPdfError("");

        try {
            const token = localStorage.getItem("access_token");
            const payload = {
                age: Number(record.age ?? 55),
                sex: Number(record.sex ?? 1),
                cp: Number(record.cp ?? 0),
                trestbps: Number(record.trestbps ?? 120),
                chol: Number(record.chol ?? 200),
                fbs: Number(record.fbs ?? 0),
                restecg: Number(record.restecg ?? 0),
                thalach: Number(record.thalach ?? 150),
                exang: Number(record.exang ?? 0),
                oldpeak: Number(record.oldpeak ?? 0.0),
                slope: Number(record.slope ?? 1),
                ca: Number(record.ca ?? 0),
                thal: Number(record.thal ?? 2),
            };

            const response = await fetch(getApiUrl("/pdfcreate"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to generate PDF report from server.");
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `Auralis_Heart_Report_Assessment_${record.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err: unknown) {
            setPdfError(err instanceof Error ? err.message : "Error downloading PDF.");
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    // Export entire history as CSV
    const handleExportCSV = () => {
        if (history.length === 0) return;

        const headers = ["ID", "Age", "Sex", "RestingBP", "Cholesterol", "MaxHR", "ChestPain", "RestingECG", "Oldpeak", "Diagnosis"];
        const rows = history.map((r) => [
            r.id,
            r.age ?? "",
            r.sex === 1 ? "Male" : "Female",
            r.trestbps ?? "",
            r.chol ?? "",
            r.thalach ?? "",
            r.cp ?? "",
            r.restecg ?? "",
            r.oldpeak ?? "",
            r.prediction_code === 1 ? "Positive Risk" : "Negative Risk",
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `auralis_assessment_history_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // Filter & Sort Logic
    const filteredHistory = history
        .filter((record) => {
            if (filterCategory === "positive" && record.prediction_code !== 1) return false;
            if (filterCategory === "negative" && record.prediction_code !== 0) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const idMatch = String(record.id).includes(q);
                const guidanceMatch = (record.clinical_guidance || "").toLowerCase().includes(q);
                const ageMatch = String(record.age || "").includes(q);
                return idMatch || guidanceMatch || ageMatch;
            }

            return true;
        })
        .sort((a, b) => {
            if (sortBy === "newest") return (b.id || 0) - (a.id || 0);
            if (sortBy === "oldest") return (a.id || 0) - (b.id || 0);
            if (sortBy === "bp") return (b.trestbps || 0) - (a.trestbps || 0);
            if (sortBy === "chol") return (b.chol || 0) - (a.chol || 0);
            return 0;
        });

    const positiveCount = history.filter((r) => r.prediction_code === 1).length;
    const negativeCount = history.filter((r) => r.prediction_code === 0).length;

    // Helper formatting functions
    const getChestPainLabel = (cp?: number) => {
        switch (cp) {
            case 0: return "Typical Angina (0)";
            case 1: return "Atypical Angina (1)";
            case 2: return "Non-Anginal Pain (2)";
            case 3: return "Asymptomatic (3)";
            default: return "Unknown";
        }
    };

    const getRestEcgLabel = (ecg?: number) => {
        switch (ecg) {
            case 0: return "Normal (0)";
            case 1: return "ST-T Wave Abnormality (1)";
            case 2: return "Left Ventricular Hypertrophy (2)";
            default: return "Unknown";
        }
    };

    const getThalLabel = (thal?: number) => {
        switch (thal) {
            case 1: return "Normal (1)";
            case 2: return "Fixed Defect (2)";
            case 3: return "Reversible Defect (3)";
            default: return "Unknown";
        }
    };

    return (
        <AppLayout activePage="history">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight dark:text-white">Diagnostic History</h1>
                            <span className="bg-neutral-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {history.length} Evaluations
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                            Complete timeline of physiological measurements, XGBoost risk predictions &amp; AI findings.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <button
                            onClick={handleExportCSV}
                            disabled={history.length === 0}
                            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-800 font-semibold text-xs hover:bg-neutral-50 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2 cursor-pointer dark:bg-[#161616] dark:border-neutral-700 dark:text-neutral-200 dark:shadow-none"
                        >
                            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export CSV
                        </button>
                        <Link href="/healthdata">
                            <button className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-neutral-950 text-white font-semibold text-xs hover:bg-neutral-800 transition-colors shadow-xs flex items-center gap-2 cursor-pointer dark:shadow-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                New Assessment
                            </button>
                        </Link>
                    </div>
                </div>

                {pdfError && (
                    <div className="p-4 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50">
                        {pdfError}
                    </div>
                )}

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
                        <p className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Loading diagnostic history...</p>
                    </div>
                ) : (
                    <>
                        {/* ── SUMMARY KPI STATS ROW ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Tests</p>
                                <div className="mt-2 sm:mt-3">
                                    <p className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white">{history.length}</p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Sessions logged</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Positive Risk</p>
                                <div className="mt-2 sm:mt-3">
                                    <p className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400">{positiveCount}</p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">High/elevated</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Negative Risk</p>
                                <div className="mt-2 sm:mt-3">
                                    <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{negativeCount}</p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Low/optimal</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Overall Trend</p>
                                <div className="mt-2 sm:mt-3">
                                    <p className="text-lg sm:text-xl font-extrabold text-neutral-950 truncate dark:text-white">
                                        {riskTrend?.trend || (history.length > 0 ? "Risk Stable" : "No Tests")}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Direction</p>
                                </div>
                            </div>
                        </div>

                        {/* ── SEARCH, FILTER & SORT BAR ── */}
                        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                            {/* Search input */}
                            <div className="w-full md:w-72 relative">
                                <input
                                    type="text"
                                    placeholder="Search ID, notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-neutral-300 bg-[#F8F9FA] pl-9 pr-3.5 py-2 sm:py-2.5 text-xs text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#1a1a1a] dark:text-neutral-100"
                                />
                                <svg className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 sm:top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Filter buttons - horizontally scrollable on small mobile */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                                <button
                                    onClick={() => setFilterCategory("all")}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${filterCategory === "all"
                                        ? "bg-neutral-950 text-white shadow-xs"
                                        : "bg-[#F5F5F5] text-neutral-600 hover:bg-neutral-200"
                                        }`}
                                >
                                    All ({history.length})
                                </button>
                                <button
                                    onClick={() => setFilterCategory("positive")}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${filterCategory === "positive"
                                        ? "bg-red-600 text-white shadow-xs"
                                        : "bg-red-50 text-red-700 hover:bg-red-100"
                                        }`}
                                >
                                    Positive ({positiveCount})
                                </button>
                                <button
                                    onClick={() => setFilterCategory("negative")}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${filterCategory === "negative"
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        }`}
                                >
                                    Negative ({negativeCount})
                                </button>
                            </div>

                            {/* Sort dropdown */}
                            <div className="flex items-center justify-end gap-2 text-xs">
                                <span className="font-bold text-neutral-400 uppercase text-[11px]">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "bp" | "chol")}
                                    className="rounded-xl border border-neutral-300 bg-[#F8F9FA] px-2.5 py-1.5 text-xs text-neutral-900 focus:border-neutral-900 outline-none cursor-pointer dark:border-neutral-700 dark:bg-[#1a1a1a] dark:text-neutral-100"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="bp">Highest BP</option>
                                    <option value="chol">Highest Cholesterol</option>
                                </select>
                            </div>
                        </div>

                        {/* ── HISTORY CARDS LIST ── */}
                        {filteredHistory.length > 0 ? (
                            <div className="space-y-4">
                                {filteredHistory.map((record) => {
                                    const isPositive = record.prediction_code === 1;
                                    const recordPercentage = record.risk_score !== undefined && record.risk_score !== null
                                        ? Math.round(record.risk_score * 100)
                                        : isPositive ? 74 : 14;

                                    return (
                                        <div
                                            key={record.id}
                                            className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs hover:shadow-md transition-all space-y-4 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-100 dark:border-neutral-900">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-10 h-10 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-bold text-xs font-mono shrink-0">
                                                        #{record.id}
                                                    </span>
                                                    <div>
                                                        <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                                                            Assessment #{record.id}
                                                        </h3>
                                                        <p className="text-[11px] text-neutral-400">
                                                            Age {record.age || 55} &bull; {record.sex === 1 ? "Male" : "Female"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                                    <span className="text-sm font-extrabold text-neutral-950 bg-neutral-100 px-3 py-1 rounded-xl dark:text-white dark:bg-neutral-800">
                                                        {recordPercentage}% Risk
                                                    </span>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase border ${isPositive
                                                        ? "bg-red-50 text-red-600 border-red-200"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                        }`}>
                                                        {isPositive ? "Positive Risk" : "Negative Risk"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Key Metrics Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Resting BP</span>
                                                    <span className="text-sm font-bold text-neutral-950 mt-0.5 block dark:text-white">{record.trestbps || 120} mmHg</span>
                                                </div>
                                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Cholesterol</span>
                                                    <span className="text-sm font-bold text-neutral-950 mt-0.5 block dark:text-white">{record.chol || 200} mg/dL</span>
                                                </div>
                                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Max HR</span>
                                                    <span className="text-sm font-bold text-neutral-950 mt-0.5 block dark:text-white">{record.thalach || 150} BPM</span>
                                                </div>
                                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">ST Depr</span>
                                                    <span className="text-sm font-bold text-neutral-950 mt-0.5 block dark:text-white">{record.oldpeak !== undefined ? record.oldpeak.toFixed(1) : "0.0"} mm</span>
                                                </div>
                                            </div>

                                            {/* AI Guidance snippet */}
                                            {record.clinical_guidance && (
                                                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed bg-[#F8F9FA] p-3.5 rounded-2xl border border-neutral-200/60 dark:text-neutral-400 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                    <strong className="text-neutral-800 font-semibold dark:text-neutral-200">Guidance: </strong>
                                                    {record.clinical_guidance}
                                                </p>
                                            )}

                                            {/* Card Action Buttons */}
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer dark:bg-neutral-800 dark:text-neutral-100"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View All 13 Biomarkers
                                                </button>

                                                <button
                                                    onClick={() => handleDownloadPdf(record)}
                                                    disabled={isDownloadingPdf}
                                                    className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 dark:shadow-none"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download PDF Report
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-neutral-200/80 space-y-4 dark:bg-[#161616] dark:border-neutral-800/80">
                                <p className="text-sm text-neutral-600 font-medium dark:text-neutral-400">
                                    No assessments match your current filters.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterCategory("all");
                                    }}
                                    className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 transition-colors cursor-pointer dark:bg-neutral-800 dark:text-neutral-200"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── DETAILED 13-BIOMARKER MODAL DRAWER ── */}
            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
                    <div
                        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
                        onClick={() => setSelectedRecord(null)}
                    />

                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto p-5 sm:p-8 space-y-6 dark:bg-[#161616]">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg sm:text-xl font-extrabold text-neutral-950 dark:text-white">
                                        Assessment Details #{selectedRecord.id}
                                    </h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${selectedRecord.prediction_code === 1
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        }`}>
                                        {selectedRecord.prediction_code === 1 ? "Positive Risk" : "Negative Risk"}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Complete 13-feature physiological telemetry breakdown.
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer dark:hover:bg-neutral-800"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* All 13 Features Grid */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                13 UCI Clinical Features
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Age</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{selectedRecord.age || 55} Years</span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Sex</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{selectedRecord.sex === 1 ? "Male" : "Female"}</span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Resting BP</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{selectedRecord.trestbps || 120} mmHg</span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Serum Cholesterol</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{selectedRecord.chol || 200} mg/dL</span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Chest Pain Type</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{getChestPainLabel(selectedRecord.cp)}</span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Max Heart Rate</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{selectedRecord.thalach || 150} BPM</span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Fasting Blood Sugar</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">
                                        {selectedRecord.fbs === 1 ? "> 120 mg/dL" : "≤ 120 mg/dL (Normal)"}
                                    </span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Resting ECG</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{getRestEcgLabel(selectedRecord.restecg)}</span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Exercise Induced Angina</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">
                                        {selectedRecord.exang === 1 ? "Yes (Positive)" : "No (Negative)"}
                                    </span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">ST Depression</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">
                                        {selectedRecord.oldpeak !== undefined ? selectedRecord.oldpeak.toFixed(1) : "0.0"} mm
                                    </span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">ST Slope</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">
                                        {selectedRecord.slope === 0 ? "Upsloping (0)" : selectedRecord.slope === 1 ? "Flat (1)" : "Downsloping (2)"}
                                    </span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Major Vessels (CA)</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{selectedRecord.ca ?? 0}</span>
                                </div>

                                <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/70 sm:col-span-3 dark:bg-[#1a1a1a]">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">Thalassemia</span>
                                    <span className="font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">{getThalLabel(selectedRecord.thal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Full Clinical Guidance */}
                        {selectedRecord.clinical_guidance && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                    DeepSeek AI Clinical Synthesis
                                </h4>
                                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal dark:bg-[#1a1a1a] dark:border-neutral-800/80 dark:text-neutral-200">
                                    {selectedRecord.clinical_guidance}
                                </div>
                            </div>
                        )}

                        {/* Modal Footer Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors cursor-pointer text-center dark:bg-neutral-800 dark:text-neutral-300"
                            >
                                Close
                            </button>

                            <button
                                onClick={() => handleDownloadPdf(selectedRecord)}
                                disabled={isDownloadingPdf}
                                className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer dark:shadow-none"
                            >
                                {isDownloadingPdf ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Generating PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>Download PDF Report</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
