# 🤖 AI Software Engineer Agent — Frontend (Next.js + Material UI)

A modern **Next.js 14+ (App Router + TypeScript + Material UI / MUI)** frontend for the **AI Software Engineer Agent** backend.

It lets users submit natural-language software engineering goals, stream live agent output (tokens / state / result via SSE), inspect artifacts, execution reports, retries, and manage sessions — all connected to the FastAPI + LangGraph backend in `../ai_software_agent/app/`.

> **Backend:** `LangGraph + FastAPI + ChromaDB` — see [`../ai_software_agent/README.md`](../ai_software_agent/README.md)
> **Frontend (this folder):** `Next.js + TypeScript + Material UI (MUI v6) + Emotion` — talks to backend over HTTP/SSE.

---

## ✨ Features

- **Goal Runner UI** — submit goals like _"Build a FastAPI todo app with tests"_
- **Live Streaming** — renders `token` / `state` / `result` SSE events from `POST /v1/run` in real time
- **Agent Pipeline View** — Architect → Developer → QA → Writer status, feedback, retries
- **Artifacts Explorer** — view created/updated files, diffs, code blocks with syntax highlighting
- **Execution Reports** — sandbox runs, test results, lint output
- **Session Support** — `session_id` for persistent ChromaDB + entity memory per user/project
- **Health Indicator** — online/offline LLM mode via `GET /health`
- **Offline-Friendly** — works against backend offline/deterministic fallback mode (no OpenAI key needed)
- **MUI Theming** — `ThemeProvider + CssBaseline`, light/dark mode toggle, responsive `Grid` / `Stack` layout, `AppRouterCacheProvider` for Next.js App Router

---

## 🏗️ Architecture

```
┌──────────────────────┐      HTTP/SSE       ┌──────────────────────────────┐
│  Next.js Frontend    │ ──────────────────► │  FastAPI Backend             │
│  (this folder)       │  POST /v1/run       │  ../ai_software_agent/app/   │
│                      │  GET  /health       │  MultiAgentOrchestrator      │
│  src/app/page.tsx    │ ◄────────────────── │  Architect → Dev → QA        │
│  components/*.tsx    │  text/event-stream  │  + Memory (ChromaDB)         │
│  lib/api.ts          │  token/state/result │  + Sandbox + Self-correction │
└──────────────────────┘                     └──────────────────────────────┘
         │                                                     │
         │ NEXT_PUBLIC_API_URL=http://localhost:8000           │ PROJECT_ROOT=.
         └─────────────────────────────────────────────────────┘
```

**Backend contract (already implemented):**

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/health` | `GET` | — | `{ "status": "ok", "llm": "online" \| "offline" }` |
| `/v1/run` | `POST` | `{ "goal": string, "session_id": string }` | `text/event-stream` with `event: token/state/result` + `data: JSON` |

SSE event shapes:

```ts
// token — raw markdown chunk
{ "type": "token", "token": "Creating FastAPI..." }

// state — telemetry
{ "type": "state", "agent": "developer", "status": "running", "feedback": "..." }

// result — final AgentState
{ "type": "result", "state": { "artifacts": {...}, "exec_reports": [], "retries_used": 0, "error": null } }
```

---

## 📋 Prerequisites

- **Node.js 18.17+** or 20+ + `npm` / `pnpm` / `yarn`
- **Python 3.12+** for backend (see `../ai_software_agent/README.md`)
- Backend running locally (default `http://localhost:8000`)

Check versions:

```bash
node -v   # v20.x recommended
python3.12 --version
```

---

## 📦 Installation

### 1. Start the backend first

```bash
cd ../ai_software_agent

# venv + deps
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # leave OPENAI_API_KEY empty for offline mode

# serve API on :8000
python -m app.main --serve --port 8000
# or
uvicorn app.main:app --port 8000 --reload

# verify
curl http://localhost:8000/health
# => {"status":"ok","llm":"offline"}
```

### 2. Install frontend (Next.js + MUI) — already scaffolded here

```bash
cd ../ai_software_web
npm install
```

Fresh scaffold (if starting over):

```bash
npx create-next-app@latest . --typescript --eslint --app --src-dir --import-alias "@/*"
# answers: ✔ src/ ✔ App Router ✔ NO Tailwind (we use MUI)

# Core MUI stack (MUI v6 + Emotion for Next.js App Router)
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled @emotion/cache @mui/material-nextjs
npm install @mui/lab  # optional: LoadingButton, Timeline, etc.

# SSE + state + markdown
npm install zustand react-markdown remark-gfm
```

> **Framework:** [Material UI (MUI)](https://mui.com/material-ui/) — React UI library implementing Material Design. We use `ThemeProvider`, `CssBaseline`, `AppBar`, `Container`, `Card`, `TextField`, `Button`, `Chip`, `LinearProgress`, `Drawer`, `Snackbar`, etc. Styling via `sx` prop + Emotion (no Tailwind needed).

### 3. Configure environment

```bash
cp .env.example .env.local
```

`.env.local`:

```env
# Backend base URL (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: default session id prefix
NEXT_PUBLIC_DEFAULT_SESSION=demo
```

> In production (Vercel etc.) set `NEXT_PUBLIC_API_URL` to your deployed FastAPI URL and enable CORS on backend.

### 4. Run frontend

```bash
npm run dev
# => http://localhost:3000
```

Open **http://localhost:3000**, type a goal, watch streaming output.

---

## 🔌 Backend Connection Guide

### Health check

```ts
// src/lib/api.ts
export async function getHealth(base = process.env.NEXT_PUBLIC_API_URL!) {
  const res = await fetch(`${base}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`health failed: ${res.status}`);
  return res.json() as Promise<{ status: string; llm: "online" | "offline" }>;
}
```

### Streaming a task (SSE via fetch)

Backend uses `POST /v1/run` with SSE — `EventSource` won't work (POST). Use `fetch` + reader (see `src/lib/api.ts` → `streamRun`).

### MUI Theme + Next.js App Router setup (already wired)

- `src/theme.ts` → `createTheme({ palette: { mode: "dark", ... } })`
- `src/components/ThemeRegistry.tsx` → `AppRouterCacheProvider + ThemeProvider + CssBaseline`
- `src/app/layout.tsx` → `AppBar + Toolbar + Container`

### cURL equivalent (debug backend directly)

```bash
curl -N -X POST http://localhost:8000/v1/run \
  -H "Content-Type: application/json" \
  -d '{"goal": "Create a Python CLI calculator with tests", "session_id": "demo"}'
```

---

## 📁 Project Structure (Next.js + MUI)

```
ai_software_web/
├── README.md
├── .env.example / .env.local
├── next.config.mjs / tsconfig.json / package.json
├── src/
│   ├── theme.ts
│   ├── app/
│   │   ├── layout.tsx      # ThemeRegistry + AppBar + Container
│   │   ├── page.tsx        # main goal runner page (MUI Grid/Stack)
│   │   └── api/run/route.ts# optional proxy to backend (avoids CORS)
│   ├── components/
│   │   ├── ThemeRegistry.tsx
│   │   ├── GoalForm.tsx    # MUI TextField + Button
│   │   ├── StreamView.tsx  # MUI Card + live markdown tokens
│   │   ├── PipelineView.tsx# MUI Stepper + Chip status
│   │   ├── ArtifactsView.tsx# MUI Tabs / Paper + exec_reports
│   │   └── HealthBadge.tsx # MUI Chip (online=success, offline=warning)
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts
│   └── store/
│       └── useAgentStore.ts
└── public/
```

**Next.js proxy (fixes CORS in dev/prod):** `POST src/app/api/run/route.ts` forwards to `BACKEND_URL/v1/run`.
Set `NEXT_PUBLIC_API_URL=/api` to use it — no CORS config needed.

---

## 🧪 Tasks You Can Perform From UI

| Goal example | What backend does |
|---|---|
| `Build a FastAPI todo app with tests` | Architect plans → Developer scaffolds → QA runs `pytest` → Writer docs |
| `Refactor agent_core/ to async with retries` | Analysis + refactor + exec report |
| `Add unit tests for app/core/memory.py` | Generates `tests/test_*.py`, runs sandbox |
| `Fix bug in <file> where ...` | Reads file via `PROJECT_ROOT`, patches, verifies |
| `Document app/agents/orchestrator.py` | Generates markdown docs |

---

## ⚙️ Scripts

```bash
npm run dev    # dev server :3000
npm run build  # production build
npm run start  # serve production build
npm run lint   # eslint
```

---

## 🚀 Deployment

**Frontend (Vercel):** Root Directory = `ai_software_web`, env `NEXT_PUBLIC_API_URL=https://<backend>`.
**Backend (Railway/Render):** `uvicorn app.main:app --host 0.0.0.0 --port $PORT` + `CORSMiddleware` for your Vercel origin.

---

## 🛠️ Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `Failed to fetch /v1/run` | Backend not running → `python -m app.main --serve --port 8000`; check `NEXT_PUBLIC_API_URL` |
| CORS error | Add `CORSMiddleware` on backend or use `/api` proxy route |
| `health: offline` | Normal without `OPENAI_API_KEY`. Set key in `../ai_software_agent/.env` |

---

## 📄 License

MIT — same as backend. See [`../ai_software_agent/pyproject.toml`](../ai_software_agent/pyproject.toml).
