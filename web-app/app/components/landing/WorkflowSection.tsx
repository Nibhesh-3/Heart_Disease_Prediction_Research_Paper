"use client";

import React, { useState } from "react";

interface NodeDetail {
  id: string;
  step: string;
  title: string;
  tag: string;
  description: string;
  metrics: string;
}

export default function WorkflowSection() {
  const [activeNode, setActiveNode] = useState(0);

  const nodes: NodeDetail[] = [
    {
      id: "ingestion",
      step: "01",
      title: "Biomarker Telemetry Ingestion",
      tag: "14 BIOMARKERS",
      description:
        "Standardized capture of 14 cardiovascular biomarkers: ECG ST parameters, resting blood pressure, serum lipids, and fluoroscopy vessel counts.",
      metrics: "Ingestion Latency: <12ms • Schema: Cleveland Standard",
    },
    {
      id: "inference",
      step: "02",
      title: "Ensemble Neural Consensus",
      tag: "XGBOOST + NN",
      description:
        "High-performance ensemble model evaluating non-linear feature interactions across gradient boosted trees and deep neural network layers.",
      metrics: "Inference Latency: 38ms • ROC-AUC: 98.4%",
    },
    {
      id: "calibration",
      step: "03",
      title: "Biomarker Impact Scoring",
      tag: "FACTOR ANALYSIS",
      description:
        "Deterministic quantification of individual biomarker risk contributions to identify primary drivers of cardiovascular strain.",
      metrics: "Calibration: 100% Deterministic • Multi-Factor",
    },
    {
      id: "stratification",
      step: "04",
      title: "Clinical Risk Stratification",
      tag: "DECISION SUPPORT",
      description:
        "Dynamic risk classification (Low / Moderate / Elevated), actionable preventative guidance, and exportable patient telemetry reports.",
      metrics: "Clinical Reports: Structured PDF • Zero Black-Box Output",
    },
  ];

  return (
    <section id="workflow" className="py-24 border-b border-neutral-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.1] text-xs font-mono text-neutral-700 dark:text-neutral-300 uppercase mb-4">
            <span>PIPELINE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white mb-4">
            Interactive Diagnostic Pipeline
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            Click across pipeline nodes to inspect how clinical telemetry is ingested,
            inferred, and decomposed into explainable risk stratifications.
          </p>
        </div>

        {/* Connected Node Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative mb-8">
          {nodes.map((node, index) => {
            const isActive = activeNode === index;
            return (
              <button
                key={node.id}
                onClick={() => setActiveNode(index)}
                className={`p-5 rounded-xl text-left border transition-all duration-200 relative group cursor-pointer ${
                  isActive
                    ? "bg-neutral-50 dark:bg-[#0f0f0f] border-neutral-950 dark:border-white/40 shadow-sm dark:shadow-lg"
                    : "bg-white dark:bg-[#0a0a0a] border-neutral-200/80 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/20"
                }`}
              >
                {/* Active Indicator Pulse Dot */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-neutral-500 font-bold">
                    STAGE {node.step}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08]">
                      {node.tag}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-neutral-950 dark:text-white mb-2 tracking-tight">
                  {node.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans line-clamp-3">
                  {node.description}
                </p>

                {/* Subtle bottom progress line */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                  <span>{isActive ? "ACTIVE NODE" : "CLICK TO INSPECT"}</span>
                  <span className="text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Node Detail Inspector Card */}
        <div className="rounded-xl bg-white dark:bg-[#0a0a0a] p-6 border border-neutral-200/80 dark:border-white/[0.12] shadow-sm dark:shadow-none font-mono text-xs transition-colors">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-white/[0.08] gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-neutral-950 dark:text-white font-bold">
                NODE INSPECTOR: {nodes[activeNode].title}
              </span>
            </div>
            <span className="text-neutral-500 dark:text-neutral-400">{nodes[activeNode].metrics}</span>
          </div>

          <p className="text-neutral-700 dark:text-neutral-300 font-sans text-sm leading-relaxed mb-4">
            {nodes[activeNode].description}
          </p>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200/80 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <span>ENGINE: AURALIS CORE RUNTIME v3.0</span>
            <span>DATAFLOW PROTOCOL: ZERO-COPY INFERENCE</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">STATUS: VERIFIED READY</span>
          </div>
        </div>
      </div>
    </section>
  );
}
