# PROGRESS.md — ReadyForHiring

> Keep this file in the repo root. Update it at the end of every work session.
> At the start of a new chat, paste the "Current status" section and the phase you are working on.

---


## Current status

- **Date last updated:** 2026-11-05
- **Current phase:** Phase 5 — Frontend skeleton + deploy
- **Last thing finished:** Phase 4 — Career Discovery (commit `065f6e6`)
- **Next step:** Create the React + Vite + Tailwind frontend
- **Blocked by:** Nothing


---

## Phase checklist

Tick a box only when the step **works** and is **committed**.

### Phase 0 — Setup
- [x] Install VS Code, Git, Node 20+, and `uv`
- [x] Create GitHub repo `readyforhiring`
- [x] Create folders `backend` and `frontend`
- [x] Pin Python 3.12 with `uv` and create `backend/pyproject.toml`
- [x] Add `.gitignore` (includes `.env`, `.venv`, `node_modules`)
- [x] First commit pushed to GitHub

### Phase 1 — Backend skeleton + early deploy

- [x] FastAPI app with `GET /health`
- [x] Run locally and open `/docs`
- [x] Add `ruff` and run `uv run ruff check --fix`
- [x] Add automated health endpoint test with Pytest
- [x] Deploy backend to Render (free)
- [x] `/health` works on the Render link

### Phase 2 — Groq connection

- [x] Get free Groq API key and save it in `backend/.env`
- [x] `config.py` reads environment variables
- [x] `groq_client.py` makes one test chat call
- [x] Retry on rate-limit error
- [x] Automated retry test passes

### Phase 3 — Database
- [x] Create Neon project and copy `DATABASE_URL`
- [x] `db.py` and `models.py` created
- [x] Tables created on startup
- [x] One test row saved and read back


### Phase 4 — Career Discovery
- [x] `careers.json` with starter careers and skills
- [x] Career prompt returns valid JSON
- [x] `POST /api/career/discover` works in `/docs`
- [x] Result saved to database


### Phase 5 — Frontend skeleton + deploy
- [x] React + Vite + Tailwind project created
- [ ] Home page and Career Discovery page
- [ ] `lib/api.js` calls the backend
- [ ] CORS works between frontend and backend
- [ ] Deploy frontend to Vercel

### Phase 6 — Text interview + feedback (STAR FEATURE)
- [ ] Interviewer prompt
- [ ] `POST /api/interview/start`
- [ ] `POST /api/interview/{id}/answer` (follow-up questions)
- [ ] Evaluator prompt returns valid JSON scores
- [ ] `POST /api/interview/{id}/finish`
- [ ] Interview page in the frontend (text only)

### Phase 7 — Voice + avatar
- [ ] Mic recording in the browser
- [ ] `POST /api/speech/transcribe` with Groq Whisper
- [ ] Browser speaks questions with `speechSynthesis`
- [ ] Filler word count and words per minute
- [ ] Simple 2D animated avatar

### Phase 8 — Dashboard
- [ ] `GET /api/dashboard/{user_id}`
- [ ] Score history chart
- [ ] Latest feedback card

### Phase 9 — Resume + skill gap
- [ ] PDF text extraction with `pypdf`
- [ ] Resume analysis prompt
- [ ] Skill gap list and simple learning plan
- [ ] Resume page in the frontend

### Phase 10 — Chatbot + Money Planner
- [ ] `POST /api/chat`
- [ ] Salary ranges in `careers.json` (mark as sample estimates)
- [ ] `POST /api/finance/plan` (savings math in plain code)
- [ ] Money page in the frontend

### Phase 11 — Polish and demo
- [ ] Friendly error messages and "waking up the server" message
- [ ] README with setup steps and screenshots
- [ ] Wake Render and Neon before the demo
- [ ] Demo script and 2-minute demo video
- [ ] Final check of all free-tier limits

---

## Decisions log

| Date    | Decision               | Why |
|---      |---                     |---  |
| (start) | FastAPI + React (Vite) | Simple for beginners, clear to explain |
| (start) | Groq for LLM and Whisper | Free tier, fast |
| (start) | Neon Postgres, not SQLite | Render free disk is wiped on restart |
| (start) | No login in version 1 | Keep scope small; random user id in browser |
| (start) | Browser `speechSynthesis` for voice out | Free, no server work |
| (start) | 2D avatar first, 3D only if time | Lower risk |

---

## Bugs and fixes

| Date | Problem | Fix | Lesson |
|---|---|---|---|
| | | | |

---

## Session log

### Session 1 — Project Setup and Backend Foundation
- Goal: Initialize ReadyForHiring and establish the backend foundation.
- Done:
  - Created GitHub repository `readyforhiring`.
  - Set up project folders for backend and frontend.
  - Installed and configured Python 3.12, `uv`, and Git.
  - Created backend `pyproject.toml` and dependency configuration.
  - Added `.gitignore` to protect environment files and generated folders.
  - Created FastAPI application.
  - Implemented `GET /health` endpoint.
  - Configured Swagger documentation at `/docs`.
  - Added automated health endpoint test using Pytest.
  - Configured Ruff for code quality.
  - Deployed backend to Render free service.
  - Verified the deployed `/health` endpoint successfully.
  - Pushed backend foundation to GitHub.
- Not done:
  - Groq integration.
  - Database setup.
  - Frontend development.
  - AI feature implementation.
- Next: Configure Groq API and implement the AI connection.

### Session 2 — 2026-11-05
- Goal: Complete Groq integration.
- Done: Configured Groq, tested a real API request, implemented rate-limit retry, added automated retry test. Ruff checks passed; Pytest: 2 passed.
- Not done: Database setup.
- Next: Phase 3 — Neon PostgreSQL.

### Session 3 — Neon PostgreSQL Database Integration

**Completed:**
- Created Neon PostgreSQL project using the Free plan.
- Configured `DATABASE_URL` and `DATABASE_URL_POOLED` in `backend/.env`.
- Verified `.env` is ignored by Git.
- Created `backend/app/db.py` using SQLAlchemy 2.0 and psycopg.
- Successfully connected FastAPI backend to Neon PostgreSQL.
- Created six database models in `backend/app/models.py`.
- Configured automatic table creation using FastAPI lifespan.
- Successfully created all six tables in Neon.
- Created `backend/tests/test_database.py`.
- Successfully tested database insert, read and delete operations.

**Testing results:**
- Database test: PASSED
- Groq retry test: PASSED
- Health endpoint test: PASSED
- Total: 3 tests passed.
- Ruff lint: PASSED.
- Ruff formatting: PASSED.


### Career Discovery completion — November 5, 2026
- **Goal:** Build the Career Discovery backend feature.
- **Done:** Career catalog, AI prompt, Pydantic schemas, Groq service, retry handling, FastAPI endpoint, Neon persistence, and automated tests.
- **Testing:** 9 automated tests passed. Real Groq request succeeded. Swagger returned HTTP 200. Neon database save verified.
- **Commit:** `065f6e6` — Complete Career Discovery feature.
- **Not done:** Frontend development.
- **Next:** Phase 5 — Frontend skeleton + deploy.

### Career Discovery Completion — November 5, 2026

- Goal: Build the Career Discovery backend feature.
- Done: Career catalog, AI prompt, Pydantic schemas, Groq service, retry handling, FastAPI endpoint, and Neon database persistence.
- Testing: 9 automated tests passed.
- Manual verification: Real Groq request succeeded, Swagger returned HTTP 200, and Neon database save was confirmed.
- Commit: `065f6e6` — Complete Career Discovery feature.
- Next: Phase 5 — Frontend skeleton + deploy.
