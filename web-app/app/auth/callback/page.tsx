"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function AuthCallbackPage() {
    const router = useRouter();
    const spinnerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".gsap-callback-item",
                { opacity: 0, scale: 0.9, y: 10 },
                { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }
            );
        });

        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const redirectTo = params.get("redirect_to") || "/Dashboard";

        if (accessToken) {
            localStorage.setItem("access_token", accessToken);
        }
        if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
        }

        // Seamless transition to Home Dashboard
        const timeout = setTimeout(() => {
            router.replace(redirectTo);
        }, 600);

        return () => {
            clearTimeout(timeout);
            ctx.revert();
        };
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] text-white">
            <div className="text-center space-y-4 max-w-sm px-6">
                <div
                    ref={spinnerRef}
                    className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto gsap-callback-item"
                />
                <h2 className="text-lg font-bold text-white tracking-tight gsap-callback-item">
                    Authentication Verified
                </h2>
                <p className="text-xs text-neutral-400 gsap-callback-item">
                    Loading clinical telemetry dashboard...
                </p>
            </div>
        </div>
    );
}
