"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Stop {
  id: string;
  name: string;
  time: string;
  duration_minutes: number;
  category: string;
  description: string;
  cost_estimate: string;
  tips: string;
  lat: number;
  lon: number;
}

interface StopCardProps {
  stop: Stop;
  index: number;
  onRemove: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  attraction: { icon: "🏛️", color: "#6366f1", label: "Attraction" },
  restaurant: { icon: "🍽️", color: "#f59e0b", label: "Restaurant" },
  hotel: { icon: "🏨", color: "#8b5cf6", label: "Hotel" },
  transport: { icon: "🚗", color: "#64748b", label: "Transport" },
  shopping: { icon: "🛍️", color: "#ec4899", label: "Shopping" },
  entertainment: { icon: "🎭", color: "#06b6d4", label: "Entertainment" },
  activity: { icon: "⛰️", color: "#10b981", label: "Activity" },
};

export default function StopCard({
  stop,
  index,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: StopCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const catConfig = CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.attraction;

  const handleRemove = () => {
    if (confirmRemove) {
      onRemove(stop.id);
    } else {
      setConfirmRemove(true);
      // Auto-dismiss confirmation after 3 seconds
      setTimeout(() => setConfirmRemove(false), 3000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: 0,
        scale: isDragging ? 0.98 : 1,
      }}
      exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e as unknown as React.DragEvent, index);
      }}
      onDragEnd={onDragEnd}
      className="stop-card"
      style={{
        borderTop: isDragOver ? "2px solid var(--primary)" : "2px solid transparent",
        cursor: "grab",
      }}
    >
      {/* Header Row */}
      <div
        className="stop-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Drag Handle */}
        <div className="stop-drag-handle" title="Drag to reorder">
          <span>⠿</span>
        </div>

        {/* Category Icon */}
        <div
          className="stop-category-badge"
          style={{ background: `${catConfig.color}20`, borderColor: `${catConfig.color}40` }}
        >
          <span style={{ fontSize: 18 }}>{catConfig.icon}</span>
        </div>

        {/* Name & Time */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="stop-name">{stop.name}</div>
          <div className="stop-meta">
            {stop.time && <span>🕐 {stop.time}</span>}
            {stop.duration_minutes > 0 && <span>⏱️ {stop.duration_minutes}min</span>}
            {stop.cost_estimate && <span style={{ color: catConfig.color }}>💰 {stop.cost_estimate}</span>}
          </div>
        </div>

        {/* Expand indicator */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 14, color: "var(--muted)", flexShrink: 0 }}
        >
          ▼
        </motion.span>

        {/* Remove Button */}
        <button
          className={`stop-remove-btn ${confirmRemove ? "confirm" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          title={confirmRemove ? "Click again to confirm" : "Remove stop"}
        >
          {confirmRemove ? "✓ Sure?" : "✕"}
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div className="stop-details">
              {stop.description && (
                <div className="stop-detail-row">
                  <span className="stop-detail-label">About</span>
                  <p className="stop-detail-text">{stop.description}</p>
                </div>
              )}
              {stop.tips && (
                <div className="stop-detail-row stop-tip">
                  <span className="stop-detail-label">💡 Tip</span>
                  <p className="stop-detail-text">{stop.tips}</p>
                </div>
              )}
              <div className="stop-detail-chips">
                <span className="stop-chip" style={{ borderColor: `${catConfig.color}40`, color: catConfig.color }}>
                  {catConfig.icon} {catConfig.label}
                </span>
                {stop.cost_estimate && (
                  <span className="stop-chip">💰 {stop.cost_estimate}</span>
                )}
                {stop.duration_minutes > 0 && (
                  <span className="stop-chip">⏱️ {stop.duration_minutes} min</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
