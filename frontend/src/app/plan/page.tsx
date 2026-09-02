"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/app/components/Navbar";
import ItineraryView from "@/app/components/ItineraryView";
import ErrorState from "@/app/components/ErrorState";
import EmptyState from "@/app/components/EmptyState";
import type { Itinerary } from "@/app/components/ItineraryView";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const EASE_CURVE = [0.4, 0, 0.2, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [...EASE_CURVE] as [number, number, number, number] } },
};

const EXAMPLE_PROMPTS = [
  "3-day trip to Tokyo on a $1500 budget. I love street food, anime culture, and quiet temples.",
  "Weekend getaway to Goa with friends. Budget ₹25,000. Beach vibes, seafood, nightlife.",
  "5-day solo backpacking in Vietnam — Hanoi to Ho Chi Minh. Under $800. Food and history focused.",
  "Family trip to Paris, 4 days. Two kids under 10. ~€2000 budget. Kid-friendly activities please.",
];

type Stage = "input" | "loading" | "result" | "error";

interface ErrorInfo {
  message: string;
  type: string | null;
  rawResponse: string | null;
}

export default function PlanPage() {
  const [stage, setStage] = useState<Stage>("input");
  const [prompt, setPrompt] = useState("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Request ID to prevent stale responses from overwriting newer ones
  const requestIdRef = useRef(0);

  const handleSubmit = useCallback(async () => {
    const currentPrompt = prompt.trim();
    if (!currentPrompt) return;

    // Increment request ID — any response with a stale ID gets discarded
    const thisRequestId = ++requestIdRef.current;

    setStage("loading");
    setErrorInfo(null);
    setLoadingSteps(["✨ Analyzing your trip description…"]);

    // Staggered loading steps for UX
    const timer1 = setTimeout(() => setLoadingSteps(prev => [...prev, "🌍 Researching destinations…"]), 1500);
    const timer2 = setTimeout(() => setLoadingSteps(prev => [...prev, "📋 Building day-by-day plan…"]), 3500);
    const timer3 = setTimeout(() => setLoadingSteps(prev => [...prev, "💰 Estimating budget…"]), 5500);
    const timer4 = setTimeout(() => setLoadingSteps(prev => [...prev, "📍 Looking up coordinates…"]), 7500);

    // AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

    try {
      const res = await fetch(`${API_URL}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentPrompt }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Stale response guard
      if (thisRequestId !== requestIdRef.current) {
        console.log("[TripPilot] Discarding stale response", thisRequestId, "current:", requestIdRef.current);
        return;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown server error");
        setErrorInfo({
          message: `Server error (${res.status}): ${errText}`,
          type: "network",
          rawResponse: null,
        });
        setStage("error");
        return;
      }

      const data = await res.json();

      // Stale response guard (after JSON parse)
      if (thisRequestId !== requestIdRef.current) {
        return;
      }

      if (!data.success) {
        setErrorInfo({
          message: data.error || "Unknown error occurred",
          type: data.error_type || "network",
          rawResponse: data.raw_response || null,
        });
        setStage("error");
        return;
      }

      if (!data.itinerary || !data.itinerary.days || data.itinerary.days.length === 0) {
        setErrorInfo({
          message: "The AI returned an empty itinerary. Try being more specific about your destination, dates, and interests.",
          type: "empty",
          rawResponse: null,
        });
        setStage("error");
        return;
      }

      setItinerary(data.itinerary);
      setStage("result");
    } catch (err: unknown) {
      // Stale response guard
      if (thisRequestId !== requestIdRef.current) return;

      if (err instanceof DOMException && err.name === "AbortError") {
        setErrorInfo({
          message: "The request took too long (over 120 seconds). The AI might be overloaded. Please try again.",
          type: "timeout",
          rawResponse: null,
        });
      } else {
        setErrorInfo({
          message: `Could not connect to the backend at ${API_URL}. Make sure the server is running.`,
          type: "network",
          rawResponse: null,
        });
      }
      setStage("error");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timeoutId);
    }
  }, [prompt]);

  const handleRetry = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  const handleReset = useCallback(() => {
    setStage("input");
    setItinerary(null);
    setErrorInfo(null);
    setFeedback("");
    setRefineError(null);
  }, []);

  const handleItineraryChange = useCallback((updated: Itinerary) => {
    setItinerary(updated);
  }, []);

  const handleRefine = useCallback(async () => {
    if (!feedback.trim() || !itinerary) return;

    setRefining(true);
    setRefineError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${API_URL}/api/refine-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_itinerary: itinerary,
          feedback: feedback.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!data.success) {
        setRefineError(data.error || "Refinement failed. Try again.");
        return;
      }

      if (data.itinerary) {
        setItinerary(data.itinerary);
        setFeedback("");
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setRefineError("Refinement timed out. Please try again.");
      } else {
        setRefineError("Could not connect to the server.");
      }
    } finally {
      setRefining(false);
      clearTimeout(timeoutId);
    }
  }, [feedback, itinerary]);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 96, minHeight: "100vh" }}>
        <div className="container">
          <AnimatePresence mode="wait">
            {/* ═══════════════ INPUT STAGE ═══════════════ */}
            {stage === "input" && (
              <motion.div
                key="input"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                variants={fadeUp}
                style={{ maxWidth: 720, margin: "0 auto" }}
              >
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <h1 className="display-sm gradient-text">Plan Your Trip</h1>
                  <p className="body-lg" style={{ color: "var(--muted)", marginTop: 12 }}>
                    Describe your dream trip in your own words — destination, dates, budget, interests — and our AI will build an interactive itinerary.
                  </p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                  <label className="input-label" htmlFor="trip-prompt">
                    Describe your trip
                  </label>
                  <textarea
                    id="trip-prompt"
                    className="input-field"
                    placeholder="e.g. I want to spend 4 days in Kyoto, Japan with a $1200 budget. I love traditional temples, zen gardens, matcha desserts, and want to catch the cherry blossom season…"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    style={{
                      resize: "vertical",
                      marginBottom: 20,
                      fontSize: 16,
                      lineHeight: 1.6,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSubmit();
                      }
                    }}
                  />

                  <button
                    className="btn btn-primary btn-lg btn-full"
                    onClick={handleSubmit}
                    disabled={!prompt.trim()}
                    style={{ opacity: prompt.trim() ? 1 : 0.5 }}
                  >
                    ✨ Generate Itinerary
                  </button>

                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
                    Press <kbd style={{ background: "var(--surface-high)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>Ctrl</kbd>+<kbd style={{ background: "var(--surface-high)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>Enter</kbd> to submit
                  </p>
                </div>

                {/* Example Prompts */}
                <div style={{ marginTop: 32 }}>
                  <div className="label-sm" style={{ color: "var(--muted)", marginBottom: 16, textAlign: "center" }}>
                    Try an example
                  </div>
                  <div className="example-prompts-grid">
                    {EXAMPLE_PROMPTS.map((example, i) => (
                      <button
                        key={i}
                        className="example-prompt-card"
                        onClick={() => setPrompt(example)}
                      >
                        <span style={{ fontSize: 13, color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
                          {example}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: 64 }} />
              </motion.div>
            )}

            {/* ═══════════════ LOADING STAGE ═══════════════ */}
            {stage === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "60vh",
                  gap: 32,
                }}
              >
                {/* Spinner */}
                <div style={{ position: "relative", width: 80, height: 80 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      border: "3px solid var(--outline)",
                      borderTopColor: "var(--primary)",
                    }}
                  />
                </div>

                <div style={{ textAlign: "center" }}>
                  <h2 className="headline-sm" style={{ marginBottom: 8 }}>
                    Crafting Your Itinerary
                  </h2>
                  <p className="body-md" style={{ color: "var(--muted)" }}>
                    The AI is analyzing your trip and building a structured plan…
                  </p>
                </div>

                {/* Activity Feed */}
                <div className="glass-card" style={{ width: "100%", maxWidth: 400 }}>
                  <div className="label-sm" style={{ color: "var(--secondary)", marginBottom: 16 }}>
                    Progress
                  </div>
                  {loadingSteps.map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: i < loadingSteps.length - 1 ? "1px solid var(--outline-variant)" : "none",
                        fontSize: 14,
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--secondary)",
                          display: "inline-block",
                        }}
                      />
                      {step}
                    </motion.div>
                  ))}
                </div>

                {/* Prompt preview */}
                <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic", maxWidth: 400, textAlign: "center" }}>
                  &quot;{prompt.length > 120 ? prompt.slice(0, 120) + "…" : prompt}&quot;
                </p>
              </motion.div>
            )}

            {/* ═══════════════ ERROR STAGE ═══════════════ */}
            {stage === "error" && errorInfo && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ paddingTop: 48 }}
              >
                <ErrorState
                  error={errorInfo.message}
                  errorType={errorInfo.type}
                  rawResponse={errorInfo.rawResponse}
                  onRetry={handleRetry}
                  onReset={handleReset}
                />
              </motion.div>
            )}

            {/* ═══════════════ RESULT STAGE ═══════════════ */}
            {stage === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {itinerary ? (
                  <div className="result-layout">
                    {/* Main Content */}
                    <div className="result-main">
                      <ItineraryView
                        itinerary={itinerary}
                        onItineraryChange={handleItineraryChange}
                      />
                    </div>

                    {/* Sidebar */}
                    <div className="result-sidebar">
                      {/* Refine */}
                      <div className="glass-card">
                        <div className="label-sm" style={{ color: "var(--primary)", marginBottom: 12 }}>
                          ✏️ Refine Your Trip
                        </div>
                        <textarea
                          className="input-field"
                          placeholder="e.g. Add more street food stops, swap Day 2 for a beach day…"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={3}
                          style={{ resize: "vertical", marginBottom: 12 }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              handleRefine();
                            }
                          }}
                        />
                        <button
                          className="btn btn-primary btn-full"
                          onClick={handleRefine}
                          disabled={refining || !feedback.trim()}
                          style={{ opacity: refining || !feedback.trim() ? 0.5 : 1 }}
                        >
                          {refining ? (
                            <>
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                style={{ display: "inline-block" }}
                              >
                                ⟳
                              </motion.span>
                              {" "}Refining…
                            </>
                          ) : (
                            "Refine ✨"
                          )}
                        </button>
                        {refineError && (
                          <p style={{ color: "var(--error)", fontSize: 13, marginTop: 8 }}>
                            {refineError}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-full"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(itinerary, null, 2));
                            alert("Itinerary JSON copied to clipboard!");
                          }}
                        >
                          📋 Copy JSON
                        </button>
                        <button className="btn btn-ghost btn-full" onClick={handleReset}>
                          ← Start Over
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState onReset={handleReset} />
                )}
                <div style={{ height: 64 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
