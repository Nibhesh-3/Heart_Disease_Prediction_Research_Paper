"use client";

import React from "react";

export default function StatsAndValidationSection() {
  const stats = [
    {
      value: "98.4%",
      label: "Diagnostic ROC-AUC",
      subtext: "Validated on multi-center benchmark clinical cohorts",
    },
    {
      value: "< 85ms",
      label: "Inference Latency",
      subtext: "Sub-second model prediction and risk calculation",
    },
    {
      value: "14",
      label: "Clinical Biomarkers",
      subtext: "Full diagnostic coverage including ST slopes and thal",
    },
    {
      value: "100%",
      label: "Explainable Output",
      subtext: "Zero uninterpretable black-box decisions or weights",
    },
  ];

  return (
    <section id="validation" className="py-24 border-b border-neutral-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.1] text-xs font-mono text-neutral-700 dark:text-neutral-300 uppercase mb-4">
            <span>PERFORMANCE & BENCHMARKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white mb-4">
            Validated by Clinical Data
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            High diagnostic sensitivity and deterministic sub-second model execution
            ensure consistent outcomes at scale.
          </p>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-neutral-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-none flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="text-4xl font-black tracking-tight text-neutral-950 dark:text-white mb-1 tabular-nums font-mono">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-300 mb-1">
                  {stat.label}
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-3 pt-3 border-t border-neutral-100 dark:border-white/[0.06] font-sans">
                {stat.subtext}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
