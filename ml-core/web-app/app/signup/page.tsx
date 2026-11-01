"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGoogleLogin } from '@react-oauth/google';
import { getApiUrl } from '../../lib/api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignUpPage() {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // GSAP Entrance Animation
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".gsap-signup-card",
                { opacity: 0, y: 24, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
            );
            gsap.fromTo(
                ".gsap-signup-item",
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out", delay: 0.15 }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const googleLogin = useGoogleLogin({
        prompt: 'select_account',
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                const res = await fetch(getApiUrl('/auth/google'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: tokenResponse.access_token }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.detail || 'Google sign-up failed');
                }

                const data = await res.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);

                router.replace('/Dashboard');
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Google sign-up failed.');
                }
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google sign-up failed.'),
    });

    const handleGoogleLogin = () => {
        googleLogin();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const cleanEmail = email.trim();
        const cleanUser = username.trim();
        const cleanPwd = password.trim();
        const cleanConfirm = confirmPassword.trim();

        if (!cleanUser || !cleanEmail || !cleanPwd || !cleanConfirm) {
            setError("Please fill in all fields.");
            return;
        }

        if (!EMAIL_REGEX.test(cleanEmail)) {
            setError("Please enter a valid email address (e.g. name@example.com).");
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

        setLoading(true);

        try {
            const response = await fetch(getApiUrl('/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: cleanUser,
                    email: cleanEmail,
                    password: cleanPwd,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to create account');
            }

            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
            }
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }

            router.push('/signin');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="flex min-h-screen bg-white dark:bg-[#161616]">
            {/* Left Side: Branding / Text (Desktop only) */}/
            <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 xl:px-16 bg-neutral-50 border-r border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
                <div className="w-full max-w-lg mx-auto gsap-signup-card">
                    <div className="rounded-3xl bg-white p-8 xl:p-10 border border-neutral-200/80 shadow-sm flex flex-col justify-between min-h-[380px] dark:bg-[#161616] dark:border-neutral-800/80">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-black font-black shadow-xs shrink-0">
                                    <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-xs font-bold text-neutral-700 tracking-wider uppercase dark:bg-neutral-800 dark:text-neutral-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    CLINICAL REGISTRY
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-2 dark:text-neutral-100">
                                Intelligent Telemetry Suite
                            </h2>
                            <p className="text-3xl font-extrabold text-neutral-400 leading-tight">
                                Auralis Health Cloud
                            </p>
                        </div>
                        <div className="pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 dark:border-neutral-900">
                            <span>Diagnostic Protocol &bull; Cleveland Model</span>
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">v2.4</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Sign Up Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-5 sm:px-12 py-10 sm:py-16">
                <div className="max-w-md w-full mx-auto space-y-6">
                    <div className="lg:hidden mb-6 gsap-signup-item flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-black font-black shrink-0 shadow-xs">
                            <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 leading-tight">
                                Auralis Health
                            </h1>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mt-0.5">
                                Cardiovascular AI Telemetry
                            </p>
                        </div>
                    </div>

                    <div className="gsap-signup-item">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">Create Account</h2>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1 mb-6">
                            Register to begin logging clinical assessments and SHAP feature breakdowns.
                        </p>

                        {error && (
                            <div className="mb-4 p-3.5 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl dark:text-red-400 dark:bg-red-950/30 dark:border-red-900/50">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="gsap-signup-item">
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm transition-colors dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-600 dark:bg-[#181818]"
                                    placeholder="johndoe"
                                />
                            </div>

                            <div className="gsap-signup-item">
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300" htmlFor="email">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm transition-colors dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-600 dark:bg-[#181818]"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="gsap-signup-item">
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm transition-colors dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-600 dark:bg-[#181818]"
                                    placeholder="Minimum 6 characters"
                                />
                            </div>

                            <div className="gsap-signup-item">
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 dark:text-neutral-300" htmlFor="confirm-password">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm transition-colors dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-600 dark:bg-[#181818]"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center rounded-xl bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-neutral-800 disabled:opacity-50 transition-colors cursor-pointer dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 gsap-signup-item"
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </form>

                        <div className="relative flex py-5 items-center gsap-signup-item">
                            <div className="grow border-t border-neutral-200 dark:border-neutral-800"></div>
                            <span className="shrink mx-4 text-[11px] text-neutral-400 uppercase font-bold">Or continue with</span>
                            <div className="grow border-t border-neutral-200 dark:border-neutral-800"></div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            type="button"
                            className="w-full flex items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer dark:border-neutral-700 dark:bg-[#161616] dark:text-neutral-300 gsap-signup-item"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                                <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.45 2.69 29.5.5 24 .5 14.98.5 7.28 5.92 3.44 13.63l7.1 5.52C12.4 13.12 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.97-2.2 5.48-4.67 7.17l7.18 5.57C43.44 37.53 46.5 31.47 46.5 24.5z" />
                                <path fill="#FBBC05" d="M10.54 28.85A14.6 14.6 0 0 1 9.5 24c0-1.69.29-3.32.8-4.85l-7.1-5.52A23.47 23.47 0 0 0 .5 24c0 3.77.9 7.34 2.5 10.48l7.54-5.63z" />
                                <path fill="#34A853" d="M24 47.5c5.5 0 10.12-1.82 13.49-4.94l-7.18-5.57c-1.88 1.26-4.28 2.01-6.31 2.01-6.26 0-11.6-3.62-13.46-8.15l-7.54 5.63C7.28 42.08 14.98 47.5 24 47.5z" />
                            </svg>
                            Sign up with Google
                        </button>

                        <div className="mt-6 text-center gsap-signup-item">
                            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                                Already have an account?{' '}
                                <Link href="/signin" className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
