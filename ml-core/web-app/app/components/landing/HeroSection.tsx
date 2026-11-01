"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [bpm, setBpm] = useState(72);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  // Subtle natural heart rate variation
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(Math.floor(71 + Math.random() * 4));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // GSAP Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gsap-hero-element",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // EKG Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || 180);

    let offset = 0;
    const speed = 2.4;

    const ekgPoints = [
      0, 0, 0, 0.05, 0.1, 0.08, 0, 0, -0.15, 0.95, -0.4, 0, 0, 0.12, 0.22,
      0.18, 0.05, 0, 0, 0,
    ];

    const getEkgHeight = (x: number): number => {
      const cycleLength = 220;
      const localX = (x + offset) % cycleLength;
      const index = Math.floor((localX / cycleLength) * ekgPoints.length);
      const val = ekgPoints[index] || 0;
      return height / 2 - val * (height * 0.38);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");

      // 1px Subtle Grid Lines (Dual light / Vercel dark)
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 24 * window.devicePixelRatio;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Crisp Emerald Clinical Trace
      ctx.beginPath();
      ctx.lineWidth = 2 * window.devicePixelRatio;
      ctx.strokeStyle = "#10b981";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (let x = 0; x < width; x += 3) {
        const y = getEkgHeight(x);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      offset += speed;
      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 180;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden"
    >
      {/* Subtle Background Grid (Dual Light & Dark) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Release Changelog Pill */}
          <div className="gsap-hero-element inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.1] text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-6 hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-neutral-500 dark:text-neutral-400">Auralis AI 3.0:</span>
            <span>Ensemble inference engine</span>
            <span className="text-neutral-400 dark:text-neutral-500">→</span>
          </div>

          {/* Main Headline with Interactive Hover Animation */}
          <h1 className="gsap-hero-element text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mb-5 text-neutral-950 dark:text-white group cursor-default select-none">
            <span className="inline-block transition-transform duration-300 group-hover:-translate-y-1">
              <span className="inline-block transition-transform duration-200 hover:-translate-y-1 hover:text-rose-600 dark:hover:text-neutral-100">
                Predict
              </span>{" "}
              <span className="inline-block transition-transform duration-200 hover:-translate-y-1 hover:text-rose-600 dark:hover:text-neutral-100">
                Cardiovascular
              </span>{" "}
              <span className="inline-block transition-transform duration-200 hover:-translate-y-1 hover:text-rose-600 dark:hover:text-neutral-100">
                Risk.
              </span>
            </span>
            <br />
            <span className="inline-block text-neutral-500 dark:text-neutral-400 transition-all duration-300 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 group-hover:translate-x-1">
              <span className="inline-block transition-all duration-200 hover:text-neutral-950 dark:hover:text-white hover:tracking-wide">
                At the Speed of Telemetry.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="gsap-hero-element text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
            Auralis is the clinical platform for predictive cardiology. Ingest 14
            biomarkers, compute ensemble risk probabilities in under 85ms, and
            stratify risk with precision clinical intelligence.
          </p>

          {/* Action CTAs */}
          <div className="gsap-hero-element flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href={isAuthenticated ? "/Dashboard" : "/signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-neutral-950 hover:bg-neutral-800 dark:text-black dark:bg-white dark:hover:bg-neutral-200 transition-colors shadow-xs"
            >
              <span>{isAuthenticated ? "Launch Dashboard" : "Start Screening"}</span>
              <span className="text-xs font-mono">→</span>
            </Link>

            <a
              href="#simulator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-mono text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 dark:text-neutral-300 dark:bg-black dark:hover:bg-white/[0.05] dark:border-white/[0.12] transition-colors"
            >
              <span>Explore Interactive Sandbox</span>
              <span className="text-neutral-400">↓</span>
            </a>
          </div>
        </div>

        {/* Clinical Live Telemetry Terminal HUD */}
        <div className="gsap-hero-element max-w-4xl mx-auto rounded-xl bg-white dark:bg-[#0a0a0a] border border-neutral-200/80 dark:border-white/[0.12] shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.08] px-4 py-3 bg-neutral-50/80 dark:bg-black/60">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-950 dark:text-white font-medium">telemetry.live</span>
              <span className="text-neutral-500 text-[11px] hidden sm:inline">
                • LEAD II CONTINUOUS ECG (250Hz)
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● STREAMING</span>
              <span className="text-neutral-400 dark:text-neutral-500">IAD1</span>
            </div>
          </div>

          {/* Live Telemetry Content */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Canvas Waveform */}
            <div className="rounded-lg bg-neutral-50 dark:bg-black p-3 border border-neutral-200/80 dark:border-white/[0.08]">
              <canvas ref={canvasRef} className="w-full h-36 sm:h-44 block" />
            </div>

            {/* Vitals Telemetry Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono">
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200/80 dark:border-white/[0.08]">
                <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                  HEART RATE
                </span>
                <div className="text-xl font-bold text-neutral-950 dark:text-white tabular-nums">
                  {bpm} <span className="text-xs text-neutral-500 font-normal">BPM</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Normal Sinus</span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200/80 dark:border-white/[0.08]">
                <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                  RESTING BP
                </span>
                <div className="text-xl font-bold text-neutral-950 dark:text-white tabular-nums">
                  120/80 <span className="text-xs text-neutral-500 font-normal">mmHg</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Optimal Range</span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200/80 dark:border-white/[0.08]">
                <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                  SpO2 OXYGEN
                </span>
                <div className="text-xl font-bold text-neutral-950 dark:text-white tabular-nums">
                  98.5 <span className="text-xs text-neutral-500 font-normal">%</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Target Saturation</span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200/80 dark:border-white/[0.08]">
                <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                  RISK INDEX
                </span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  14% <span className="text-xs text-neutral-500 font-normal">Score</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Low Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
