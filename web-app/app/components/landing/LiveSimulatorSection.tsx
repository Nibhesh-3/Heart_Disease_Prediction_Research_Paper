"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function LiveSimulatorSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbCircleRef = useRef<SVGCircleElement>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"));
  }, []);

  // Biomarker sliders
  const [age, setAge] = useState(52);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [trestbps, setTrestbps] = useState(132);
  const [chol, setChol] = useState(240);
  const [thalach, setThalach] = useState(154);
  const [cp, setCp] = useState<number>(2);
  const [exang, setExang] = useState<number>(0);
  const [oldpeak, setOldpeak] = useState<number>(1.2);

  // Real-time calculation
  const { riskScore, riskLevel, factors } = useMemo(() => {
    let score = 20;
    const factorList: { name: string; impact: number; isRisk: boolean }[] = [];

    if (age > 60) {
      score += 16;
      factorList.push({ name: `Age (${age} yrs)`, impact: 16, isRisk: true });
    } else if (age > 50) {
      score += 8;
      factorList.push({ name: `Age (${age} yrs)`, impact: 8, isRisk: true });
    } else {
      score -= 5;
      factorList.push({ name: `Youth protection (${age} yrs)`, impact: -5, isRisk: false });
    }

    if (sex === "male") {
      score += 6;
      factorList.push({ name: "Male Biological Profile", impact: 6, isRisk: true });
    }

    if (trestbps >= 150) {
      score += 20;
      factorList.push({ name: `Severe BP (${trestbps} mmHg)`, impact: 20, isRisk: true });
    } else if (trestbps >= 135) {
      score += 10;
      factorList.push({ name: `Pre-hypertensive BP (${trestbps} mmHg)`, impact: 10, isRisk: true });
    } else if (trestbps <= 120) {
      score -= 6;
      factorList.push({ name: `Optimal BP (${trestbps} mmHg)`, impact: -6, isRisk: false });
    }

    if (chol >= 280) {
      score += 22;
      factorList.push({ name: `High Cholesterol (${chol} mg/dL)`, impact: 22, isRisk: true });
    } else if (chol >= 220) {
      score += 10;
      factorList.push({ name: `Borderline Cholesterol (${chol} mg/dL)`, impact: 10, isRisk: true });
    } else {
      score -= 6;
      factorList.push({ name: `Favorable Lipids (${chol} mg/dL)`, impact: -6, isRisk: false });
    }

    if (thalach < 120) {
      score += 18;
      factorList.push({ name: `Low Max Heart Rate (${thalach} BPM)`, impact: 18, isRisk: true });
    } else if (thalach > 165) {
      score -= 12;
      factorList.push({ name: `High Cardiac Reserve (${thalach} BPM)`, impact: -12, isRisk: false });
    }

    if (cp === 3) {
      score += 18;
      factorList.push({ name: "Asymptomatic Presentation", impact: 18, isRisk: true });
    } else if (cp === 0) {
      score += 12;
      factorList.push({ name: "Typical Anginal Symptoms", impact: 12, isRisk: true });
    } else if (cp === 1 || cp === 2) {
      score -= 4;
      factorList.push({ name: "Non-anginal Discomfort", impact: -4, isRisk: false });
    }

    if (exang === 1) {
      score += 15;
      factorList.push({ name: "Exercise-Induced Angina", impact: 15, isRisk: true });
    }

    if (oldpeak >= 2.5) {
      score += 22;
      factorList.push({ name: `Marked ST Depression (${oldpeak}mm)`, impact: 22, isRisk: true });
    } else if (oldpeak >= 1.0) {
      score += 10;
      factorList.push({ name: `Moderate ST Depression (${oldpeak}mm)`, impact: 10, isRisk: true });
    } else if (oldpeak === 0) {
      score -= 6;
      factorList.push({ name: "Normal ST Segment (0.0mm)", impact: -6, isRisk: false });
    }

    score = Math.max(5, Math.min(96, score));

    let level = {
      label: "Low Risk",
      color: "#10b981",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      description: "Low cardiovascular event probability. Biomarkers within normal parameters.",
    };

    if (score >= 65) {
      level = {
        label: "High Risk",
        color: "#ef4444",
        badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        description: "Substantial risk factors detected. Urgent clinical telemetry review recommended.",
      };
    } else if (score >= 40) {
      level = {
        label: "Moderate Risk",
        color: "#f59e0b",
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        description: "Elevated risk profile. Consider lifestyle intervention and diagnostic follow-up.",
      };
    }

    return {
      riskScore: score,
      riskLevel: level,
      factors: factorList.slice(0, 4),
    };
  }, [age, sex, trestbps, chol, thalach, cp, exang, oldpeak]);

  // Smooth SVG stroke animation
  const size = 150;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!orbCircleRef.current) return;
    const progress = riskScore / 100;
    const offset = circumference - progress * circumference;

    gsap.to(orbCircleRef.current, {
      strokeDashoffset: offset,
      duration: 0.4,
      ease: "power2.out",
    });
  }, [riskScore, circumference]);

  return (
    <section
      id="simulator"
      ref={sectionRef}
      className="py-20 sm:py-28 relative border-t border-neutral-200/80 dark:border-white/[0.08]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] text-[11px] font-mono text-neutral-700 dark:text-neutral-300 mb-3">
            <span>INTERACTIVE BENCHMARK</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            Live Risk Inference Engine
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Adjust clinical telemetry sliders to evaluate instantaneous probability shifts.
          </p>
        </div>

        {/* Main Simulator Box */}
        <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200/80 dark:border-white/[0.08] p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-sm dark:shadow-none transition-colors">
          {/* Controls Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-white/[0.08]">
              <span className="text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">
                Telemetry Inputs (8 Modifiers)
              </span>
              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                14 TOTAL EVALUATED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
              {/* Age */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="sim-age" className="text-neutral-500 dark:text-neutral-400">age</label>
                  <span className="text-neutral-950 dark:text-white font-bold">{age} yrs</span>
                </div>
                <input
                  id="sim-age"
                  type="range"
                  min="25"
                  max="80"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-950 dark:accent-white"
                />
              </div>

              {/* Sex */}
              <div className="space-y-1.5">
                <label className="text-neutral-500 dark:text-neutral-400 text-xs block">sex</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSex("male")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-mono border transition-colors ${
                      sex === "male"
                        ? "bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-black dark:border-white font-bold"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:bg-black dark:text-neutral-400 dark:border-white/[0.1] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    Male (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex("female")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-mono border transition-colors ${
                      sex === "female"
                        ? "bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-black dark:border-white font-bold"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:bg-black dark:text-neutral-400 dark:border-white/[0.1] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    Female (0)
                  </button>
                </div>
              </div>

              {/* Resting BP */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="sim-bp" className="text-neutral-500 dark:text-neutral-400">trestbps</label>
                  <span className="text-neutral-950 dark:text-white font-bold">{trestbps} mmHg</span>
                </div>
                <input
                  id="sim-bp"
                  type="range"
                  min="90"
                  max="200"
                  value={trestbps}
                  onChange={(e) => setTrestbps(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-950 dark:accent-white"
                />
              </div>

              {/* Cholesterol */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="sim-chol" className="text-neutral-500 dark:text-neutral-400">chol</label>
                  <span className="text-neutral-950 dark:text-white font-bold">{chol} mg/dL</span>
                </div>
                <input
                  id="sim-chol"
                  type="range"
                  min="130"
                  max="420"
                  value={chol}
                  onChange={(e) => setChol(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-950 dark:accent-white"
                />
              </div>

              {/* Max Heart Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="sim-thalach" className="text-neutral-500 dark:text-neutral-400">thalach</label>
                  <span className="text-neutral-950 dark:text-white font-bold">{thalach} BPM</span>
                </div>
                <input
                  id="sim-thalach"
                  type="range"
                  min="80"
                  max="210"
                  value={thalach}
                  onChange={(e) => setThalach(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-950 dark:accent-white"
                />
              </div>

              {/* ST Depression */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label htmlFor="sim-oldpeak" className="text-neutral-500 dark:text-neutral-400">oldpeak</label>
                  <span className="text-neutral-950 dark:text-white font-bold">{oldpeak.toFixed(1)} mm</span>
                </div>
                <input
                  id="sim-oldpeak"
                  type="range"
                  min="0"
                  max="4.5"
                  step="0.1"
                  value={oldpeak}
                  onChange={(e) => setOldpeak(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-950 dark:accent-white"
                />
              </div>
            </div>

            {/* Selectors */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label htmlFor="sim-cp" className="text-neutral-500 dark:text-neutral-400 block">cp (chest pain type)</label>
                <select
                  id="sim-cp"
                  value={cp}
                  onChange={(e) => setCp(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-white/[0.12] text-neutral-950 dark:text-white focus:outline-none"
                >
                  <option value={0}>0: Typical Angina</option>
                  <option value={1}>1: Atypical Angina</option>
                  <option value={2}>2: Non-anginal Discomfort</option>
                  <option value={3}>3: Asymptomatic</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-500 dark:text-neutral-400 block">exang (exercise angina)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExang(0)}
                    className={`py-2 px-3 rounded-lg border transition-colors ${
                      exang === 0
                        ? "bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-black dark:border-white font-bold"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:bg-black dark:text-neutral-400 dark:border-white/[0.1] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    0: No
                  </button>
                  <button
                    type="button"
                    onClick={() => setExang(1)}
                    className={`py-2 px-3 rounded-lg border transition-colors ${
                      exang === 1
                        ? "bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-black dark:border-white font-bold"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:bg-black dark:text-neutral-400 dark:border-white/[0.1] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    1: Yes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Model Output Column (5 Cols) */}
          <div className="lg:col-span-5 bg-neutral-50 dark:bg-black p-6 sm:p-7 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] flex flex-col justify-between min-h-[440px]">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/[0.08] mb-4">
                <span className="text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">
                  Model Output
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ● REAL-TIME PREDICTION
                </span>
              </div>

              {/* Visual Gauge */}
              <div className="flex flex-col items-center text-center">
                <div className="relative my-3 flex items-center justify-center">
                  <svg className="w-40 h-40 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      className="text-neutral-200 dark:text-white/[0.08]"
                      strokeWidth={strokeWidth}
                    />
                    <circle
                      ref={orbCircleRef}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke={riskLevel.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                    <span className="text-3xl font-bold tabular-nums text-neutral-950 dark:text-white">
                      {riskScore}%
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border mt-1 ${riskLevel.badgeClass}`}>
                      {riskLevel.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-5 max-w-xs leading-relaxed font-sans">
                  {riskLevel.description}
                </p>

                {/* Risk Contributors */}
                <div className="w-full space-y-1.5 pt-3 border-t border-neutral-200 dark:border-white/[0.08] text-left font-mono">
                  <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                    PRIMARY RISK CONTRIBUTORS
                  </span>
                  {factors.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-white dark:bg-[#0a0a0a] border border-neutral-200/80 dark:border-white/[0.06]"
                    >
                      <span className="text-neutral-700 dark:text-neutral-300 truncate pr-2">{f.name}</span>
                      <span className={`font-bold ${f.isRisk ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {f.impact > 0 ? `+${f.impact}%` : `${f.impact}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Link CTA */}
            <Link
              href={isAuthenticated ? "/healthdata" : "/signup"}
              className="mt-6 w-full py-2.5 px-4 rounded-full text-xs font-mono font-semibold text-white bg-neutral-950 hover:bg-neutral-800 dark:text-black dark:bg-white dark:hover:bg-neutral-200 text-center transition-all duration-200 shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Use the Model</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
