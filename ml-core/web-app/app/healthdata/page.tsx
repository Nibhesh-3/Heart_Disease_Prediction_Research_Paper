"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../../lib/api';
import AppLayout from '../components/AppLayout';
import AnimatedRiskOrb from '../components/AnimatedRiskOrb';

interface HealthForm {
    age: string;
    sex: string;
    cp: string;
    trestbps: string;
    chol: string;
    fbs: string;
    restecg: string;
    thalach: string;
    exang: string;
    oldpeak: string;
    slope: string;
    ca: string;
    thal: string;
}

interface PredictionResponse {
    prediction: number;
    probability_positive: number;
    probability_negative: number;
    risk_score: number;
    llm_analysis?: string;
}

export default function HealthDataPage() {
    const router = useRouter();
    const resultRef = useRef<HTMLDivElement>(null);
    const [form, setForm] = useState<HealthForm>({
        age: '',
        sex: '1',
        cp: '1',
        trestbps: '',
        chol: '',
        fbs: '0',
        restecg: '0',
        thalach: '',
        exang: '0',
        oldpeak: '',
        slope: '1',
        ca: '0',
        thal: '3',
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResponse | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.replace('/signin');
        }
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(getApiUrl('/predict'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    age: Number(form.age),
                    sex: Number(form.sex),
                    cp: Number(form.cp),
                    trestbps: Number(form.trestbps),
                    chol: Number(form.chol),
                    fbs: Number(form.fbs),
                    restecg: Number(form.restecg),
                    thalach: Number(form.thalach),
                    exang: Number(form.exang),
                    oldpeak: Number(form.oldpeak),
                    slope: Number(form.slope),
                    ca: Number(form.ca),
                    thal: Number(form.thal),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Prediction failed. Check backend connection.');
            }

            const data = await response.json();
            setResult(data);

            // Auto-scroll on mobile to results
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const riskScore = result ? result.risk_score : 0;
    const computedPercentage = Math.round(riskScore * 100);
    const riskLevel = result
        ? riskScore >= 0.7
            ? { label: 'High Risk', color: 'text-red-600', stroke: '#DC2626', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' }
            : riskScore >= 0.4
                ? { label: 'Moderate Risk', color: 'text-amber-600', stroke: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' }
                : { label: 'Low Risk', color: 'text-emerald-600', stroke: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' }
        : null;

    const stateLabel = computedPercentage <= 30
        ? "OPTIMAL STATE"
        : computedPercentage <= 65
            ? "MODERATE STATE"
            : "ELEVATED STATE";

    return (
        <AppLayout activePage="healthdata">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight dark:text-white">
                            Patient Health Telemetry
                        </h1>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                            Input 13 standard UCI cardiovascular biomarkers to evaluate real-time diagnostic risk.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Input Form */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-8 border border-neutral-200/80 shadow-xs dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                        <div className="mb-6">
                            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-950 dark:text-white">13 Clinical Biomarkers</h2>
                            <p className="text-xs text-neutral-500 mt-0.5">Calibrated on the Cleveland Cardiovascular Dataset.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            {/* Age & Sex */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Age (Years)
                                    </label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={form.age}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        max="120"
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Biological Sex
                                    </label>
                                    <select
                                        name="sex"
                                        value={form.sex}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    >
                                        <option value="1">Male</option>
                                        <option value="0">Female</option>
                                    </select>
                                </div>
                            </div>

                            {/* Chest Pain Type */}
                            <div>
                                <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                    Chest Pain Symptom (CP)
                                </label>
                                <select
                                    name="cp"
                                    value={form.cp}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                >
                                    <option value="1">Typical Angina (1)</option>
                                    <option value="2">Atypical Angina (2)</option>
                                    <option value="3">Non-Anginal Pain (3)</option>
                                    <option value="4">Asymptomatic (4)</option>
                                </select>
                            </div>

                            {/* Resting BP & Cholesterol */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Resting BP (mmHg)
                                    </label>
                                    <input
                                        type="number"
                                        name="trestbps"
                                        value={form.trestbps}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Serum Cholesterol (mg/dL)
                                    </label>
                                    <input
                                        type="number"
                                        name="chol"
                                        value={form.chol}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    />
                                </div>
                            </div>

                            {/* Fasting BS & Max HR */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Fasting Blood Sugar
                                    </label>
                                    <select
                                        name="fbs"
                                        value={form.fbs}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    >
                                        <option value="0">≤ 120 mg/dL (Normal)</option>
                                        <option value="1">&gt; 120 mg/dL (Elevated)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Max Heart Rate (BPM)
                                    </label>
                                    <input
                                        type="number"
                                        name="thalach"
                                        value={form.thalach}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    />
                                </div>
                            </div>

                            {/* Resting ECG */}
                            <div>
                                <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                    Resting ECG Result
                                </label>
                                <select
                                    name="restecg"
                                    value={form.restecg}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                >
                                    <option value="0">Normal (0)</option>
                                    <option value="1">ST-T Wave Abnormality (1)</option>
                                    <option value="2">Left Ventricular Hypertrophy (2)</option>
                                </select>
                            </div>

                            {/* Exercise Angina & Oldpeak */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Exercise Induced Angina
                                    </label>
                                    <select
                                        name="exang"
                                        value={form.exang}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    >
                                        <option value="0">No (0)</option>
                                        <option value="1">Yes (1)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        ST Depression (Oldpeak)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="oldpeak"
                                        value={form.oldpeak}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    />
                                </div>
                            </div>

                            {/* ST Slope & CA */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Slope of Peak Exercise ST
                                    </label>
                                    <select
                                        name="slope"
                                        value={form.slope}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    >
                                        <option value="1">Upsloping (1)</option>
                                        <option value="2">Flat (2)</option>
                                        <option value="3">Downsloping (3)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                        Major Vessels Fluro (CA: 0-3)
                                    </label>
                                    <select
                                        name="ca"
                                        value={form.ca}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                    >
                                        <option value="0">0 Vessels</option>
                                        <option value="1">1 Vessel</option>
                                        <option value="2">2 Vessels</option>
                                        <option value="3">3 Vessels</option>
                                    </select>
                                </div>
                            </div>

                            {/* Thal */}
                            <div>
                                <label className="block text-[11px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                    Thalassemia Defect (Thal)
                                </label>
                                <select
                                    name="thal"
                                    value={form.thal}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 sm:py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-100"
                                >
                                    <option value="3">Normal (3)</option>
                                    <option value="6">Fixed Defect (6)</option>
                                    <option value="7">Reversible Defect (7)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 sm:py-4 rounded-xl bg-neutral-950 text-white font-semibold text-xs sm:text-sm hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm mt-4 cursor-pointer"
                            >
                                {loading ? 'Evaluating XGBoost Model...' : 'Calculate Risk'}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: Diagnostic Results Output Panel */}
                    <div ref={resultRef} className="lg:col-span-5 space-y-4">
                        {!result && !loading && (
                            <div className="rounded-3xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-xs min-h-[360px] flex flex-col justify-between dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-xs font-bold text-neutral-700 uppercase border border-neutral-200 mb-6 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-800">
                                        Diagnostic Output
                                    </span>
                                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 mb-2 dark:text-white">Auralis Risk Output</h3>
                                    <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                                        Fill in patient physiological data and click &ldquo;Calculate Risk&rdquo; to execute real-time model inference and generate AI clinical guidance.
                                    </p>
                                </div>
                                <div className="pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400 font-medium dark:border-neutral-900">
                                    <span>Engine: XGBoost ML</span>
                                    <span>Auralis Core v2.4</span>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="rounded-3xl bg-white p-8 border border-neutral-200/80 shadow-xs min-h-[360px] flex flex-col items-center justify-center gap-4 dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                <div className="w-9 h-9 rounded-full border-3 border-neutral-200 border-t-neutral-950 animate-spin dark:border-neutral-800"></div>
                                <p className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Evaluating Cardiovascular Risk...</p>
                            </div>
                        )}

                        {result && riskLevel && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Spherical Orb Risk Card */}
                                <div className="relative rounded-3xl bg-[#F8F9FA] p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col items-center justify-center text-center overflow-hidden min-h-[340px] dark:bg-black dark:border-neutral-800/80 dark:shadow-none">
                                    {/* Micro-dot grid background pattern */}
                                    <div
                                        className="absolute inset-0 opacity-45 pointer-events-none"
                                        style={{
                                            backgroundImage: "radial-gradient(#9CA3AF 1.2px, transparent 1.2px)",
                                            backgroundSize: "18px 18px",
                                            backgroundPosition: "center center",
                                        }}
                                    />

                                    {/* Soft Spherical Orb */}
                                    <AnimatedRiskOrb
                                        percentage={computedPercentage}
                                        stateLabel={stateLabel}
                                        riskLevel={riskLevel}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase">Diagnosis</p>
                                        <p className="text-base sm:text-lg font-extrabold text-neutral-950 mt-1 dark:text-white">
                                            {result.prediction === 1 ? 'Positive Risk' : 'Negative Risk'}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                        <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase">Risk Level</p>
                                        <p className="text-base sm:text-lg font-extrabold text-neutral-950 mt-1 dark:text-white">{riskLevel.label}</p>
                                    </div>
                                </div>

                                {result.llm_analysis && (
                                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs dark:bg-[#161616] dark:border-neutral-800/80 dark:shadow-none">
                                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Clinical Guidance</p>
                                        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal dark:text-neutral-300">{result.llm_analysis}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}