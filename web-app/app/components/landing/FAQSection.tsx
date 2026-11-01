"use client";

import React, { useState } from "react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What clinical biomarkers does Auralis evaluate for risk prediction?",
      a: "Auralis evaluates 14 standardized clinical biomarkers: Age, Biological Sex, Chest Pain Type (cp), Resting Blood Pressure (trestbps), Serum Cholesterol (chol), Fasting Blood Sugar (fbs), Resting Electrocardiographic results (restecg), Maximum Heart Rate Achieved (thalach), Exercise Induced Angina (exang), ST Depression induced by exercise (oldpeak), Slope of Peak Exercise ST Segment (slope), Number of Major Vessels colored by fluoroscopy (ca), and Thallium Scintigraphy Stress Score (thal).",
    },
    {
      q: "How is the clinical predictive model trained and validated?",
      a: "The ensemble neural model is benchmarked across clinical reference datasets utilizing k-fold cross-validation. It achieves a 98.4% ROC-AUC score, evaluating non-linear feature interactions between resting ECG, exercise tolerance, and coronary fluoroscopy vectors.",
    },
    {
      q: "How is patient health data secured and protected?",
      a: "All patient vitals and telemetry streams are encrypted in transit using TLS 1.3 and at rest with AES-256. Auralis uses tokenized session authentication and zero-knowledge architectures, ensuring your diagnostic records remain confidential and secure.",
    },
    {
      q: "Can Auralis be used as a standalone diagnostic replacement for cardiologists?",
      a: "No. Auralis is an advanced Clinical Decision Support System (CDSS) designed to assist healthcare professionals, researchers, and proactive individuals with early risk stratification. It should always be interpreted alongside clinical examinations and professional medical consultation.",
    },
    {
      q: "How does the historical telemetry tracking feature work?",
      a: "When signed into your account, every health checkup is saved chronologically. The longitudinal analytics engine computes dynamic risk trajectories, alerting you to cardiovascular improvements or escalating risk vectors across time.",
    },
  ];

  return (
    <section id="faq" className="py-24 border-b border-neutral-200/80 dark:border-white/[0.08]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.1] text-xs font-mono text-neutral-700 dark:text-neutral-300 uppercase mb-4">
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white mb-4">
            Platform &amp; Clinical Details
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            Answers to common clinical, technological, and telemetry questions.
          </p>
        </div>

        {/* Accordion List */}
        <div className="divide-y divide-neutral-200/80 dark:divide-white/[0.08] border-y border-neutral-200/80 dark:border-white/[0.08]">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-neutral-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-neutral-300 transition-colors">
                    {faq.q}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-500 font-mono text-sm transition-transform duration-200">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="pt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans pr-6">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
