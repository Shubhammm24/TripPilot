"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  onReset: () => void;
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card"
      style={{ textAlign: "center", padding: 48, maxWidth: 500, margin: "0 auto" }}
    >
      <div style={{ fontSize: 56, marginBottom: 16 }}>🗺️</div>
      <h2 className="headline-sm" style={{ marginBottom: 12 }}>
        No Itinerary Yet
      </h2>
      <p className="body-md" style={{ color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
        Describe your dream trip above and we&apos;ll create a personalized, interactive itinerary for you.
      </p>
      <button className="btn btn-primary" onClick={onReset}>
        ← Back to Input
      </button>
    </motion.div>
  );
}
