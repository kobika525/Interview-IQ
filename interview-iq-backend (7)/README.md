# Interview IQ — Backend

A real, database-backed FastAPI backend for Interview IQ (AI-powered mock interview and career guidance platform), built to connect directly to the existing React frontend without changing its routes, service names, or data shapes.

This is not a mock/demo API — registration, login, resume analysis, career matching, interview sessions, answer evaluation, and reporting are all real, computed from actual request data and stored in MySQL. The only things that gracefully "fall back" are the *optional heavy local AI models* (Whisper, MediaPipe, a local LLM via Ollama) — see [AI & Fallback Behaviour](#ai--fallback-behaviour) below. That fallback behaviour is intentional and required by the spec, not a placeholder.

## Table of contents

- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Folder structure](#folder-structure)
- [Windows setup (PowerShell)](#windows-setup-powershell)
- [macOS / Linux setup](#macos--linux-setup)
- [Docker setup](#docker-setup)
- [Environment variables](#environment-variables)
- [Database migrations](#database-migrations)
- [Seed data](#seed-data)
- [Running the server](#running-the-server)
- [API documentation](#api-documentation)
- [Authentication flow](#authentication-flow)
- [Resume ATS scoring formula](#resume-ats-scoring-formula)
- [Career matching formula](#career-matching-formula)
- [Interview evaluation](#interview-evaluation)
- [AI & fallback behaviour](#ai--fallback-behaviour)
- [Testing](#testing)
- [Frontend integration](#frontend-integration)
- [Responsible AI](#responsible-ai)
- [Known limitations](#known-limitations)
- [Future improvements](#future-improvements)

## Architecture

Layered, one-directional dependency flow:

```
API Route  →  Service  →  Repository  →  SQLAlchemy Model  →  MySQL
                 ↓
             AI module (resume/career/interview/speech/video/llm)
```

- **Routes** (`app/api/routes/`) parse/validate requests via Pydantic schemas and call a service. No business logic here.
- **Services** (`app/services/`) hold business rules, enforce plan/usage limits, coordinate repositories and AI modules, and raise notifications.
- **Repositories** (`app/repositories/`) are the only place that writes SQLAlchemy queries.
- **AI modules** (`app/ai/`) are pure functions — no FastAPI request objects, no direct DB or auth access. They take data in, return structured results out.

## Technology stack

FastAPI · Uvicorn · SQLAlchemy 2.x · Alembic · MySQL 8 · PyMySQL · Pydantic 2.x · python-jose (JWT) · pwdlib/Argon2 (password hashing) · PyMuPDF / pdfplumber / python-docx (resume parsing) · scikit-learn (TF-IDF semantic similarity) · reportlab (PDF reports) · pytest

## Folder structure

```
app/
  main.py            FastAPI app, middleware, exception handlers, health endpoints
  config.py           Settings (pydantic-settings, reads .env)
  database.py         Engine, session, Base
  dependencies.py     get_current_user / get_current_admin / pagination deps

  core/                security.py, exceptions.py, permissions.py, logging.py, rate_limit.py
  models/              SQLAlchemy models (one file per domain)
  schemas/             Pydantic request/response schemas
  repositories/        DB query layer
  services/            Business logic layer
  ai/                  resume/ career/ interview/ speech/ video/ llm/ — pure AI modules
  api/routes/          One router per resource, aggregated in api/router.py
  middleware/          request_id, logging, security_headers
  utils/               enums, pagination, file_validation, datetime, responses, scoring
  seed/                Idempotent seed scripts (admin, plans, roles, resources, questions, achievements)
  tests/               pytest suite, run against a real MySQL test database

alembic/               Migrations
uploads/                resumes/ audio/ video/ reports/ profile_images/
```

## Windows setup (PowerShell)

**Prerequisites:** Python 3.12, MySQL 8 Server + MySQL Workbench installed and running.

```powershell
# 1. Clone / unzip, then from the backend folder:
py -m venv venv
.\venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt

# 2. Create the databases in MySQL Workbench (or via CLI):
#    CREATE DATABASE interview_iq;
#    CREATE DATABASE interview_iq_test;

# 3. Copy the environment template and fill in your MySQL password
copy .env.example .env
# edit .env: DATABASE_URL=mysql+pymysql://root:<your-password>@localhost:3306/interview_iq

# 4. Run migrations
alembic upgrade head

# 5. Seed reference data (admin account, plans, roles, questions, resources, achievements)
python -m app.seed.seed_all

# 6. Run the server
python -m uvicorn app.main:app --reload
```

Server: `http://127.0.0.1:8000` · Docs: `http://127.0.0.1:8000/docs`

## macOS / Linux setup

Same steps, using `python3 -m venv venv` and `source venv/bin/activate` instead of steps 1's Windows-specific lines.

## Docker setup

```bash
cp .env.example .env   # optional, docker-compose reads its own env vars (see docker-compose.yml)
docker compose up --build
```

This starts MySQL 8 and the API together. Run migrations + seed once the containers are healthy:

```bash
docker compose exec api alembic upgrade head
docker compose exec api python -m app.seed.seed_all
```

## Environment variables

See `.env.example` for the full list with defaults. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Main MySQL connection string |
| `TEST_DATABASE_URL` | Separate database used only by `pytest` — never point this at your dev/prod DB |
| `SECRET_KEY` | JWT signing secret — must be long and random in production |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Credentials used by `seed_admin.py` — change the password before any real deployment |
| `AI_MODE` | `local` (default) — reserved for future remote-AI-provider support |

## Database migrations

The approved data model isn't managed with `Base.metadata.create_all()` in production — that's reserved for isolated test runs only (see `app/tests/conftest.py`). Real schema changes go through Alembic:

```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
alembic downgrade -1   # to roll back one step
```

### Note on the ERD

The Google Doc ERD link provided wasn't accessible to me (it required interactive sign-in and returned no content). The schema in `app/models/` was built directly from the detailed entity/relationship list in the accompanying requirement document instead — every domain listed there (auth/users, resumes, career/skills, roadmap/resources, interviews/reports, achievements, notifications, subscriptions/billing, support, audit) has a corresponding table. One deliberate, documented addition beyond what was explicitly listed: **`processing_jobs`** (`app/models/job.py`), added because the spec explicitly asked for a jobs table "if the ERD supports one, otherwise propose adding a minimal table" for polling long-running resume/voice/video/report jobs — this is that minimal table. If your actual approved ERD differs in table or column names, treat this as a first draft to reconcile against it, not a final migration.

## Seed data

All seed scripts are idempotent (safe to re-run):

```bash
python -m app.seed.seed_all
```

Or individually: `python -m app.seed.seed_admin`, `seed_plans`, `seed_achievements`, `seed_roles`, `seed_resources`, `seed_questions`.

**Demo admin account:** `admin@interviewiq.com` / the value of `ADMIN_SEED_PASSWORD` in your `.env` (defaults to `ChangeMe123!` — change this).

## Running the server

```bash
python -m uvicorn app.main:app --reload
```

Health checks (no auth required, no secrets exposed):
- `GET /health` — basic liveness
- `GET /api/health` — liveness + environment name
- `GET /api/ready` — liveness **and** a real `SELECT 1` against MySQL

## API documentation

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Send `Authorization: Bearer <access_token>` on protected routes.

## Authentication flow

1. `POST /api/auth/register` or `/api/auth/login` → returns `access_token` (30 min default) + `refresh_token` (7 days default, stored server-side as a hash — never in plaintext).
2. `POST /api/auth/refresh` rotates the refresh token (old one is revoked) and issues a new pair.
3. `POST /api/auth/logout` revokes one refresh token; `/logout-all` revokes every active session.
4. Password reset and email verification tokens are **hashed before storage** and expire (1 hour / 24 hours respectively). `forgot-password` never reveals whether an email exists.
5. Passwords are hashed with Argon2 via `pwdlib`.

## Resume ATS scoring formula

Implemented in `app/ai/resume/ats_scorer.py`, weights are configurable (`DEFAULT_WEIGHTS`):

| Component | Weight |
|---|---|
| Required skills matched | 30% |
| Role keyword coverage | 20% |
| Section completeness | 15% |
| Experience relevance | 15% |
| Formatting readiness | 10% |
| Education relevance | 5% |
| Achievement quality (action verbs, quantified results) | 5% |

The API and frontend always label this an **"estimated, AI-assisted ATS readiness score"** — it does not reproduce any specific employer's actual applicant tracking system.

## Career matching formula

Implemented in `app/ai/career/career_matcher.py`:

| Component | Weight |
|---|---|
| Required-skill coverage | 45% |
| Recommended-skill coverage | 15% |
| Experience-level alignment | 15% |
| Resume semantic similarity (TF-IDF cosine, not a transformer model) | 15% |
| Stated preference alignment | 10% |

## Interview evaluation

Every text, voice-transcript, and video-transcript answer is evaluated by Gemini through
`app/ai/interview/text_evaluator.py`. Gemini returns schema-constrained JSON containing the overall,
technical accuracy, communication, confidence, grammar, fluency, relevance, and problem-solving scores,
plus strengths, weaknesses, an improved answer, interview tips, career advice, learning resources, and a
follow-up question. Pydantic rejects missing, extra, malformed, or out-of-range fields. A failed evaluation
returns HTTP 503 and does not save a fallback score.

Voice recordings are officially transcribed by Gemini. Browser speech recognition is preview-only. FFmpeg
measures recording duration and silence intervals; the backend derives WPM, speaking-speed category, pause
metrics, and filler count, while Gemini supplies delivery confidence, fluency, pronunciation intelligibility,
and voice clarity. These metrics are stored per answer and aggregated into the final report.

For every video answer, FFmpeg extracts a temporary normalized audio track and Gemini creates the official
transcript; any browser transcript remains preview-only. OpenCV samples at most 120 frames and calculates
observable presentation metrics for eye-contact estimate, face detection, head position, looking-away
percentage, smile presence, face visibility, camera stability, lighting quality, body-language presentation,
and a separate video-confidence score. Extracted audio is deleted in a `finally` block, including failures.

## AI & fallback behaviour

Per the spec's explicit requirement ("the system must not depend completely on a paid AI API" / "must still work when Ollama or another model is unavailable"), every AI module that depends on a heavy optional library is wrapped so the feature **degrades gracefully instead of crashing**:

| Module | Real implementation (if installed) | Fallback |
|---|---|---|
| `ai/speech/speech_to_text.py` | Gemini official transcription | Returns `available: false` + a retry message when Gemini cannot transcribe |
| `ai/video/video_signal_analyzer.py` | OpenCV bounded frame analysis | Returns `signals_available: false`; answer evaluation still depends on a valid Gemini transcript |
| `ai/llm/ollama_client.py` | Local Ollama server | Falls back to template-based question generation (`ai/interview/question_generator.py`) |

**Optional cloud AI providers** (`ai/llm/gemini_client.py`, `ai/llm/anthropic_client.py`): if you don't run Ollama, set `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) in `.env` and `app/ai/llm/fallback_generator.py` will use that instead — the provider chain tries Ollama first, then Gemini, then Anthropic, then finally the deterministic templates. You only need to set the one key for whichever provider you actually have.
| `ai/resume/skill_extractor.py` | Optional spaCy noun-phrase extraction | Deterministic keyword/alias matching (always active, doesn't need spaCy) |

**This backend ships without the heavy ML packages installed by default** (no PyTorch, no downloaded Whisper/spaCy models) — they're commented out at the bottom of `requirements.txt`. This was a deliberate choice for a reliably-runnable submission: those packages are large, and Whisper/spaCy models require a first-run download from the internet. Installing them is a drop-in upgrade — nothing else in the codebase needs to change, since every module already checks for them at runtime.

OpenCV headless and FFmpeg support are installed by `requirements.txt`; no external landmark-model download is
required. Gemini speech-to-text is enabled with `GEMINI_API_KEY`.

Resume text extraction, ATS scoring, skill matching, career matching, skill-gap analysis, roadmap generation,
and question selection retain their documented deterministic fallbacks. Interview answer evaluation and
official voice transcription require a configured Gemini API key and intentionally do not create fake scores
when Gemini is unavailable.

## Testing

Uses a **separate MySQL database** (`TEST_DATABASE_URL`), never your dev/prod database. Each test runs inside a transaction + SAVEPOINT that's rolled back afterward, so tests stay isolated even though the application code calls `db.commit()` internally.

```bash
# create the test database first (once):
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS interview_iq_test;"

pytest app/tests/ -v
```

45 tests covering registration/login/tokens/admin-authorization, profile/onboarding ownership, career matching + skill gap + ownership, resume upload/validation/analysis/ownership, roadmap generation + completion, the full interview lifecycle (create → start → answer → evaluate → skip → complete → invalid-state-transition → ownership), progress dashboard, subscription usage limits + demo upgrade/cancel, and admin CRUD + authorization for questions/roles/resources/users.

## Frontend integration

Set in the frontend's `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

CORS is configured via `CORS_ORIGINS` in the backend `.env` (defaults to `http://localhost:5173`). Every response follows the standard envelope your frontend's mock services already expect:
```json
{ "success": true, "message": "...", "data": { ... } }
```
and paginated list endpoints return:
```json
{ "success": true, "message": "...", "data": { "items": [...], "pagination": { "page": 1, "page_size": 20, "total_items": 0, "total_pages": 0, "has_next": false, "has_previous": false } } }
```
Error responses always include `success: false`, a safe `message`, an `error.code`, and a `request_id` for support/debugging — no stack traces are ever exposed to the client.

To go live: replace each frontend `src/services/*.js` mock function body with a real `fetch`/`axios` call to the matching endpoint below — the response shapes already match what the frontend mock layer returns.

## Responsible AI

- Every AI-derived score is explicitly labelled advisory/estimated, both in API responses (`model_disclaimer` on interview reports) and in this documentation.
- Video signal analysis never claims to detect honesty, emotion, personality, or protected characteristics — see `ai/video/eye_direction.py`, which is intentionally a documented no-op rather than a "confidence" or "attention" score.
- Video-derived scores are excluded from the main weighted formula entirely; they only ever appear as separate, clearly-labelled optional fields (`face_visibility_percentage`, `forward_facing_percentage`).
- Filler-word and pace analysis never factors in accent.

## Known limitations

- Heavy local AI packages (Whisper, OpenCV/MediaPipe, a local LLM) are not installed by default — see [AI & Fallback Behaviour](#ai--fallback-behaviour).
- Email sending isn't wired to a real SMTP provider; verification/reset tokens are printed to the server console in development (`[DEV] ...` log lines) instead of emailed.
- Payments are explicitly demo-only (`/api/subscriptions/demo-upgrade`) — no real card details are collected or charged, per the spec.
- Rate limiting (`core/rate_limit.py`) is scaffolded but disabled by default (`RATE_LIMIT_ENABLED=false`) — this project doesn't ship a Redis dependency, so the limiter is in-memory and best suited to a single-process deployment.
- Long-running job polling (`/api/jobs/{id}`) uses the `processing_jobs` table but analysis in this build runs synchronously within the request rather than as a background task — the table and endpoints are ready for a Celery/RQ upgrade without further schema changes.

## Future improvements

- Swap TF-IDF similarity for `sentence-transformers` once model-download access is available in your deployment environment.
- Move resume/audio/video processing to a real task queue (Celery + Redis) using the existing `processing_jobs` table.
- Wire a real SMTP provider for verification/reset emails.
- Add refresh-token device/session metadata for a real "active sessions" list in Settings.
