"use client";

import React, { useRef, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export default function Template({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        // Animate page content smoothly on every route change
        const ctx = gsap.context(() => {
            gsap.fromTo(
                containerRef.current,
                {
                    opacity: 0,
                    y: 12,
                    filter: "blur(4px)",
                },
                {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    duration: 0.4,
                    ease: "power2.out",
                    clearProps: "filter",
                }
            );
        }, containerRef);

        return () => ctx.revert();
    }, [pathname]);

    return (
        <div ref={containerRef} className="w-full min-h-full flex-1 flex flex-col">
            {children}
        </div>
    );
}
