"use client";

import React from "react";
import LandingNavbar from "./components/landing/LandingNavbar";
import HeroSection from "./components/landing/HeroSection";
import LiveSimulatorSection from "./components/landing/LiveSimulatorSection";
import FeaturesGridSection from "./components/landing/FeaturesGridSection";
import EKGVisualizerSection from "./components/landing/EKGVisualizerSection";
import WorkflowSection from "./components/landing/WorkflowSection";
import StatsAndValidationSection from "./components/landing/StatsAndValidationSection";
import FAQSection from "./components/landing/FAQSection";
import LandingCTA from "./components/landing/LandingCTA";
import LandingFooter from "./components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-black text-neutral-900 dark:text-white selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-200">
      {/* Fixed Glassmorphism Top Navigation with Theme Toggle */}
      <LandingNavbar />

      {/* Main Landing Page Content */}
      <main className="flex-1">
        <HeroSection />
        <LiveSimulatorSection />
        <FeaturesGridSection />
        <EKGVisualizerSection />
        <WorkflowSection />
        <StatsAndValidationSection />
        <FAQSection />
        <LandingCTA />
      </main>

      {/* Global Landing Footer */}
      <LandingFooter />
    </div>
  );
}
