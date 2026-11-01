"use client";

import React, { useRef, useState } from "react";

interface BentoCardProps {
  title: string;
  tag: string;
  description: string;
  icon: React.ReactNode;
  colSpan: string;
  badge: string;
}

function SpotlightCard({ title, tag, description, icon, colSpan, badge }: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative p-6 sm:p-7 rounded-xl bg-white dark:bg-[#0a0a0a] border border-neutral-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-none flex flex-col justify-between overflow-hidden group transition-all duration-200 hover:border-neutral-300 dark:hover:border-white/[0.15] ${colSpan}`}
    >
      {/* Cursor Spotlight Radial Highlight */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${
              isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)"
            }, transparent 40%)`,
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/[0.1] text-neutral-900 dark:text-white">
            {icon}
          </div>
          <span className="text-[10px] font-mono uppercase font-medium tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/[0.08]">
            {tag}
          </span>
        </div>

        <h3 className="text-lg font-bold text-neutral-950 dark:text-white mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6 font-sans">
          {description}
        </p>
      </div>

      <div className="relative z-10 pt-3 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
        <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {badge}
        </span>
        <span className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
          →
        </span>
      </div>
    </div>
  );
}

export default function FeaturesGridSection() {
  const features: BentoCardProps[] = [
    {
      title: "Clinical Risk Stratification Engine",
      tag: "PREDICTIVE INTELLIGENCE",
      description:
        "Every assessment synthesizes 14 vital biomarkers to generate calibrated risk probabilities and granular biomarker impact rankings.",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      colSpan: "lg:col-span-8",
      badge: "Multi-Factor Assessment",
    },
    {
      title: "14-Vector Biomarker Matrix",
      tag: "TELEMETRY MATRIX",
      description:
        "Comprehensive ingestion of ECG ST slope, thalach, major fluoroscopy vessels, resting BP, and blood sugar markers.",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      colSpan: "lg:col-span-4",
      badge: "Full Vital Screen",
    },
    {
      title: "Instant Counterfactual Sandbox",
      tag: "INTERACTIVE WHAT-IF",
      description:
        "Tweak BP, lipid profiles, and cardiac reserve markers dynamically to model lifestyle and pharmacological risk reduction.",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      colSpan: "lg:col-span-4",
      badge: "Real-Time Simulation",
    },
    {
      title: "Automated Clinical PDF Generation",
      tag: "EMR EXPORTS",
      description:
        "Generate multi-page clinical telemetry summaries with SHAP attribution charts, patient identifiers, and longitudinal trends in vector PDF format.",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      colSpan: "lg:col-span-4",
      badge: "Instant PDF Reports",
    },
    {
      title: "Longitudinal Trend History",
      tag: "TEMPORAL TRAJECTORY",
      description:
        "Maintain chronological biomarker trajectories across multiple visits to verify therapeutic efficacy and detect cardiac decline early.",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      colSpan: "lg:col-span-4",
      badge: "Visit Progression",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 sm:py-28 relative border-t border-neutral-200/80 dark:border-white/[0.08]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] text-[11px] font-mono text-neutral-700 dark:text-neutral-300 mb-3">
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            Engineered for Precision Cardiology
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Every layer optimized for clinical validation, transparency, and rapid diagnostics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {features.map((feature, i) => (
            <SpotlightCard key={i} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
