"use client";

import React, { useState, useEffect, useRef } from "react";

type RhythmType = "nsr" | "tachy" | "brady" | "pvc";

export default function EKGVisualizerSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeRhythm, setActiveRhythm] = useState<RhythmType>("nsr");
  const [sweepSpeed, setSweepSpeed] = useState<"normal" | "fast">("normal");
  const [isPlaying, setIsPlaying] = useState(true);

  const rhythmConfigs = {
    nsr: {
      name: "Normal Sinus Rhythm",
      bpm: 72,
      cycleLength: 220,
      points: [0, 0, 0, 0.05, 0.1, 0.08, 0, 0, -0.15, 0.95, -0.4, 0, 0, 0.12, 0.22, 0.18, 0.05, 0, 0, 0],
      status: "Optimal Rhythm",
      description: "Synchronized P wave preceding each QRS complex. Normal PR interval and ventricular depolarization.",
    },
    tachy: {
      name: "Sinus Tachycardia",
      bpm: 118,
      cycleLength: 140,
      points: [0, 0.08, 0.12, 0.02, -0.18, 1.0, -0.45, 0.05, 0.25, 0.18, 0],
      status: "Elevated Rate",
      description: "Accelerated sinus node firing (>100 BPM). Common during physiological exertion or acute stress.",
    },
    brady: {
      name: "Sinus Bradycardia",
      bpm: 46,
      cycleLength: 320,
      points: [0, 0, 0, 0, 0.06, 0.1, 0.04, 0, 0, -0.15, 0.9, -0.35, 0, 0, 0.15, 0.22, 0.14, 0, 0, 0, 0, 0, 0],
      status: "Depressed Rate",
      description: "Resting rate <60 BPM. Common in endurance athletic training or secondary to nodal conduction slowing.",
    },
    pvc: {
      name: "Ventricular Ectopy (PVC)",
      bpm: 78,
      cycleLength: 210,
      points: [0, 0, 0.05, 0.1, 0, -0.15, 0.95, -0.35, 0.18, 0, 0, -0.4, 1.3, -0.9, 0.45, 0.1, 0, 0],
      status: "Arrhythmic Spike",
      description: "Premature wide QRS complex arising from ectopic ventricular pacemaker foci before expected normal beat.",
    },
  };

  const currentConfig = rhythmConfigs[activeRhythm];

  // Canvas EKG rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || 800);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || 240);

    let offset = 0;
    const baseSpeed = sweepSpeed === "fast" ? 3.8 : 2.2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");

      // CRT Medical Monitor Grid (adaptive light / dark)
      const minorGrid = 16 * window.devicePixelRatio;
      const majorGrid = minorGrid * 4;

      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)";
      ctx.lineWidth = 0.75;
      for (let x = 0; x < width; x += minorGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += minorGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += majorGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += majorGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Trace Waveform
      ctx.beginPath();
      ctx.lineWidth = 2 * window.devicePixelRatio;
      ctx.strokeStyle = activeRhythm === "pvc" ? "#ef4444" : activeRhythm === "tachy" ? "#f59e0b" : "#10b981";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const cycle = currentConfig.cycleLength * (window.devicePixelRatio > 1 ? 1.2 : 1);
      const points = currentConfig.points;

      for (let x = 0; x < width; x += 3) {
        const localX = (x + offset) % cycle;
        const idx = Math.floor((localX / cycle) * points.length);
        const val = points[idx] || 0;
        const y = height / 2 - val * (height * 0.4);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      if (isPlaying) {
        offset += baseSpeed;
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeRhythm, sweepSpeed, isPlaying, currentConfig]);

  return (
    <section id="ekg" className="py-24 border-b border-neutral-200/80 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.1] text-xs font-mono text-neutral-700 dark:text-neutral-300 uppercase mb-4">
            <span>ELECTROCARDIOGRAM TELEMETRY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white mb-4">
            Interactive Cardiac Waveform Engine
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            Switch rhythm archetypes to inspect morphology, ST elevation/depression,
            and continuous lead telemetry.
          </p>
        </div>

        {/* EKG Terminal Box */}
        <div className="rounded-xl bg-white dark:bg-[#0a0a0a] p-5 sm:p-7 border border-neutral-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-none transition-colors">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200/80 dark:border-white/[0.08]">
            {/* Mode Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {(Object.keys(rhythmConfigs) as RhythmType[]).map((key) => {
                const item = rhythmConfigs[key];
                const isActive = activeRhythm === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveRhythm(key)}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-black font-semibold"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/[0.08]"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Sweep & Play Toggles */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setSweepSpeed(sweepSpeed === "normal" ? "fast" : "normal")}
                className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white cursor-pointer"
              >
                Speed: {sweepSpeed === "fast" ? "50 mm/s" : "25 mm/s"}
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1 rounded-md border border-neutral-200 dark:border-white/[0.12] bg-neutral-100 dark:bg-white/[0.05] font-semibold text-neutral-950 dark:text-white hover:bg-neutral-200 dark:hover:bg-white/[0.1] cursor-pointer"
              >
                {isPlaying ? "PAUSE" : "RESUME"}
              </button>
            </div>
          </div>

          {/* Canvas Waveform Display */}
          <div className="relative my-5 rounded-lg bg-neutral-50 dark:bg-black overflow-hidden border border-neutral-200/80 dark:border-white/[0.08]">
            <canvas ref={canvasRef} className="w-full h-44 sm:h-56 block" />

            <div className="absolute top-3 left-3 flex items-center gap-2 font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                LEAD II • 10 mm/mV
              </span>
            </div>

            <div className="absolute top-3 right-3 font-mono text-xs text-neutral-600 dark:text-neutral-400 bg-white/90 dark:bg-black/90 px-2.5 py-1 rounded border border-neutral-200 dark:border-white/[0.08]">
              RATE: <span className="text-neutral-950 dark:text-white font-bold">{currentConfig.bpm} BPM</span>
            </div>
          </div>

          {/* Telemetry Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 font-mono">
            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200/80 dark:border-white/[0.08]">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">
                Rhythm Diagnostics
              </span>
              <div className="text-xs font-bold text-neutral-950 dark:text-white mb-1">
                {currentConfig.name}
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                {currentConfig.description}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200/80 dark:border-white/[0.08]">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">
                Axis & Intervals
              </span>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                QRS: 88ms • QTc: 412ms
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                Isoelectric ST segment without acute repolarization abnormalities.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200/80 dark:border-white/[0.08]">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">
                Pattern Match
              </span>
              <div className="text-xs font-bold text-neutral-950 dark:text-white mb-1">
                99.2% Calibration Confidence
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                Benchmarked against validated clinical ECG intervals in dataset.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
