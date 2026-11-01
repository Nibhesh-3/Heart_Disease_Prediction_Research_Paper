"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { getApiUrl } from "../../lib/api";
import AppLayout from "../components/AppLayout";
import OnboardingModal from "../components/OnboardingModal";
import RadarVitalsChart from "../components/RadarVitalsChart";
import ShapWaterfallCard from "../components/ShapWaterfallCard";
import AnimatedRiskOrb from "../components/AnimatedRiskOrb";
import VoiceAgent from "../components/VoiceAgent";


interface UserProfile {
    id: number;
    username: string;
    email?: string;
    name?: string;
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

interface RiskTrendData {
    trend: string;
    prediction_codes: number[];
    overall_llm_analysis?: string;
    overall_risk_score?: number;
    overall_risk_percentage?: number;
    latest_risk_score?: number;
    latest_risk_percentage?: number;
    risk_level?: string;
    state_label?: string;
    total_assessments?: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<PatientRecord[]>([]);
    const [riskTrend, setRiskTrend] = useState<RiskTrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.replace("/signin");
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true);
            setError("");
            try {
                // 1. Fetch current user
                const userRes = await fetch(getApiUrl("/users/me"), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!userRes.ok) {
                    if (userRes.status === 401) {
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("refresh_token");
                        router.replace("/signin");
                        return;
                    }
                    throw new Error("Unable to authenticate session.");
                }

                const userData: UserProfile = await userRes.json();
                setUser(userData);

                // 2. Fetch history records
                try {
                    const historyRes = await fetch(getApiUrl("/history"), {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (historyRes.ok) {
                        const historyData: PatientRecord[] = await historyRes.json();
                        setHistory(historyData);
                    }
                } catch {
                    // History is optional if 0 records exist
                }

                // 3. Fetch overall risk trend
                try {
                    const riskRes = await fetch(getApiUrl("/overall-risk"), {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (riskRes.ok) {
                        const riskData: RiskTrendData = await riskRes.json();
                        setRiskTrend(riskData);
                    }
                } catch {
                    // Risk trend optional if 0 records exist
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    const latestRecord = history.length > 0 ? history[0] : null;

    // Authoritative backend-computed overall longitudinal risk (with fallback to latest record)
    const computedPercentage = riskTrend?.overall_risk_percentage !== undefined
        ? riskTrend.overall_risk_percentage
        : !latestRecord
            ? 0
            : latestRecord.risk_score !== undefined && latestRecord.risk_score !== null
                ? Math.round(latestRecord.risk_score * 100)
                : latestRecord.prediction_code === 1
                    ? 74
                    : 14;

    const riskScore = riskTrend?.overall_risk_score !== undefined
        ? riskTrend.overall_risk_score
        : computedPercentage / 100;

    const riskLevel = !latestRecord && riskTrend?.overall_risk_percentage === undefined
        ? { label: "No Assessment", color: "text-neutral-500", stroke: "#9CA3AF", bg: "bg-neutral-50", border: "border-neutral-200", dot: "bg-neutral-400" }
        : riskScore >= 0.7
            ? { label: "High Risk", color: "text-red-600", stroke: "#DC2626", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" }
            : riskScore >= 0.4
                ? { label: "Moderate Risk", color: "text-amber-600", stroke: "#F59E0B", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" }
                : { label: "Low Risk", color: "text-emerald-600", stroke: "#10B981", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" };

    const stateLabel = riskTrend?.state_label || (
        !latestRecord
            ? "NO REPORT YET"
            : computedPercentage <= 30
                ? "OPTIMAL STATE"
                : computedPercentage <= 65
                    ? "MODERATE STATE"
                    : "ELEVATED STATE"
    );

    const dashboardRef = useRef<HTMLDivElement>(null);

    // GSAP Dashboard Stagger Reveal Animation
    useEffect(() => {
        if (!loading && dashboardRef.current) {
            const ctx = gsap.context(() => {
                gsap.fromTo(
                    ".gsap-dash-item",
                    { opacity: 0, y: 20, scale: 0.98 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
                );
            }, dashboardRef);

            return () => ctx.revert();
        }
    }, [loading]);

    return (
        <>
            <OnboardingModal />
            <AppLayout activePage="dashboard">
                <div ref={dashboardRef} className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
                    {/* Header Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight dark:text-white">Clinical Dashboard</h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live Telemetry
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                                Longitudinal AI cardiovascular assessment and real-time biometric metrics.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 self-start sm:self-auto ">
                            <Link href="/healthdata">
                                <button className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-neutral-950 text-white font-semibold text-xs sm:text-sm hover:bg-neutral-800 shadow-sm transition-all cursor-pointer mt-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    New Screening
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
                            <p className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Synthesizing clinical dashboard metrics...</p>
                        </div>
                    ) : (
                        <>
                            {/* ── TOP HERO ROW: CIRCULAR PROGRESS RING & SUMMARY ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* CIRCULAR PROGRESS ORB CARD */}
                                <div className="gsap-dash-item bg-[#F8F9FA] rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col items-center justify-between text-center relative overflow-hidden lg:col-span-1 min-h-[360px] sm:min-h-[390px] dark:bg-black dark:border-neutral-800/80 dark:shadow-none">
                                    {/* Micro-dot grid background pattern overlay */}
                                    <div
                                        className="absolute inset-0 opacity-45 pointer-events-none"
                                        style={{
                                            backgroundImage: "radial-gradient(#9CA3AF 1.2px, transparent 1.2px)",
                                            backgroundSize: "18px 18px",
                                            backgroundPosition: "center center",
                                        }}
                                    />

                                    {/* Top Bar inside Card */}
                                    <div className="w-full flex items-center justify-between relative z-10 mb-2">
                                        <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                                            Telemetry Assessment
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${riskLevel.bg} ${riskLevel.color} border ${riskLevel.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${riskLevel.dot}`}></span>
                                            {riskLevel.label}
                                        </span>
                                    </div>

                                    {/* The Large Soft Spherical Orb / Gauge with GSAP Animation */}
                                    <AnimatedRiskOrb
                                        percentage={computedPercentage}
                                        stateLabel={stateLabel}
                                        riskLevel={riskLevel}
                                    />

                                    {/* Bottom Footer Info */}
                                    <div className="w-full pt-4 border-t border-neutral-200/80 flex items-center justify-between text-[11px] sm:text-xs text-neutral-500 relative z-10 dark:border-neutral-800/80">
                                        <span>Model: <strong className="text-neutral-800 dark:text-neutral-200">XGBoost ML</strong></span>
                                        <span>Status: <strong className="text-neutral-800 dark:text-neutral-200">{history.length} Logged</strong></span>
                                    </div>
                                </div>

                                {/* LONGITUDINAL AI INSIGHT & CLINICAL SUMMARY */}
                                <div className="gsap-dash-item bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col justify-between lg:col-span-2 space-y-6 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                            <div>
                                                <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-white">
                                                    Welcome back, {user?.username || "Patient"}
                                                </h3>
                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                    Longitudinal cardiovascular health assessment &amp; clinical overview.
                                                </p>
                                            </div>
                                            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50">
                                                DeepSeek AI Assistant
                                            </span>
                                        </div>

                                        {riskTrend?.overall_llm_analysis ? (
                                            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 space-y-2 dark:bg-[#1a1a1a] dark:border-neutral-800/80">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                                        Longitudinal Synthesis
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                        Trend: <strong className="text-purple-700 dark:text-purple-400">{riskTrend.trend}</strong>
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed dark:text-neutral-200">
                                                    {riskTrend.overall_llm_analysis}
                                                </p>
                                            </div>
                                        ) : latestRecord?.clinical_guidance ? (
                                            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 space-y-2 dark:bg-[#1a1a1a] dark:border-neutral-800/80">
                                                <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                                                    Latest Screening Guidance
                                                </span>
                                                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed dark:text-neutral-200">
                                                    {latestRecord.clinical_guidance}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 text-center space-y-3 dark:bg-[#1a1a1a] dark:border-neutral-800/80">
                                                <p className="text-xs sm:text-sm text-neutral-600 font-medium dark:text-neutral-400">
                                                    No screening assessments recorded yet. Run your first assessment to calculate your cardiovascular index.
                                                </p>
                                                <Link href="/healthdata">
                                                    <button className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white font-semibold text-xs hover:bg-neutral-800 transition-all cursor-pointer">
                                                        Start Screening Now
                                                    </button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Footnote Bar */}
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-neutral-100 text-center dark:border-neutral-900">
                                        <div className="p-2.5 sm:p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                            <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase">Screenings</p>
                                            <p className="text-base sm:text-lg font-extrabold text-neutral-950 mt-0.5 dark:text-white">{history.length}</p>
                                        </div>
                                        <div className="p-2.5 sm:p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                            <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase">Trend</p>
                                            <p className="text-xs sm:text-sm font-extrabold text-neutral-950 mt-1 truncate dark:text-white">{riskTrend?.trend || "Stable"}</p>
                                        </div>
                                        <div className="p-2.5 sm:p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                            <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase">Patient ID</p>
                                            <p className="text-xs sm:text-sm font-extrabold font-mono text-neutral-950 mt-1 truncate dark:text-white">#AUR-{user?.id || "01"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── 4 KEY VITAL SIGNS METRIC CARDS ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {/* Resting Blood Pressure */}
                                <div className="gsap-dash-item bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Resting BP</p>
                                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-950/30 dark:text-blue-400">
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="mt-3 sm:mt-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white">
                                                {latestRecord?.trestbps ?? 120}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-neutral-500 font-semibold">mmHg</span>
                                        </div>
                                        <span className="inline-block mt-1.5 text-[9px] sm:text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full dark:text-neutral-400 dark:bg-neutral-800">
                                            &lt;120 Normal
                                        </span>
                                    </div>
                                </div>

                                {/* Total Cholesterol */}
                                <div className="gsap-dash-item bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Cholesterol</p>
                                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/30 dark:text-amber-400">
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="mt-3 sm:mt-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white">
                                                {latestRecord?.chol ?? 200}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-neutral-500 font-semibold">mg/dL</span>
                                        </div>
                                        <span className="inline-block mt-1.5 text-[9px] sm:text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full dark:text-neutral-400 dark:bg-neutral-800">
                                            &lt;200 Target
                                        </span>
                                    </div>
                                </div>

                                {/* Max Heart Rate */}
                                <div className="gsap-dash-item bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Max HR</p>
                                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center dark:bg-red-950/30 dark:text-red-400">
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="mt-3 sm:mt-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white">
                                                {latestRecord?.thalach ?? 150}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-neutral-500 font-semibold">BPM</span>
                                        </div>
                                        <span className="inline-block mt-1.5 text-[9px] sm:text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full dark:text-neutral-400 dark:bg-neutral-800">
                                            Reserve OK
                                        </span>
                                    </div>
                                </div>

                                {/* ST Depression */}
                                <div className="gsap-dash-item bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">ST Depr</p>
                                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/30 dark:text-purple-400">
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="mt-3 sm:mt-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white">
                                                {latestRecord?.oldpeak !== undefined ? latestRecord.oldpeak.toFixed(1) : "0.0"}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-neutral-500 font-semibold">ECG</span>
                                        </div>
                                        <span className="inline-block mt-1.5 text-[9px] sm:text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full dark:text-neutral-400 dark:bg-neutral-800">
                                            Perfusion OK
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ── VITALS RADAR CHART ── */}
                            <RadarVitalsChart latestRecord={latestRecord} />

                            {/* ── RECENT ASSESSMENTS & SHAP WATERFALL ROW ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                                {/* RECENT SCREENINGS LOG TABLE */}
                                <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between h-full dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">Recent Screenings</h3>
                                                <p className="text-xs text-neutral-500 mt-0.5">Historical telemetry evaluation outputs</p>
                                            </div>
                                            <Link href="/history" className="text-xs font-bold text-neutral-900 hover:underline dark:text-neutral-100">
                                                View all &rarr;
                                            </Link>
                                        </div>

                                        {history.length > 0 ? (
                                            <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 mt-4">
                                                <table className="w-full text-left text-xs min-w-[480px]">
                                                    <thead>
                                                        <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider dark:border-neutral-800">
                                                            <th className="pb-3">Assessment ID</th>
                                                            <th className="pb-3">Vitals (BP / Chol)</th>
                                                            <th className="pb-3">Max HR</th>
                                                            <th className="pb-3">Diagnosis</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                        {history.slice(0, 4).map((record, idx) => (
                                                            <tr key={record.id || idx} className="hover:bg-[#F8F9FA] transition-colors dark:hover:bg-[#252525]">
                                                                <td className="py-3.5 font-bold text-neutral-900 dark:text-neutral-100">
                                                                    #AUR-{record.id}
                                                                </td>
                                                                <td className="py-3.5 text-neutral-600 dark:text-neutral-400">
                                                                    {record.trestbps || 120} mmHg / {record.chol || 200} mg/dL
                                                                </td>
                                                                <td className="py-3.5 text-neutral-600 font-medium dark:text-neutral-400">
                                                                    {record.thalach || 150} BPM
                                                                </td>
                                                                <td className="py-3.5">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${record.prediction_code === 1
                                                                        ? "bg-red-50 text-red-600 border-red-200"
                                                                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                                        }`}>
                                                                        {record.prediction_code === 1 ? "Positive Risk" : "Negative Risk"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-xs text-neutral-400">
                                                No previous diagnostic screenings found.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* AI RISK DRIVERS — SHAP WATERFALL */}
                                <div className="lg:col-span-1 flex flex-col h-full gap-4">
                                    <ShapWaterfallCard latestRecord={latestRecord} className="h-full flex-1" />

                                    {/* QUICK ACTIONS LAUNCHPAD (Visible on mobile/tablet, hidden on desktop site view where sidebar is present) */}
                                    <div className="lg:hidden bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col space-y-3 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                        <div>
                                            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">Quick Actions</h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">Direct navigation</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Link href="/healthdata">
                                                <div className="p-3 bg-[#F8F9FA] hover:bg-[#F0F0F0] rounded-2xl border border-neutral-200/60 transition-all cursor-pointer flex items-center justify-between group dark:bg-[#1a1a1a] dark:hover:bg-[#2a2a2a] dark:border-neutral-800/60 mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </span>
                                                        <p className="text-xs font-bold text-neutral-900 group-hover:text-black dark:text-neutral-100">New Screening</p>
                                                    </div>
                                                    <span className="text-neutral-400 group-hover:translate-x-1 transition-transform text-sm">&rarr;</span>
                                                </div>
                                            </Link>
                                            <Link href="/analysis">
                                                <div className="p-3 bg-[#F8F9FA] hover:bg-[#F0F0F0] rounded-2xl border border-neutral-200/60 transition-all cursor-pointer flex items-center justify-between group dark:bg-[#1a1a1a] dark:hover:bg-[#2a2a2a] dark:border-neutral-800/60 mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                            </svg>
                                                        </span>
                                                        <p className="text-xs font-bold text-neutral-900 group-hover:text-black dark:text-neutral-100">Full SHAP Analysis</p>
                                                    </div>
                                                    <span className="text-neutral-400 group-hover:translate-x-1 transition-transform text-sm">&rarr;</span>
                                                </div>
                                            </Link>
                                            <Link href="/history">
                                                <div className="p-3 bg-[#F8F9FA] hover:bg-[#F0F0F0] rounded-2xl border border-neutral-200/60 transition-all cursor-pointer flex items-center justify-between group dark:bg-[#1a1a1a] dark:hover:bg-[#2a2a2a] dark:border-neutral-800/60 mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0zM9 12h6m-6 4h4" />
                                                            </svg>
                                                        </span>
                                                        <p className="text-xs font-bold text-neutral-900 group-hover:text-black dark:text-neutral-100">View All History</p>
                                                    </div>
                                                    <span className="text-neutral-400 group-hover:translate-x-1 transition-transform text-sm">&rarr;</span>
                                                </div>
                                            </Link>
                                            <Link href="/profile">
                                                <div className="p-3 bg-[#F8F9FA] hover:bg-[#F0F0F0] rounded-2xl border border-neutral-200/60 transition-all cursor-pointer flex items-center justify-between group dark:bg-[#1a1a1a] dark:hover:bg-[#2a2a2a] dark:border-neutral-800/60 mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </span>
                                                        <p className="text-xs font-bold text-neutral-900 group-hover:text-black dark:text-neutral-100">Patient Profile</p>
                                                    </div>
                                                    <span className="text-neutral-400 group-hover:translate-x-1 transition-transform text-sm">&rarr;</span>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </AppLayout>
            {/* ── Aura Voice Agent (floating) ── */}
            <VoiceAgent
                patientContext={riskTrend ? {
                    overall_risk_percentage: riskTrend.overall_risk_percentage,
                    risk_level: riskTrend.risk_level,
                    overall_llm_analysis: riskTrend.overall_llm_analysis,
                    total_assessments: riskTrend.total_assessments,
                    trend: riskTrend.trend,
                } : undefined}
            />
        </>
    );
}
