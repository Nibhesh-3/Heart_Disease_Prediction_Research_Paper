"use client";

import React from "react";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-[#F8F9FA] dark:bg-black text-neutral-900 dark:text-white border-t border-neutral-200/80 dark:border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-neutral-950 text-white dark:bg-white dark:text-black">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight text-neutral-950 dark:text-white">
                Auralis AI
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm font-sans">
              Clinical telemetry and ensemble machine learning platform for
              explainable cardiovascular risk stratification and early intervention.
            </p>

            {/* Status Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] text-[11px] font-mono text-neutral-700 dark:text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational • 99.98% SLA</span>
            </div>
          </div>

          {/* Links 1 (3 cols) */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <h4 className="uppercase font-bold tracking-wider text-neutral-950 dark:text-neutral-200">
              Platform
            </h4>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>
                <a href="#features" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Diagnostic Architecture
                </a>
              </li>
              <li>
                <a href="#simulator" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Risk Simulator
                </a>
              </li>
              <li>
                <a href="#ekg" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  ECG Waveforms
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Pipeline Workflow
                </a>
              </li>
              <li>
                <a href="#validation" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Global Benchmarks
                </a>
              </li>
            </ul>
          </div>

          {/* Links 2 (4 cols) */}
          <div className="md:col-span-4 space-y-3 font-mono text-xs">
            <h4 className="uppercase font-bold tracking-wider text-neutral-950 dark:text-neutral-200">
              Diagnostic Suite
            </h4>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>
                <Link href="/signin" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/Dashboard" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Telemetry Dashboard
                </Link>
              </li>
              <li>
                <Link href="/healthdata" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Input Biomarker Record
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Medical Disclaimer & Copyright */}
        <div className="mt-14 pt-8 border-t border-neutral-200/80 dark:border-white/[0.08] space-y-3 text-[11px] text-neutral-500 font-sans leading-relaxed">
          <p>
            <strong className="text-neutral-700 dark:text-neutral-400 font-medium">Medical Disclaimer:</strong> Auralis AI
            is an investigational clinical decision support platform designed to assist healthcare
            professionals and informed individuals with risk stratification. It does not replace formal medical advice,
            diagnosis, or treatment. Always consult a licensed physician or cardiologist for medical conditions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 font-mono text-neutral-500">
            <p>© {new Date().getFullYear()} Auralis Inc. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[10px]">
              <span>TLS 1.3 SECURE</span>
              <span>•</span>
              <span>AES-256 ENCRYPTED</span>
              <span>•</span>
              <span>ISO-27001 PROTOCOL</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
