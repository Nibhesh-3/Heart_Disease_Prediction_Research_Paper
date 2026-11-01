"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { getApiUrl } from "../../lib/api";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim());
}

export default function ForgotPasswordPage() {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const lockIconRef = useRef<SVGSVGElement>(null);
    const successRef = useRef<HTMLDivElement>(null);

    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const isEmailTouched = email.trim().length > 0;
    const isEmailValid = isValidEmail(email);

    // GSAP Entrance Timeline Animation
    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // Animate lock icon
            if (lockIconRef.current) {
                tl.fromTo(
                    lockIconRef.current,
                    { scale: 0, rotate: -20, opacity: 0 },
                    { scale: 1, rotate: 0, opacity: 1, duration: 0.6, ease: "back.out(1.8)" }
                );
            }

            // Animate elements sequentially
            tl.fromTo(
                ".gsap-reveal",
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, clearProps: "transform" },
                "-=0.3"
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // GSAP Error Shake Animation
    useEffect(() => {
        if (error && formRef.current) {
            gsap.fromTo(
                formRef.current,
                { x: -10 },
                { x: 10, duration: 0.08, repeat: 5, yoyo: true, ease: "power1.inOut", clearProps: "x" }
            );
        }
    }, [error]);

    // GSAP Success Reveal Animation
    useEffect(() => {
        if (success && successRef.current) {
            gsap.fromTo(
                successRef.current,
                { scale: 0.85, opacity: 0, y: 15 },
                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" }
            );
        }
    }, [success]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanEmail = email.trim();
        const cleanPwd = newPassword.trim();
        const cleanConfirm = confirmPassword.trim();

        if (!cleanEmail) {
            setError("Please enter your registered email address.");
            return;
        }

        if (!isValidEmail(cleanEmail)) {
            setError("Please provide a valid email format (e.g. name@example.com).");
            return;
        }

        if (!cleanPwd) {
            setError("Please enter a new password.");
            return;
        }

        if (cleanPwd.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (cleanPwd !== cleanConfirm) {
            setError("Passwords do not match.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await fetch(getApiUrl("/forgot-password"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email_or_username: cleanEmail,
                    new_password: cleanPwd,
                    confirm_password: cleanConfirm,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to reset password. Please check your email.");
            }

            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-[#0c0c0c] transition-colors"
        >
            <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
                {/* Back to Sign In button */}
                <div className="mb-6 gsap-reveal">
                    <Link
                        href="/signin"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Sign In
                    </Link>
                </div>

                {/* Card Container */}
                <div className="bg-white py-8 px-6 shadow-xl shadow-neutral-200/50 rounded-3xl sm:px-10 border border-neutral-200/80 dark:bg-[#141414] dark:border-neutral-800 dark:shadow-none">
                    {/* Header Icon */}
                    <div className="flex flex-col items-center mb-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 dark:bg-rose-950/40 dark:border-rose-900/50">
                            {success ? (
                                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" className="fill-emerald-100/50 dark:fill-emerald-950/50" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12.5l2.5 2.5 5.5-5.5" />
                                </svg>
                            ) : (
                                <svg
                                    ref={lockIconRef}
                                    className="w-8 h-8 text-rose-600 dark:text-rose-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            )}
                        </div>

                        <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white gsap-reveal">
                            {success ? "Password Reset Complete" : "Reset Your Password"}
                        </h2>
                        <p className="text-xs text-neutral-500 mt-1.5 max-w-xs leading-5 dark:text-neutral-400 gsap-reveal">
                            {success
                                ? "Your password has been securely updated. You can now access your account."
                                : "Enter your registered email address and define a new secure password."}
                        </p>
                    </div>

                    {/* Success Message & Next Steps */}
                    {success ? (
                        <div ref={successRef} className="space-y-5">
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl dark:bg-emerald-950/30 dark:border-emerald-900/50">
                                <p className="text-xs text-emerald-800 dark:text-emerald-300 text-center font-medium leading-5">
                                    ✓ Password update successful! Please sign in using your new credentials.
                                </p>
                            </div>

                            <button
                                onClick={() => router.replace("/signin")}
                                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors shadow-sm dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 cursor-pointer"
                            >
                                Proceed to Sign In →
                            </button>
                        </div>
                    ) : (
                        /* Reset Form */
                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Registered Email */}
                            <div className="gsap-reveal">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider dark:text-neutral-300">
                                        Registered Email
                                    </label>
                                    {isEmailTouched && (
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                isEmailValid
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                                                    : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
                                            }`}
                                        >
                                            {isEmailValid ? "✓ Valid Email" : "Invalid Format"}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="patient@example.com"
                                    className={`block w-full rounded-xl border px-4 py-3 text-neutral-900 placeholder-neutral-400 text-sm transition-colors dark:text-neutral-100 dark:placeholder-neutral-600 dark:bg-[#181818] ${
                                        isEmailTouched
                                            ? isEmailValid
                                                ? "border-emerald-400 focus:ring-emerald-500 focus:border-emerald-500"
                                                : "border-red-300 focus:ring-red-500 focus:border-red-500"
                                            : "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
                                    }`}
                                />
                            </div>

                            {/* New Password */}
                            <div className="gsap-reveal">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider dark:text-neutral-300">
                                        New Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="Minimum 6 characters"
                                    className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm transition-colors dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-600 dark:bg-[#181818]"
                                />
                            </div>

                            {/* Confirm New Password */}
                            <div className="gsap-reveal">
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300">
                                    Confirm New Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="Re-enter new password"
                                    className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm transition-colors dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-600 dark:bg-[#181818]"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2 gsap-reveal">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white dark:text-neutral-900" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Updating Password...
                                        </span>
                                    ) : (
                                        "Update Password"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
