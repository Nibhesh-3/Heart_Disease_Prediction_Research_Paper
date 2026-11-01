"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface AnimatedRiskOrbProps {
    percentage: number;
    stateLabel: string;
    riskLevel: {
        label: string;
        color: string;
        stroke: string;
        bg: string;
        border: string;
        dot: string;
    };
}

export default function AnimatedRiskOrb({
    percentage,
    stateLabel,
    riskLevel,
}: AnimatedRiskOrbProps) {
    const orbRef = useRef<HTMLDivElement>(null);
    const pulseRingRef = useRef<HTMLDivElement>(null);
    const circleProgressRef = useRef<SVGCircleElement>(null);
    const [displayPercentage, setDisplayPercentage] = useState(0);

    // SVG Circle Dimensions
    const size = 260; // viewBox width/height
    const strokeWidth = 8;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        const ctx = gsap.context(() => {
            // 1. Number Counter Animation
            const countObj = { val: 0 };
            gsap.to(countObj, {
                val: percentage,
                duration: 1.8,
                ease: "power3.out",
                onUpdate: () => {
                    setDisplayPercentage(Math.round(countObj.val));
                },
            });

            // 2. SVG Circular Progress Ring Animation
            if (circleProgressRef.current) {
                const targetOffset = circumference - (percentage / 100) * circumference;
                gsap.fromTo(
                    circleProgressRef.current,
                    { strokeDashoffset: circumference },
                    {
                        strokeDashoffset: targetOffset,
                        duration: 1.8,
                        ease: "power3.out",
                    }
                );
            }

            // 3. Gentle Floating Animation for the Orb
            if (orbRef.current) {
                gsap.to(orbRef.current, {
                    y: -6,
                    duration: 2.2,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });
            }

            // 4. Soft Breathing Pulse Ring
            if (pulseRingRef.current) {
                gsap.to(pulseRingRef.current, {
                    scale: 1.12,
                    opacity: 0.25,
                    duration: 1.8,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });
            }
        }, orbRef);

        return () => ctx.revert();
    }, [percentage, circumference]);

    return (
        <div className="relative flex items-center justify-center my-auto py-4 select-none">
            {/* Ambient Breathing Pulse Ring Behind Orb */}
            <div
                ref={pulseRingRef}
                className="absolute w-56 h-56 sm:w-68 sm:h-68 rounded-full pointer-events-none opacity-40 blur-xl transition-colors duration-500"
                style={{
                    backgroundColor:
                        percentage >= 70
                            ? "#ef4444"
                            : percentage >= 40
                            ? "#f59e0b"
                            : "#10b981",
                }}
            />

            {/* Main Floating Orb Container */}
            <div ref={orbRef} className="relative flex items-center justify-center">
                {/* SVG Progress Circle Overlay */}
                <svg
                    className="absolute w-52 h-52 sm:w-66 sm:h-66 -rotate-90 pointer-events-none z-20"
                    viewBox={`0 0 ${size} ${size}`}
                >
                    <defs>
                        <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            {percentage >= 70 ? (
                                <>
                                    <stop offset="0%" stopColor="#f43f5e" />
                                    <stop offset="100%" stopColor="#dc2626" />
                                </>
                            ) : percentage >= 40 ? (
                                <>
                                    <stop offset="0%" stopColor="#fbbf24" />
                                    <stop offset="100%" stopColor="#d97706" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#059669" />
                                </>
                            )}
                        </linearGradient>
                    </defs>

                    {/* Track Background */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-neutral-200/60 dark:text-neutral-800/60"
                    />

                    {/* Animated Progress Indicator */}
                    <circle
                        ref={circleProgressRef}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="url(#orbGrad)"
                        strokeWidth={strokeWidth + 1}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                        className="transition-all duration-300"
                    />
                </svg>

                {/* Soft Spherical Center Glass Orb */}
                <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#FFFFFF] via-[#F4F5F7] to-[#E2E6EA] dark:from-black dark:via-black dark:to-black border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-4px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.08),inset_0_-4px_8px_rgba(0,0,0,0.3)] transition-all duration-300 z-10">
                    {/* Header Label */}
                    <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase select-none">
                        RISK SCORE
                    </span>

                    {/* Central Animated Risk Number */}
                    <div className="my-1 sm:my-1.5 flex items-baseline justify-center">
                        <span className="text-5xl sm:text-7xl font-black tracking-tight text-neutral-950 select-none dark:text-white tabular-nums">
                            {displayPercentage}
                        </span>
                        <span className="text-2xl sm:text-4xl font-bold text-neutral-950 ml-0.5 select-none dark:text-white">
                            %
                        </span>
                    </div>

                    {/* Status Subtitle Badge */}
                    <span
                        className="text-[9px] sm:text-[11px] font-bold tracking-[0.18em] uppercase px-2.5 py-0.5 rounded-full"
                        style={{
                            color:
                                percentage >= 70
                                    ? "#dc2626"
                                    : percentage >= 40
                                    ? "#d97706"
                                    : "#059669",
                            backgroundColor:
                                percentage >= 70
                                    ? "rgba(254, 226, 226, 0.6)"
                                    : percentage >= 40
                                    ? "rgba(254, 243, 199, 0.6)"
                                    : "rgba(209, 250, 229, 0.6)",
                        }}
                    >
                        {stateLabel}
                    </span>
                </div>
            </div>
        </div>
    );
}
