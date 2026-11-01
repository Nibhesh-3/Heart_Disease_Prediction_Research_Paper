"use client";

import React from "react";
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface PatientRecord {
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
}

interface RadarVitalsChartProps {
    latestRecord: PatientRecord | null;
}

const FEATURE_CONFIG: Record<string, { label: string; min: number; max: number; normalTarget: number; unit: string }> = {
    trestbps: { label: "Rest BP",    min: 80,  max: 200, normalTarget: 33,  unit: "mmHg" },
    chol:     { label: "Chol",       min: 100, max: 400, normalTarget: 33,  unit: "mg/dL" },
    thalach:  { label: "Max HR",     min: 60,  max: 220, normalTarget: 69,  unit: "BPM" },
    oldpeak:  { label: "ST Depr",    min: 0,   max: 6,   normalTarget: 17,  unit: "" },
    cp:       { label: "Chest Pain", min: 0,   max: 3,   normalTarget: 0,   unit: "" },
    exang:    { label: "Ex Angina",  min: 0,   max: 1,   normalTarget: 0,   unit: "" },
    ca:       { label: "Vessels",    min: 0,   max: 4,   normalTarget: 0,   unit: "" },
    thal:     { label: "Thal",       min: 0,   max: 3,   normalTarget: 67,  unit: "" },
    restecg:  { label: "ECG",        min: 0,   max: 2,   normalTarget: 0,   unit: "" },
    fbs:      { label: "Fasting BS", min: 0,   max: 1,   normalTarget: 0,   unit: "" },
};

const FEATURE_KEYS = Object.keys(FEATURE_CONFIG);

function normalize(value: number, min: number, max: number): number {
    return Math.round(Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)));
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; dataKey: string }> }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-lg text-xs dark:bg-[#161616] dark:border-neutral-800">
                {payload.map((p, i) => (
                    <p key={i} className={`font-semibold ${p.dataKey === "patient" ? "text-blue-700" : "text-emerald-700"}`}>
                        {p.name}: <span className="font-black">{p.value}</span>
                        <span className="text-neutral-400 font-normal">/100</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function RadarVitalsChart({ latestRecord }: RadarVitalsChartProps) {
    const hasData = latestRecord !== null;

    const chartData = FEATURE_KEYS.map((key) => {
        const cfg = FEATURE_CONFIG[key];
        const rawValue = latestRecord?.[key as keyof PatientRecord];
        const patientNorm = rawValue !== undefined && rawValue !== null
            ? normalize(Number(rawValue), cfg.min, cfg.max)
            : cfg.normalTarget;
        return { feature: cfg.label, patient: patientNorm, normal: cfg.normalTarget };
    });

    return (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">Vitals Radar</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        Patient biomarker profile vs. clinical normal range (normalized 0–100)
                    </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500 inline-block" />
                        <span className="text-neutral-600 dark:text-neutral-400">Your Values</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500 border-dashed inline-block" />
                        <span className="text-neutral-600 dark:text-neutral-400">Normal</span>
                    </span>
                </div>
            </div>

            {!hasData ? (
                <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center dark:bg-neutral-800">
                        <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-neutral-500">No screening data available</p>
                    <p className="text-xs text-neutral-400">Run your first assessment to visualize your biomarker profile.</p>
                </div>
            ) : (
                <div className="w-full" style={{ height: 340 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                            <PolarGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                            <PolarAngleAxis
                                dataKey="feature"
                                tick={{ fontSize: 10, fontWeight: 700, fill: "#6B7280", fontFamily: "inherit" }}
                                tickLine={false}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fontSize: 9, fill: "#9CA3AF" }}
                                tickCount={4}
                                axisLine={false}
                            />
                            <Radar
                                name="Normal Range"
                                dataKey="normal"
                                stroke="#10B981"
                                fill="#10B981"
                                fillOpacity={0.08}
                                strokeWidth={1.5}
                                strokeDasharray="5 3"
                            />
                            <Radar
                                name="Your Values"
                                dataKey="patient"
                                stroke="#3B82F6"
                                fill="#3B82F6"
                                fillOpacity={0.18}
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {hasData && (
                <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap gap-2 dark:border-neutral-900">
                    {([["trestbps","BP","mmHg"],["chol","Chol","mg/dL"],["thalach","HR","BPM"],["oldpeak","ST",""]] as [keyof PatientRecord, string, string][]).map(([key, label, unit]) => {
                        const raw = latestRecord?.[key];
                        return (
                            <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-full text-[10px] font-bold text-neutral-700 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300">
                                <span className="text-neutral-400 font-semibold">{label}</span>
                                {raw !== undefined ? `${raw}${unit ? ` ${unit}` : ""}` : "—"}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
