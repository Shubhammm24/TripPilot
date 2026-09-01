"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StopCard from "./StopCard";
import type { Stop } from "./StopCard";

export interface Day {
  day_number: number;
  title: string;
  stops: Stop[];
}

export interface Itinerary {
  trip_title: string;
  destination: string;
  duration_days: number;
  summary: string;
  days: Day[];
  budget_summary: {
    total_estimated: string;
    currency: string;
    accommodation: string;
    food: string;
    activities: string;
    transport: string;
  };
  packing_tips: string[];
  warnings: string[];
}

interface ItineraryViewProps {
  itinerary: Itinerary;
  onItineraryChange: (updated: Itinerary) => void;
}

export default function ItineraryView({ itinerary, onItineraryChange }: ItineraryViewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => {
    // Expand all days by default
    return new Set(itinerary.days.map((d) => d.day_number));
  });
  const [dragState, setDragState] = useState<{
    dayIndex: number;
    stopIndex: number;
  } | null>(null);
  const [dragOverState, setDragOverState] = useState<{
    dayIndex: number;
    stopIndex: number;
  } | null>(null);

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) {
        next.delete(dayNumber);
      } else {
        next.add(dayNumber);
      }
      return next;
    });
  };

  const handleRemoveStop = useCallback(
    (dayIndex: number, stopId: string) => {
      const updatedDays = itinerary.days.map((day, di) => {
        if (di !== dayIndex) return day;
        return {
          ...day,
          stops: day.stops.filter((s) => s.id !== stopId),
        };
      });
      onItineraryChange({ ...itinerary, days: updatedDays });
    },
    [itinerary, onItineraryChange]
  );

  const handleDragStart = useCallback(
    (_e: React.DragEvent, dayIndex: number, stopIndex: number) => {
      setDragState({ dayIndex, stopIndex });
    },
    []
  );

  const handleDragOver = useCallback(
    (_e: React.DragEvent, dayIndex: number, stopIndex: number) => {
      setDragOverState({ dayIndex, stopIndex });
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    if (dragState && dragOverState && dragState.dayIndex === dragOverState.dayIndex) {
      const dayIndex = dragState.dayIndex;
      const fromIndex = dragState.stopIndex;
      const toIndex = dragOverState.stopIndex;

      if (fromIndex !== toIndex) {
        const updatedDays = itinerary.days.map((day, di) => {
          if (di !== dayIndex) return day;
          const newStops = [...day.stops];
          const [movedStop] = newStops.splice(fromIndex, 1);
          newStops.splice(toIndex, 0, movedStop);
          return { ...day, stops: newStops };
        });
        onItineraryChange({ ...itinerary, days: updatedDays });
      }
    }
    setDragState(null);
    setDragOverState(null);
  }, [dragState, dragOverState, itinerary, onItineraryChange]);

  const totalStops = itinerary.days.reduce((sum, d) => sum + d.stops.length, 0);

  return (
    <div className="itinerary-view">
      {/* Trip Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="itinerary-header"
      >
        <h1 className="display-sm gradient-text">{itinerary.trip_title}</h1>
        {itinerary.destination && (
          <p className="body-lg" style={{ color: "var(--muted)", marginTop: 8 }}>
            📍 {itinerary.destination} · {itinerary.duration_days} days · {totalStops} stops
          </p>
        )}
        {itinerary.summary && (
          <p className="body-md" style={{ color: "var(--on-surface-variant)", marginTop: 12, maxWidth: 700 }}>
            {itinerary.summary}
          </p>
        )}
      </motion.div>

      {/* Warnings */}
      {itinerary.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="itinerary-warnings"
        >
          {itinerary.warnings.map((w, i) => (
            <div key={i} className="warning-item">
              ⚠️ {w}
            </div>
          ))}
        </motion.div>
      )}

      {/* Day Sections */}
      <div className="days-container">
        {itinerary.days.map((day, dayIndex) => {
          const isExpanded = expandedDays.has(day.day_number);
          return (
            <motion.div
              key={day.day_number}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.08, duration: 0.35 }}
              className="day-section"
            >
              {/* Day Header */}
              <button
                className="day-header"
                onClick={() => toggleDay(day.day_number)}
                aria-expanded={isExpanded}
              >
                <div className="day-number-badge">
                  {day.day_number}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div className="day-title">{day.title}</div>
                  <div className="day-subtitle">
                    {day.stops.length} stop{day.stops.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 16, color: "var(--muted)" }}
                >
                  ▼
                </motion.span>
              </button>

              {/* Day Stops */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="day-stops">
                      <AnimatePresence mode="popLayout">
                        {day.stops.map((stop, stopIndex) => (
                          <StopCard
                            key={stop.id}
                            stop={stop}
                            index={stopIndex}
                            onRemove={(id) => handleRemoveStop(dayIndex, id)}
                            onDragStart={(e, idx) => handleDragStart(e, dayIndex, idx)}
                            onDragOver={(e, idx) => handleDragOver(e, dayIndex, idx)}
                            onDragEnd={handleDragEnd}
                            isDragging={
                              dragState?.dayIndex === dayIndex &&
                              dragState?.stopIndex === stopIndex
                            }
                            isDragOver={
                              dragOverState?.dayIndex === dayIndex &&
                              dragOverState?.stopIndex === stopIndex
                            }
                          />
                        ))}
                      </AnimatePresence>
                      {day.stops.length === 0 && (
                        <div className="empty-day">
                          <span style={{ fontSize: 32 }}>📭</span>
                          <p className="body-md" style={{ color: "var(--muted)", marginTop: 8 }}>
                            All stops removed. Use the refinement box to add new activities.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Budget Summary */}
      {itinerary.budget_summary.total_estimated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card budget-card"
        >
          <div className="label-sm" style={{ color: "var(--secondary)", marginBottom: 16 }}>
            💰 Budget Estimate
          </div>
          <div className="budget-grid">
            <div className="budget-item budget-total">
              <span className="budget-label">Total</span>
              <span className="budget-value">{itinerary.budget_summary.total_estimated}</span>
            </div>
            {itinerary.budget_summary.accommodation && (
              <div className="budget-item">
                <span className="budget-label">🏨 Stay</span>
                <span className="budget-value">{itinerary.budget_summary.accommodation}</span>
              </div>
            )}
            {itinerary.budget_summary.food && (
              <div className="budget-item">
                <span className="budget-label">🍽️ Food</span>
                <span className="budget-value">{itinerary.budget_summary.food}</span>
              </div>
            )}
            {itinerary.budget_summary.activities && (
              <div className="budget-item">
                <span className="budget-label">🎭 Activities</span>
                <span className="budget-value">{itinerary.budget_summary.activities}</span>
              </div>
            )}
            {itinerary.budget_summary.transport && (
              <div className="budget-item">
                <span className="budget-label">🚗 Transport</span>
                <span className="budget-value">{itinerary.budget_summary.transport}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Packing Tips */}
      {itinerary.packing_tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card"
        >
          <div className="label-sm" style={{ color: "var(--tertiary)", marginBottom: 16 }}>
            🎒 Packing Tips
          </div>
          <ul className="packing-list">
            {itinerary.packing_tips.map((tip, i) => (
              <li key={i} className="packing-item">
                <span style={{ color: "var(--tertiary)" }}>✓</span> {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
