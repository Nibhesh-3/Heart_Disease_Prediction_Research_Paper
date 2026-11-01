"use client";

/**
 * VoiceAgent.tsx — Aura AI Voice Assistant (Web / Next.js)
 *
 * Fully free stack:
 *  • STT  → window.SpeechRecognition (Web Speech API — browser built-in, free)
 *  • LLM  → POST /voice/chat (DeepSeek via backend)
 *  • TTS  → window.speechSynthesis (browser built-in, free)
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getApiUrl } from "../../lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

export interface PatientContext {
  risk_percentage?: number;
  overall_risk_percentage?: number;
  risk_level?: string;
  clinical_guidance?: string;
  overall_llm_analysis?: string;
  total_assessments?: number;
  trend?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VoiceAgentProps {
  patientContext?: PatientContext;
}

// Extend window for browser SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ── VoiceAgent ─────────────────────────────────────────────────────────────

export default function VoiceAgent({ patientContext }: VoiceAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Aura, your cardiovascular health assistant. Click the mic or type to ask me anything about your heart health.",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsMounted(true);
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  // Keyboard shortcut: Space to toggle mic
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setIsOpen(false);
        stopListening();
        window.speechSynthesis?.cancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // ── Speech Recognition ────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
      // Auto-send after recognition
      sendMessageText(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ── TTS ───────────────────────────────────────────────────────────────────

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Try to use a premium voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("google us english")
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Chat ──────────────────────────────────────────────────────────────────

  const sendMessageText = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? inputText).trim();
      if (!text || isLoading) return;

      setInputText("");
      const userMsg: Message = {
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const token = localStorage.getItem("access_token");
        const history = messages
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch(getApiUrl("/voice/chat"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text,
            history,
            patient_context: patientContext ?? null,
          }),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        const reply: string =
          data.response ?? "I'm sorry, I couldn't generate a response.";

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply, timestamp: new Date() },
        ]);

        speakText(reply);
      } catch (err) {
        const fallback =
          "I'm having trouble connecting. Please check your connection and try again.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fallback, timestamp: new Date() },
        ]);
        speakText(fallback);
      } finally {
        setIsLoading(false);
      }
    },
    [inputText, messages, isLoading, patientContext, speakText]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessageText();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating Trigger Button ─────────────────────────── */}
      <button
        id="voice-agent-fab"
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 9999,
          width: "62px",
          height: "62px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
          boxShadow: "0 0 0 0 rgba(99,102,241,0.5)",
          animation: "aura-pulse 2.4s infinite",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "26px",
          transition: "transform 0.15s ease",
        }}
        title="Open Aura Health Assistant"
        aria-label="Open Aura voice health assistant"
      >
        🎙️
      </button>

      {/* ── Voice Agent Panel ───────────────────────────────── */}
      <div
        id="voice-agent-panel"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 9999,
          width: "380px",
          maxHeight: "560px",
          borderRadius: "24px",
          overflow: "hidden",
          display: isOpen ? "flex" : "none",
          flexDirection: "column",
          background: "rgba(10, 10, 20, 0.97)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Animated status orb */}
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isListening
                  ? "#ef4444"
                  : isSpeaking
                  ? "#8b5cf6"
                  : isLoading
                  ? "#38bdf8"
                  : "#22c55e",
                boxShadow: isListening
                  ? "0 0 8px #ef4444"
                  : isSpeaking
                  ? "0 0 8px #8b5cf6"
                  : "none",
                transition: "all 0.3s ease",
                animation:
                  isListening || isSpeaking ? "status-blink 1s infinite" : "none",
              }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#f1f5f9",
                  letterSpacing: "0.3px",
                }}
              >
                Aura
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: "#64748b",
                  marginTop: "1px",
                }}
              >
                {isListening
                  ? "Listening…"
                  : isSpeaking
                  ? "Speaking…"
                  : isLoading
                  ? "Thinking…"
                  : "Heart health assistant"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isSpeaking && (
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                }}
                style={{
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "12px",
                  color: "#a78bfa",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                ⏸ Stop
              </button>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                stopListening();
                window.speechSynthesis?.cancel();
                setIsSpeaking(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#475569",
                fontSize: "20px",
                cursor: "pointer",
                lineHeight: 1,
                padding: "2px",
              }}
              aria-label="Close Aura"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "4px",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "2px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    A
                  </div>
                  <span style={{ fontSize: "10px", color: "#475569", fontWeight: 600 }}>
                    Aura
                  </span>
                </div>
              )}
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                      : "rgba(255,255,255,0.06)",
                  border: "1px solid",
                  borderColor:
                    msg.role === "user"
                      ? "rgba(99,102,241,0.3)"
                      : "rgba(255,255,255,0.07)",
                  color: msg.role === "user" ? "#fff" : "#e2e8f0",
                  fontSize: "14px",
                  lineHeight: "1.55",
                }}
              >
                {msg.content}
              </div>
              <span
                suppressHydrationWarning
                style={{
                  fontSize: "10px",
                  color: "#334155",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {isMounted
                  ? msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "2px",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  A
                </div>
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 0.2, 0.4].map((delay) => (
                    <div
                      key={delay}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#6366f1",
                        animation: `typing-dot 1.2s infinite ${delay}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          {/* Mic Button */}
          <button
            id="voice-agent-mic-btn"
            onClick={speechSupported ? toggleListening : undefined}
            title={speechSupported ? (isListening ? "Stop listening" : "Speak your question") : "Speech recognition not supported in this browser"}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border: "none",
              cursor: speechSupported ? "pointer" : "default",
              flexShrink: 0,
              background: isListening
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: isListening
                ? "0 0 16px rgba(239,68,68,0.6)"
                : "0 4px 12px rgba(99,102,241,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              animation: isListening ? "mic-pulse 1s infinite" : "none",
              opacity: speechSupported ? 1 : 0.5,
              transition: "all 0.2s ease",
            }}
          >
            {isListening ? "⏹" : "🎤"}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            id="voice-agent-text-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aura anything…"
            disabled={isLoading}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              color: "#f1f5f9",
              fontSize: "14px",
              padding: "10px 16px",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(99,102,241,0.5)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.08)")
            }
          />

          {/* Send Button */}
          <button
            id="voice-agent-send-btn"
            onClick={() => sendMessageText()}
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: "none",
              cursor: inputText.trim() && !isLoading ? "pointer" : "default",
              flexShrink: 0,
              background:
                inputText.trim() && !isLoading
                  ? "linear-gradient(135deg, #6366f1, #a78bfa)"
                  : "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: inputText.trim() && !isLoading ? 1 : 0.35,
              transition: "all 0.2s ease",
              boxShadow:
                inputText.trim() && !isLoading
                  ? "0 4px 12px rgba(99,102,241,0.35)"
                  : "none",
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* Global keyframe animations */}
      <style>{`
        @keyframes aura-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5), 0 8px 24px rgba(99,102,241,0.4); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(99,102,241,0), 0 8px 24px rgba(99,102,241,0.4); transform: scale(1.05); }
        }
        @keyframes mic-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        @keyframes status-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        #voice-agent-fab:hover { transform: scale(1.08); }
        #voice-agent-panel *::-webkit-scrollbar { width: 4px; }
        #voice-agent-panel *::-webkit-scrollbar-track { background: transparent; }
        #voice-agent-panel *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>
    </>
  );
}
