"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "auralis_onboarding_done";

const STEPS = [
    {
        icon: (
            <svg className="w-10 h-10 text-neutral-900 dark:text-neutral-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        label: "WELCOME",
        title: "Welcome to Auralis Health",
        description:
            "Your personal cardiovascular AI. Auralis uses an XGBoost machine learning model trained on clinical data to predict your heart disease risk — and explains exactly why, in plain language.",
    },
    {
        icon: (
            <svg className="w-10 h-10 text-neutral-900 dark:text-neutral-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        label: "RISK SCORE",
        title: "Understanding Your Risk Score",
        description:
            "Your risk score is a percentage calculated by the ML model. Below 30% is low risk (green), 30–70% is moderate (amber), and above 70% is high risk (red). The score updates every time you run a new screening.",
        visual: (
            <div className="flex items-center justify-center gap-4 mt-4">
                {[
                    { pct: "14%", label: "Low Risk", bg: "bg-emerald-50", border: "border-emerald-200", color: "text-emerald-700", dot: "bg-emerald-500" },
                    { pct: "52%", label: "Moderate", bg: "bg-amber-50", border: "border-amber-200", color: "text-amber-700", dot: "bg-amber-500" },
                    { pct: "81%", label: "High Risk", bg: "bg-red-50", border: "border-red-200", color: "text-red-700", dot: "bg-red-500" },
                ].map((item) => (
                    <div key={item.label} className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border ${item.bg} ${item.border}`}>
                        <span className={`text-xl font-black ${item.color}`}>{item.pct}</span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold ${item.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        icon: (
            <svg className="w-10 h-10 text-neutral-900 dark:text-neutral-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        label: "BIOMARKERS",
        title: "Your 13 Clinical Biomarkers",
        description:
            "Each screening records 13 physiological measurements. These are the same inputs cardiologists use for risk stratification.",
        visual: (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {[
                    "Age & Sex", "Chest Pain Type", "Resting BP", "Cholesterol",
                    "Fasting Blood Sugar", "ECG Result", "Max Heart Rate",
                    "Exercise Angina", "ST Depression", "ST Slope",
                    "Major Vessels", "Thalassemia", "Oldpeak",
                ].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 rounded-xl text-[10px] font-bold text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                        {item}
                    </span>
                ))}
            </div>
        ),
    },
    {
        icon: (
            <svg className="w-10 h-10 text-neutral-900 dark:text-neutral-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        label: "AI INSIGHTS",
        title: "Powered by DeepSeek AI & SHAP",
        description:
            "After each screening, DeepSeek AI writes a personalized 2-sentence clinical interpretation. SHAP (SHapley Additive exPlanations) shows you exactly which biomarkers pushed your risk up or down — and by how much.",
        visual: (
            <div className="mt-4 space-y-2">
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-800 font-medium leading-relaxed dark:bg-purple-950/30 dark:border-purple-900/50">
                    <span className="font-bold block text-[10px] text-purple-500 uppercase tracking-wider mb-1">DeepSeek AI Example</span>
                    "Your elevated cholesterol and resting BP are the primary contributors to your 74% risk score. Immediate lifestyle intervention is strongly advised."
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 p-2.5 rounded-xl bg-red-50 border border-red-200 text-[10px] font-bold text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
                        ↑ Chol: +0.41 risk
                    </div>
                    <div className="flex-1 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400">
                        ↓ Max HR: -0.18 risk
                    </div>
                </div>
            </div>
        ),
    },
    {
        icon: (
            <svg className="w-10 h-10 text-neutral-900 dark:text-neutral-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
            </svg>
        ),
        label: "GET STARTED",
        title: "You're Ready!",
        description:
            "Run your first screening in under 2 minutes. The more screenings you log, the more personalized your longitudinal trend analysis becomes.",
        isLast: true,
    },
];

export default function OnboardingModal() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done) {
            // Slight delay for mount animation
            const t = setTimeout(() => setVisible(true), 600);
            return () => clearTimeout(t);
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        setVisible(false);
    };

    const goToStep = (next: number) => {
        if (animating) return;
        setAnimating(true);
        setTimeout(() => {
            setStep(next);
            setAnimating(false);
        }, 200);
    };

    const current = STEPS[step];

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(6px)" }}
        >
            <div
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 sm:p-9 flex flex-col gap-5 dark:bg-[#161616]"
                style={{
                    animation: "onboarding-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
            >
                {/* Close */}
                <button
                    onClick={dismiss}
                    className="absolute top-5 right-5 w-8 h-8 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 flex items-center justify-center transition-colors dark:hover:bg-neutral-800"
                    aria-label="Close onboarding"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Step badge */}
                <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 w-fit dark:bg-neutral-800 dark:border-neutral-800"
                    style={{ transition: "opacity 0.2s", opacity: animating ? 0 : 1 }}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{current.label}</span>
                </div>

                {/* Icon + Title */}
                <div
                    className="flex flex-col gap-3"
                    style={{ transition: "opacity 0.2s, transform 0.2s", opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "translateY(0)" }}
                >
                    <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center dark:bg-neutral-900 dark:border-neutral-800">
                        {current.icon}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 leading-tight dark:text-white">{current.title}</h2>
                    <p className="text-sm text-neutral-600 leading-relaxed dark:text-neutral-400">{current.description}</p>
                    {"visual" in current && current.visual}
                </div>

                {/* Step dots */}
                <div className="flex items-center justify-center gap-2 py-1">
                    {STEPS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToStep(i)}
                            className={`rounded-full transition-all duration-300 ${i === step
                                ? "w-5 h-2 bg-neutral-900"
                                : "w-2 h-2 bg-neutral-300 hover:bg-neutral-500"
                            }`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => goToStep(step - 1)}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer dark:text-neutral-300 dark:bg-neutral-800"
                        >
                            Back
                        </button>
                    )}
                    {"isLast" in current && current.isLast ? (
                        <Link href="/healthdata" onClick={dismiss} className="flex-1">
                            <button className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-sm font-bold hover:bg-neutral-800 transition-colors cursor-pointer shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Start First Screening
                            </button>
                        </Link>
                    ) : (
                        <button
                            onClick={() => goToStep(step + 1)}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-sm font-bold hover:bg-neutral-800 transition-colors cursor-pointer shadow-sm"
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                <button onClick={dismiss} className="text-[11px] text-neutral-400 hover:text-neutral-600 text-center transition-colors cursor-pointer">
                    Skip onboarding
                </button>
            </div>

            <style>{`
                @keyframes onboarding-in {
                    0%  { opacity: 0; transform: scale(0.92) translateY(16px); }
                    100%{ opacity: 1; transform: scale(1)   translateY(0); }
                }
            `}</style>
        </div>
    );
}
