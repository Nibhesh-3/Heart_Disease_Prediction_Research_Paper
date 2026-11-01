"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { getApiUrl } from "../../lib/api";

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

interface ShapExplanation {
    feature: string;
    label: string;
    patient_value: number;
    unit: string;
    shap_value: number;
    direction: "INCREASES_RISK" | "REDUCES_RISK";
    clinical_note: string;
}

interface ShapResponse {
    base_risk: number;
    final_predicted_risk: number;
    local_explanations: ShapExplanation[];
}

interface ShapWaterfallCardProps {
    latestRecord: PatientRecord | null;
    className?: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ShapExplanation & { absShap: number } }> }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-lg text-xs max-w-[220px] dark:bg-[#161616] dark:border-neutral-800">
                <p className="font-bold text-neutral-900 mb-1 dark:text-neutral-100">{d.label}</p>
                <p className="text-neutral-500 mb-1">
                    Value: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{d.patient_value}{d.unit ? ` ${d.unit}` : ""}</span>
                </p>
                <p className={`font-semibold mb-1 ${d.direction === "INCREASES_RISK" ? "text-red-600" : "text-emerald-600"}`}>
                    {d.direction === "INCREASES_RISK" ? "↑ Increases Risk" : "↓ Reduces Risk"}
                </p>
                <p className="text-neutral-500 leading-relaxed">{d.clinical_note}</p>
            </div>
        );
    }
    return null;
};

export default function ShapWaterfallCard({ latestRecord, className }: ShapWaterfallCardProps) {
    const [data, setData] = useState<ShapResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchShap = useCallback(async () => {
        if (!latestRecord) return;
        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Build full input — default missing fields to 0
        const payload = {
            patient_data: {
                age:      latestRecord.age      ?? 50,
                sex:      latestRecord.sex      ?? 1,
                cp:       latestRecord.cp       ?? 0,
                trestbps: latestRecord.trestbps ?? 120,
                chol:     latestRecord.chol     ?? 200,
                fbs:      latestRecord.fbs      ?? 0,
                restecg:  latestRecord.restecg  ?? 0,
                thalach:  latestRecord.thalach  ?? 150,
                exang:    latestRecord.exang    ?? 0,
                oldpeak:  latestRecord.oldpeak  ?? 0,
                slope:    latestRecord.slope    ?? 1,
                ca:       latestRecord.ca       ?? 0,
                thal:     latestRecord.thal     ?? 2,
            },
        };

        try {
            setLoading(true);
            setError("");
            const res = await fetch(getApiUrl("/feature-importances"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("SHAP fetch failed");
            const json: ShapResponse = await res.json();
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load SHAP data");
        } finally {
            setLoading(false);
        }
    }, [latestRecord]);

    useEffect(() => {
        fetchShap();
    }, [fetchShap]);

    // Prepare top 6 by absolute shap value
    const chartData = data?.local_explanations
        .slice(0, 6)
        .map((e) => ({ ...e, absShap: Math.abs(e.shap_value) })) ?? [];

    return (
        <div className={`bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/80 shadow-xs flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none ${className || ""}`}>
            {/* Top: Header & Legend */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">AI Risk Drivers</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">Top 6 SHAP feature contributions to your risk score</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50">
                        SHAP
                    </span>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-semibold mt-3">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm bg-red-500 inline-block" />
                        <span className="text-neutral-500">Increases Risk</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" />
                        <span className="text-neutral-500">Reduces Risk</span>
                    </span>
                </div>
            </div>

            {/* Middle: Body / Chart */}
            {!latestRecord ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
                    <p className="text-sm font-semibold text-neutral-500">No screening data</p>
                    <p className="text-xs text-neutral-400">Run a screening to see AI-driven risk drivers.</p>
                </div>
            ) : loading ? (
                <div className="flex-1 flex items-center justify-center py-8 gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-purple-600 animate-spin dark:border-neutral-800" />
                    <p className="text-xs text-neutral-500 font-semibold">Computing SHAP values…</p>
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
                    <p className="text-sm font-semibold text-red-500">Failed to load</p>
                    <button onClick={fetchShap} className="text-xs font-bold text-neutral-700 underline cursor-pointer dark:text-neutral-300">Retry</button>
                </div>
            ) : (
                <>
                    <div className="w-full flex-1 min-h-44 my-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                                barCategoryGap="18%"
                            >
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 9, fill: "#9CA3AF" }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v: number) => v.toFixed(2)}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    width={72}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: "#374151", fontFamily: "inherit" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                                <Bar dataKey="absShap" radius={[0, 4, 4, 0]} maxBarSize={14}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.direction === "INCREASES_RISK" ? "#EF4444" : "#10B981"}
                                            fillOpacity={0.85}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bottom: Base vs Final risk footer */}
                    {data && (
                        <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-center dark:border-neutral-900 mt-auto">
                            <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200/60 dark:bg-neutral-900 dark:border-neutral-800/60">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase">Base Risk</p>
                                <p className="text-sm font-extrabold text-neutral-800 mt-0.5 dark:text-neutral-200">
                                    {(data.base_risk * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200/60 dark:bg-neutral-900 dark:border-neutral-800/60">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase">Final Risk</p>
                                <p className="text-sm font-extrabold text-neutral-950 mt-0.5 dark:text-white">
                                    {(data.final_predicted_risk * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
