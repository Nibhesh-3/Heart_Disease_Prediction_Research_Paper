"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { getApiUrl } from "../../lib/api";
import AppLayout from "../components/AppLayout";

interface UserProfile {
    id: number;
    username: string;
    email?: string;
    name?: string;
}

interface AssessmentRecord {
    id: number;
    age?: number;
    sex?: number;
    prediction_code?: number;
    clinical_guidance?: string;
    trestbps?: number;
    chol?: number;
    thalach?: number;
    oldpeak?: number;
}

interface RiskTrendData {
    trend: string;
    prediction_codes: number[];
    overall_llm_analysis?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<AssessmentRecord[]>([]);
    const [riskTrend, setRiskTrend] = useState<RiskTrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "settings" | "security">("overview");

    // Account deletion modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Preferences Form State
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [aiExplanations, setAiExplanations] = useState(true);
    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState("");

    const tabContentRef = useRef<HTMLDivElement>(null);

    // GSAP Tab Transition
    useEffect(() => {
        if (tabContentRef.current) {
            gsap.fromTo(
                tabContentRef.current,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
            );
        }
    }, [activeTab]);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.replace("/signin");
            return;
        }

        const fetchProfileData = async () => {
            setLoading(true);
            setError("");

            const cachedUser = localStorage.getItem("auralis_user_profile");
            if (cachedUser) {
                try {
                    const parsed = JSON.parse(cachedUser);
                    setUser(parsed);
                    setNewUsername(parsed.username || "");
                    setNewEmail(parsed.email || "");
                } catch {
                    // Ignore parse error
                }
            }

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
                    throw new Error("Unable to fetch user profile.");
                }

                const userData: UserProfile = await userRes.json();
                setUser(userData);
                setNewUsername(userData.username || "");
                setNewEmail(userData.email || "");

                // 2. Fetch history records
                try {
                    const historyRes = await fetch(getApiUrl("/history"), {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (historyRes.ok) {
                        const historyData: AssessmentRecord[] = await historyRes.json();
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
                setError(err instanceof Error ? err.message : "Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [router]);

    const handleSavePreferences = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError("");
        
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(getApiUrl("/users/me"), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    email: newEmail.trim() || undefined,
                    username: newUsername.trim() || undefined,
                })
            });
            
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || "Failed to update profile settings.");
            }
            
            const updatedUser = await res.json();
            setUser(updatedUser);
            localStorage.setItem("auralis_user_profile", JSON.stringify(updatedUser));
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            setSaveError("");
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : "Error updating preferences");
        }
    };

    const handleExportData = () => {
        const payload = {
            user: user,
            history: history,
            riskTrend: riskTrend,
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Auralis_Profile_Export_${user?.username || "patient"}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
            setDeleteError("Please type DELETE to confirm.");
            return;
        }

        setIsDeleting(true);
        setDeleteError("");

        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(getApiUrl("/delete"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to delete account.");
            }

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            router.push("/signup");
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : "An error occurred during account deletion.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSignout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auralis_user_profile");
        router.push("/signin");
    };

    const latestRiskCode = history.length > 0 ? history[0].prediction_code : null;

    return (
        <AppLayout activePage="profile">
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight dark:text-white">Patient Profile</h1>
                            <span className="bg-neutral-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                Diagnostic ID #{user?.id || "--"}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                            Manage telemetry credentials, clinical preferences, and risk record exports.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                        <Link href="/healthdata">
                            <button className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-neutral-950 text-white font-semibold text-xs hover:bg-neutral-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer dark:bg-white dark:text-neutral-900">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                New Assessment
                            </button>
                        </Link>
                        <button
                            onClick={handleExportData}
                            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-800 font-semibold text-xs hover:bg-neutral-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer dark:bg-[#161616] dark:border-neutral-700 dark:text-neutral-200 dark:shadow-none"
                        >
                            <svg className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                        <button
                            onClick={handleSignout}
                            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-semibold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
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
                        <p className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Loading profile data...</p>
                    </div>
                ) : (
                    <>
                        {/* Profile Overview Hero Banner */}
                        <div className="rounded-3xl bg-white p-5 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-950 text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-md shrink-0">
                                    {user?.username ? user.username.substring(0, 2).toUpperCase() : "AH"}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-white">{user?.username || "Authenticated User"}</h2>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                                        {user?.email || `${user?.username || "user"}@auralis.health`}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-neutral-400 mt-1">
                                        Engine: <span className="text-neutral-700 font-semibold dark:text-neutral-300">XGBoost &amp; DeepSeek AI</span>
                                    </p>
                                </div>
                            </div>

                            {/* Tab Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto scrollbar-none">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "overview"
                                        ? "bg-neutral-950 text-white shadow-xs"
                                        : "bg-[#F5F5F5] text-neutral-600 hover:bg-neutral-200"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("settings")}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "settings"
                                        ? "bg-neutral-950 text-white shadow-xs"
                                        : "bg-[#F5F5F5] text-neutral-600 hover:bg-neutral-200"
                                        }`}
                                >
                                    Preferences
                                </button>
                                <button
                                    onClick={() => setActiveTab("security")}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === "security"
                                        ? "bg-neutral-950 text-white shadow-xs"
                                        : "bg-[#F5F5F5] text-neutral-600 hover:bg-neutral-200"
                                        }`}
                                >
                                    Security
                                </button>
                            </div>
                        </div>

                        {/* Key Diagnostic Metric Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Screenings</p>
                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="mt-2 sm:mt-3">
                                    <p className="text-2xl sm:text-3xl font-extrabold text-neutral-950 dark:text-white">{history.length}</p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Total logged</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</p>
                                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${latestRiskCode === 1 ? "bg-red-50 text-red-600" : latestRiskCode === 0 ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-600"
                                        }`}>
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="mt-2 sm:mt-3">
                                    <p className="text-base sm:text-lg font-extrabold text-neutral-950 truncate dark:text-white">
                                        {latestRiskCode === 1 ? "Positive Risk" : latestRiskCode === 0 ? "Negative Risk" : "No Tests"}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Latest test</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">Trend</p>
                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="mt-2 sm:mt-3">
                                    <p className="text-base sm:text-lg font-extrabold text-neutral-950 truncate dark:text-white">
                                        {riskTrend?.trend || (history.length > 0 ? "Stable" : "N/A")}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Direction</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">AI Assistant</p>
                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="mt-2 sm:mt-3">
                                    <p className="text-base sm:text-lg font-extrabold text-neutral-950 dark:text-white">Active</p>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">DeepSeek Core</p>
                                </div>
                            </div>
                        </div>

                        {/* TABS CONTENT */}
                        <div ref={tabContentRef}>
                            {/* TAB 1: CLINICAL OVERVIEW */}
                            {activeTab === "overview" && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Patient Information */}
                                    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs space-y-4 lg:col-span-1 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">Patient Credentials</h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">Account identity &amp; database verification</p>
                                        </div>

                                        <div className="space-y-3 text-xs sm:text-sm">
                                            <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                <span className="block text-[10px] font-bold text-neutral-400 uppercase">Username</span>
                                                <span className="font-semibold text-neutral-900 mt-0.5 block dark:text-neutral-100">{user?.username}</span>
                                            </div>

                                            <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                <span className="block text-[10px] font-bold text-neutral-400 uppercase">Email Address</span>
                                                <span className="font-semibold text-neutral-900 mt-0.5 block dark:text-neutral-100">{user?.email || "Not specified"}</span>
                                            </div>

                                            <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                <span className="block text-[10px] font-bold text-neutral-400 uppercase">Patient ID</span>
                                                <span className="font-mono text-xs font-bold text-neutral-900 mt-0.5 block dark:text-neutral-100">#AUR-{user?.id ? String(user.id).padStart(5, "0") : "00000"}</span>
                                            </div>

                                            <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                <span className="block text-[10px] font-bold text-neutral-400 uppercase">Diagnostic Tier</span>
                                                <span className="font-semibold text-neutral-900 mt-0.5 block dark:text-neutral-100">Full Clinical Telemetry</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Longitudinal AI Guidance & Recent Activity */}
                                    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs space-y-6 lg:col-span-2 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">Longitudinal Clinical Assessment</h3>
                                                <p className="text-xs text-neutral-500 mt-0.5">AI analysis synthesized across screening events</p>
                                            </div>
                                            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50">
                                                DeepSeek AI
                                            </span>
                                        </div>

                                        {riskTrend?.overall_llm_analysis ? (
                                            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 space-y-2 dark:bg-[#1a1a1a] dark:border-neutral-800/80">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider">Synthesis Summary</span>
                                                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Trend: <strong className="text-purple-700 dark:text-purple-400">{riskTrend.trend}</strong></span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal dark:text-neutral-200">
                                                    {riskTrend.overall_llm_analysis}
                                                </p>
                                            </div>
                                        ) : history.length > 0 && history[0].clinical_guidance ? (
                                            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 space-y-2 dark:bg-[#1a1a1a] dark:border-neutral-800/80">
                                                <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider block">Latest Assessment Guidance</span>
                                                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal dark:text-neutral-200">
                                                    {history[0].clinical_guidance}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 text-xs text-neutral-400 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                                No screening data logged yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: PREFERENCES */}
                            {activeTab === "settings" && (
                                <div className="bg-white rounded-3xl p-5 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">Diagnostic &amp; Telemetry Preferences</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">Customize analysis granularity and notification triggers</p>
                                    </div>

                                    {saveSuccess && (
                                        <div className="p-3.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/50">
                                            Preferences updated successfully!
                                        </div>
                                    )}

                                    {saveError && (
                                        <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-2xl dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50">
                                            {saveError}
                                        </div>
                                    )}

                                    <form onSubmit={handleSavePreferences} className="space-y-4">
                                        <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                            <label className="block text-xs sm:text-sm font-bold text-neutral-950 dark:text-white mb-2">
                                                Custom Username
                                            </label>
                                            <input
                                                type="text"
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                placeholder="Choose custom username"
                                                className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-medium outline-none focus:border-neutral-950 transition-colors dark:bg-[#161616] dark:border-neutral-700 dark:text-white dark:focus:border-neutral-400"
                                            />
                                            <p className="text-[10px] sm:text-xs text-neutral-500 mt-2">Unique handle used to sign in and identify clinical records (3-30 characters).</p>
                                        </div>

                                        <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                            <label className="block text-xs sm:text-sm font-bold text-neutral-950 dark:text-white mb-2">
                                                Update Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                placeholder="Enter new email address"
                                                className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-medium outline-none focus:border-neutral-950 transition-colors dark:bg-[#161616] dark:border-neutral-700 dark:text-white dark:focus:border-neutral-400"
                                            />
                                            <p className="text-[10px] sm:text-xs text-neutral-500 mt-2">This address is used for telemetry summaries and password resets.</p>
                                        </div>

                                        <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 flex items-center justify-between dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-white">Email Telemetry Summaries</h4>
                                                <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Receive PDF diagnostic reports directly via email</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={emailAlerts}
                                                onChange={(e) => setEmailAlerts(e.target.checked)}
                                                className="w-4 h-4 accent-neutral-950 cursor-pointer"
                                            />
                                        </div>

                                        <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-neutral-200/60 flex items-center justify-between dark:bg-[#1a1a1a] dark:border-neutral-800/60">
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-white">DeepSeek AI Syntheses</h4>
                                                <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Include deep clinical interpretations on each test</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={aiExplanations}
                                                onChange={(e) => setAiExplanations(e.target.checked)}
                                                className="w-4 h-4 accent-neutral-950 cursor-pointer"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 rounded-xl bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer dark:shadow-none"
                                        >
                                            Save Preferences
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* TAB 3: SECURITY & DANGER ZONE */}
                            {activeTab === "security" && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-neutral-200/80 shadow-xs space-y-4 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                        <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">Export Medical Records</h3>
                                        <p className="text-xs text-neutral-500">
                                            Download your complete patient telemetry history in structured JSON format.
                                        </p>
                                        <button
                                            onClick={handleExportData}
                                            className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs transition-colors cursor-pointer dark:bg-neutral-800 dark:text-neutral-100"
                                        >
                                            Download JSON
                                        </button>
                                    </div>

                                    {/* Danger Zone: Account Deletion */}
                                    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-red-200 shadow-xs space-y-4 dark:bg-[#161616] dark:border-red-900/50 dark:shadow-none">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                                            <h3 className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
                                        </div>
                                        <p className="text-xs text-neutral-600 leading-relaxed dark:text-neutral-400">
                                            Permanently delete your Auralis Health profile. This will instantly wipe all your cardiovascular assessment records, SHAP feature metrics, and account credentials. This action is irreversible.
                                        </p>

                                        <div>
                                            <button
                                                onClick={() => {
                                                    setDeleteConfirmationText("");
                                                    setDeleteError("");
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-xs cursor-pointer dark:shadow-none"
                                            >
                                                Delete Account &amp; All Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── DELETE ACCOUNT CONFIRMATION MODAL ── */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-neutral-200 shadow-2xl space-y-5 dark:bg-[#161616] dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-lg font-extrabold">Confirm Deletion</h3>
                            </div>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="text-neutral-400 hover:text-neutral-600 text-lg font-bold p-1 cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed dark:text-neutral-400">
                            Are you absolutely sure? All <span className="font-bold text-neutral-950 dark:text-white">{history.length} assessment records</span> for <span className="font-bold text-neutral-950 dark:text-white">{user?.username}</span> will be permanently removed.
                        </p>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider dark:text-neutral-300">
                                Type <span className="text-red-600 font-extrabold dark:text-red-400">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmationText}
                                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm font-bold text-neutral-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            />
                        </div>

                        {deleteError && (
                            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="w-1/2 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 font-bold text-xs hover:bg-neutral-200 transition-colors cursor-pointer dark:bg-neutral-800 dark:text-neutral-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || deleteConfirmationText.trim().toUpperCase() !== "DELETE"}
                                className="w-1/2 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 disabled:opacity-40 transition-colors shadow-xs cursor-pointer dark:shadow-none"
                            >
                                {isDeleting ? "Deleting..." : "Permanently Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
