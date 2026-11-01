"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingCTA() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <section className="py-24 border-b border-neutral-200/80 dark:border-white/[0.08]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl p-10 sm:p-14 bg-white dark:bg-[#0a0a0a] border border-neutral-200/80 dark:border-white/[0.12] shadow-sm dark:shadow-none relative overflow-hidden transition-colors">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.05] text-neutral-700 dark:text-neutral-300 text-xs font-mono uppercase tracking-wider mb-6 border border-neutral-200 dark:border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              INSTANT CLINICAL INFERENCE
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950 dark:text-white mb-5 leading-tight">
              Begin Clinical Cardiac Screening Today
            </h2>

            <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base mb-8 leading-relaxed font-sans">
              Join clinicians, researchers, and proactive patients utilizing Auralis
              for explainable, 14-biomarker cardiovascular risk assessments.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                href={isAuthenticated ? "/healthdata" : "/signup"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-white bg-neutral-950 hover:bg-neutral-800 dark:text-black dark:bg-white dark:hover:bg-neutral-200 transition-colors text-sm shadow-xs"
              >
                <span>{isAuthenticated ? "Input Biomarkers" : "Create Account"}</span>
                <span className="text-xs font-mono">→</span>
              </Link>

              <Link
                href={isAuthenticated ? "/Dashboard" : "/signin"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-mono text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 dark:text-neutral-300 dark:bg-black dark:hover:bg-white/[0.05] dark:border-white/[0.12] transition-colors text-sm"
              >
                <span>{isAuthenticated ? "Go to Dashboard" : "Log In"}</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span> Real-Time Latency
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span> Zero Configuration
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span> 100% Deterministic
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
