<p align="center">
  <img src="https://img.shields.io/badge/TriPi-AI_Trip_Planner-6C63FF?style=for-the-badge&logo=airplane&logoColor=white" alt="TriPi Badge" />
</p>

<h1 align="center">✈️ TriPi — AI Trip Planner</h1>

<p align="center">
  <strong>A React app that turns free-form trip descriptions into interactive, editable day-by-day itineraries.</strong><br/>
  Built with <b>React</b> (Next.js) · <b>Google Gemini</b> · <b>FastAPI</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-LLM-4285F4?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white" />
</p>

---

## 🎯 What It Does

1. **Free-form text input** — describe your trip in natural language (destination, dates, budget, interests)
2. **AI returns structured JSON** — Gemini generates a validated JSON itinerary (not markdown or chat text)
3. **Interactive UI** — parsed JSON renders as expandable day cards with individual stop cards
4. **Edit your itinerary** — expand/collapse stops, drag to reorder, remove stops, refine via follow-up prompts

> **This is NOT a chatbot.** The AI returns structured data that the frontend parses, validates, and renders as interactive, stateful React components.

---

## 🚀 Setup & Running Locally

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+
- A **Google Gemini API key** (free tier: [aistudio.google.com](https://aistudio.google.com))

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/TriPi.git
cd TriPi

# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Configure Environment

```bash
# In the project root, create .env
cp .env.example .env
# Edit .env and add your key:
# GOOGLE_API_KEY=your_gemini_api_key_here
```

### 3. Start the Backend

```bash
# From the project root
uvicorn main:app --reload --port 8000
```

### 4. Start the Frontend

```bash
# From the frontend/ directory
cd frontend
npm run dev
```

Open [http://localhost:3000/plan](http://localhost:3000/plan) — describe your trip and generate!

### Quick Start (one command)

```bash
npm install && npm start
# (Starts the frontend dev server — backend must be running separately)
```

---

## 🏗️ Architecture

```
User Input (free text)
        │
        ▼
  ┌─────────────┐
  │  /api/plan   │  FastAPI backend
  │  endpoint    │  (API key stays server-side)
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │  Gemini LLM  │  Returns structured JSON
  │  (3.6 Flash) │  (not markdown/chat)
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │  JSON Parser │  Validates schema, fills
  │  + Validator │  defaults, strips fences
  └─────┬───────┘
        │
        ▼
  ┌─────────────────────────────────┐
  │  React Interactive Components   │
  │  • Day accordions               │
  │  • Stop cards (expand/remove)   │
  │  • Drag-to-reorder              │
  │  • Budget summary               │
  │  • Refinement loop              │
  └─────────────────────────────────┘
```

### Key Files

| File | Purpose |
|---|---|
| `main.py` | FastAPI backend — `/api/plan` and `/api/refine-plan` endpoints |
| `frontend/src/app/plan/page.tsx` | Main plan page — free-form input, loading, error, result stages |
| `frontend/src/app/components/ItineraryView.tsx` | Day accordion layout with drag-reorder |
| `frontend/src/app/components/StopCard.tsx` | Individual stop card — expand, remove, drag |
| `frontend/src/app/components/ErrorState.tsx` | Error display with retry for all failure types |

---

## 🛡️ Handling Bad AI Output

This is the core engineering challenge. Here's how each failure mode is handled:

| Failure Mode | How It's Handled |
|---|---|
| **Malformed JSON** | Strip code fences, find JSON boundaries `{...}`, show parse error with raw preview |
| **Wrong schema shape** | Validate `days`/`stops` arrays, fill defaults for missing fields, skip bad entries |
| **Empty response** | Check for 0 days/stops after parse, show "try more specific prompt" message |
| **Slow response** | 60s AbortController timeout, specific timeout error with retry button |
| **Network failure** | Catch fetch errors, show connection error with backend URL |
| **Stale response** | Request ID ref prevents an older, slow response from overwriting a newer one |
| **Refinement failure** | Independent error state, doesn't destroy existing itinerary |

All errors show a **retry button** — no crashes, no blank screens.

---

## 📱 Mobile Support

- Single-column layout on screens < 900px
- Sidebar moves above content on mobile
- Drag handles hidden on touch (use remove + refine instead)
- All interactive elements are touch-friendly (44px+ tap targets)

---

## ✨ Features

- [x] **Free-form text input** with example prompts
- [x] **Structured JSON output** from AI (not chat/markdown)
- [x] **Day-by-day accordion** with expand/collapse
- [x] **Stop cards** with category icons, time, cost, tips
- [x] **Drag-to-reorder** stops within a day
- [x] **Remove stops** with confirmation
- [x] **Expand/collapse** individual stop details
- [x] **Refinement loop** — follow-up prompts edit existing itinerary
- [x] **Loading state** with animated progress steps
- [x] **Error states** — parse, schema, empty, timeout, network
- [x] **Stale response guard** (request ID tracking)
- [x] **Dark/light mode** toggle
- [x] **Mobile responsive**
- [x] **Keyboard shortcuts** (Ctrl+Enter to submit)
- [x] **Budget summary** rendered from structured data
- [x] **Packing tips** and **warnings** from AI

---

## 🤖 AI Usage Note

I used **Google Antigravity (Gemini-based coding assistant)** for:
- Generating boilerplate CSS and component scaffolding
- Helping structure the JSON validation logic
- Iterating on error handling edge cases

All architectural decisions, component design, state management patterns, and error handling strategy are my own. I understand every line of code and can explain, debug, and extend it.

---

## ⚠️ Known Limitations

1. **Drag-and-drop only within a day** — cross-day dragging is not implemented (would need a more complex state model)
2. **No persistent storage** — itineraries are lost on page refresh (would add localStorage or a database)
3. **No streaming** — the full response is waited for; streaming would improve perceived latency
4. **Coordinates may be approximate** — the LLM sometimes returns rough lat/lon values
5. **Single LLM provider** — hardcoded to Gemini; could abstract to support OpenAI/Anthropic
6. **No image generation** — stop cards don't include photos (could integrate Unsplash)
7. **Budget values are strings** — to handle multi-currency display; a numeric model would enable charts

### What I'd Do Next (if more time)
- Stream the JSON response token-by-token and render progressively
- Add localStorage session save/reload
- Add cross-day drag-and-drop
- Integrate the existing Map tab with the new structured stops
- Add unit tests for the JSON parser and schema validator
- Add a "share itinerary" link feature

---

## ⏱️ Time Spent

~7 hours total:
- **Research & planning**: ~1 hour (understanding existing codebase, designing data flow)
- **Backend (structured endpoints)**: ~1.5 hours (JSON schema, validation, error handling)
- **Frontend components**: ~3 hours (ItineraryView, StopCard, ErrorState, plan page rewrite)
- **CSS & responsive design**: ~1 hour
- **Testing & debugging**: ~0.5 hours

---

## 📄 License

MIT
