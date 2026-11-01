"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";
import { useTheme } from "./ThemeProvider";

interface AppLayoutProps {
    children: React.ReactNode;
    activePage?: "dashboard" | "healthdata" | "history" | "analysis" | "profile";
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function SunIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    );
}

export default function AppLayout({ children, activePage }: AppLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const sidebarRef = useRef<HTMLElement>(null);
    const mobileDrawerRef = useRef<HTMLDivElement>(null);
    const heartIconRef = useRef<SVGSVGElement>(null);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    const currentTab = activePage || (
        pathname?.includes("/Dashboard") ? "dashboard" :
            pathname?.includes("/healthdata") ? "healthdata" :
                pathname?.includes("/history") ? "history" :
                    pathname?.includes("/analysis") ? "analysis" :
                        pathname?.includes("/profile") ? "profile" : "dashboard"
    );

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // GSAP Sidebar Entrance & Heart Pulse Animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate sidebar nav items sequentially
            gsap.fromTo(
                ".gsap-nav-item",
                { opacity: 0, x: -14 },
                { opacity: 1, x: 0, duration: 0.45, stagger: 0.06, ease: "power2.out", delay: 0.1 }
            );

            // Beating heart pulse animation on Telemetry icon
            if (heartIconRef.current) {
                gsap.to(heartIconRef.current, {
                    scale: 1.15,
                    duration: 0.2,
                    repeat: -1,
                    yoyo: true,
                    repeatDelay: 0.9,
                    ease: "power1.inOut",
                    transformOrigin: "center center",
                });
            }
        }, sidebarRef);

        return () => ctx.revert();
    }, []);

    // GSAP Mobile Drawer Open Animation
    useEffect(() => {
        if (mobileMenuOpen && mobileDrawerRef.current) {
            gsap.fromTo(
                mobileDrawerRef.current,
                { x: -300, opacity: 0.5 },
                { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }
            );
        }
    }, [mobileMenuOpen]);

    const handleSignout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auralis_user_profile");
        router.push("/signin");
    };

    const navItems = [
        {
            id: "dashboard",
            href: "/Dashboard",
            label: "Dashboard",
            shortLabel: "Home",
            icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )
        },
        {
            id: "healthdata",
            href: "/healthdata",
            label: "Telemetry",
            shortLabel: "Telemetry",
            icon: (
                <svg ref={heartIconRef} className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )
        },
        {
            id: "analysis",
            href: "/analysis",
            label: "Analysis",
            shortLabel: "Analysis",
            icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            id: "history",
            href: "/history",
            label: "History",
            shortLabel: "History",
            icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: "profile",
            href: "/profile",
            label: "Profile",
            shortLabel: "Profile",
            icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0a0a0a] flex flex-col lg:flex-row font-sans text-neutral-900 dark:text-neutral-100 antialiased selection:bg-neutral-900 selection:text-white transition-colors duration-200">

            {/* ── MOBILE TOP NAVIGATION BAR ── */}
            <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle Navigation Menu"
                        className="p-2 -ml-1 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                    <Link href="/Dashboard" className="flex items-center gap-2.5 group">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-black font-black text-sm shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105">
                            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight text-neutral-950 dark:text-white leading-tight">Auralis Health</span>
                            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 tracking-[0.18em] uppercase">CARDIAC AI</span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-2 relative" ref={profileDropdownRef}>
                    {/* Mobile theme toggle */}
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </button>

                    {/* Quick Avatar Dropdown Toggle (No scrolling required to Sign Out!) */}
                    <button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        aria-label="User menu"
                        className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-xs font-bold shadow-xs hover:opacity-90 transition-opacity focus:ring-2 focus:ring-rose-500"
                    >
                        AH
                    </button>

                    {/* Quick Action Dropdown Popup */}
                    {profileDropdownOpen && (
                        <div className="absolute right-0 top-12 w-52 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                                <p className="text-xs font-bold text-neutral-950 dark:text-white truncate">Patient Account</p>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">Auralis Telemetry</p>
                            </div>
                            <Link
                                href="/profile"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                My Profile & Settings
                            </Link>
                            <button
                                onClick={() => {
                                    setProfileDropdownOpen(false);
                                    handleSignout();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors mt-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Quick Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* ── MOBILE SLIDE-OVER DRAWER MENU ── */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div
                        ref={mobileDrawerRef}
                        className="relative w-80 max-w-[85vw] bg-white dark:bg-neutral-900 h-full shadow-2xl z-10 flex flex-col justify-between p-5 overflow-y-auto"
                    >
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-black font-black text-sm shrink-0 shadow-xs">
                                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-extrabold tracking-tight text-neutral-950 dark:text-white leading-tight">Auralis Health</h2>
                                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-widest uppercase mt-0.5">Cardiovascular AI</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 rounded-xl text-neutral-400 dark:text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Nav Links */}
                            <nav className="mt-4 space-y-1.5">
                                {navItems.map((item) => {
                                    const isActive = currentTab === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${isActive
                                                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm font-bold"
                                                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white"
                                            }`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Drawer Footer - Compact & Always Visible */}
                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2 mt-4">
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                                {theme === "dark" ? "Light Mode" : "Dark Mode"}
                            </button>
                            <button
                                onClick={handleSignout}
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DESKTOP STICKY SIDEBAR ── */}
            <aside
                ref={sidebarRef}
                className="hidden lg:flex w-72 xl:w-80 h-screen sticky top-0 bg-[#F5F5F5] dark:bg-[#111111] border-r border-neutral-200/80 dark:border-neutral-800/80 flex-col justify-between shrink-0 p-6 xl:p-8 transition-colors duration-200"
            >
                <div>
                    <Link href="/Dashboard" className="flex items-center gap-3 group focus:outline-none">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-black font-black shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-105">
                            <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white leading-tight">Auralis Health</h1>
                            <p className="text-[10px] xl:text-[11px] font-bold text-rose-600 dark:text-rose-400 tracking-[0.2em] uppercase mt-0.5">PREMIUM DIAGNOSTICS</p>
                        </div>
                    </Link>

                    <nav className="mt-10 xl:mt-12 space-y-2.5">
                        {navItems.map((item) => {
                            const isActive = currentTab === item.id;
                            return (
                                <Link key={item.id} href={item.href} className="block">
                                    <div
                                        className={`gsap-nav-item w-full flex items-center gap-3.5 px-4 xl:px-5 py-3.5 xl:py-4 rounded-2xl text-base xl:text-lg font-semibold transition-all duration-200 cursor-pointer mt-3 ${isActive
                                            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md border border-neutral-900 dark:border-white scale-[1.02]"
                                            : "bg-[#EAEAEA] dark:bg-[#1e1e1e] text-neutral-800 dark:text-neutral-200 border border-neutral-300/60 dark:border-neutral-700/60 hover:bg-[#DCDCDC] dark:hover:bg-[#2a2a2a] hover:text-neutral-950 dark:hover:text-white hover:scale-[1.01] hover:shadow-sm"
                                        }`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="space-y-3">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 xl:py-3.5 rounded-2xl text-sm xl:text-base font-semibold text-neutral-600 dark:text-neutral-300 bg-[#EAEAEA] dark:bg-[#1e1e1e] border border-neutral-300/60 dark:border-neutral-700/60 hover:bg-neutral-200 dark:hover:bg-[#2a2a2a] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
                    >
                        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>

                    <button
                        onClick={handleSignout}
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl text-sm xl:text-base font-semibold text-neutral-700 dark:text-neutral-300 bg-[#EAEAEA] dark:bg-[#1e1e1e] border border-neutral-300/60 dark:border-neutral-700/60 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition-all cursor-pointer shadow-xs"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                    <p className="text-[11px] text-center text-neutral-400 dark:text-neutral-600 font-medium tracking-wide">
                        Auralis Telemetry Core v2.4
                    </p>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 min-w-0 w-full overflow-x-hidden p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
                {children}
            </main>
        </div>
    );
}
