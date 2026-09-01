"use client";

import { motion } from "framer-motion";

interface ErrorStateProps {
  error: string;
  errorType?: string | null;
  rawResponse?: string | null;
  onRetry: () => void;
  onReset: () => void;
}

const ERROR_CONFIG: Record<string, { icon: string; title: string }> = {
  parse: { icon: "🔧", title: "Invalid AI Response" },
  schema: { icon: "📋", title: "Unexpected Data Shape" },
  empty: { icon: "📭", title: "No Results" },
  network: { icon: "🌐", title: "Connection Error" },
  timeout: { icon: "⏱️", title: "Request Timed Out" },
};

export default function ErrorState({
  error,
  errorType,
  rawResponse,
  onRetry,
  onReset,
}: ErrorStateProps) {
  const config = ERROR_CONFIG[errorType || "network"] || ERROR_CONFIG.network;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card"
      style={{ textAlign: "center", padding: 48, maxWidth: 600, margin: "0 auto" }}
    >
      <div style={{ fontSize: 56, marginBottom: 16 }}>{config.icon}</div>
      <h2 className="headline-sm" style={{ marginBottom: 12 }}>
        {config.title}
      </h2>
      <p className="body-md" style={{ color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
        {error}
      </p>

      {/* Show raw response preview for parse/schema errors */}
      {rawResponse && (errorType === "parse" || errorType === "schema") && (
        <details
          style={{
            textAlign: "left",
            marginBottom: 24,
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: "var(--radius-md)",
            padding: 16,
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 13,
              fontFamily: "var(--font-label)",
            }}
          >
            Show raw AI response
          </summary>
          <pre
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "var(--on-surface-variant)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            {rawResponse}
          </pre>
        </details>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={onRetry}>
          🔄 Retry
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          ← Try a different prompt
        </button>
      </div>
    </motion.div>
  );
}
