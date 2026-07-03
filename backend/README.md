# DevInsight Backend

**AI-powered Engineering Intelligence Platform — FastAPI Backend**

> This backend powers the DevInsight frontend. It connects to GitHub, runs 6 specialized AI agents, builds a RAG knowledge base, and serves live engineering analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI + Python 3.12 |
| Database | PostgreSQL + SQLAlchemy 2.0 (async) + Alembic |
| Auth | GitHub OAuth 2.0 + PyJWT |
| AI | Google Gemini 2.5 Flash |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) — free, local |
| Vector DB | FAISS (in-process) |
| Task Queue | ARQ + Redis |
| Real-time | FastAPI WebSockets |

---

## Prerequisites

- Python 3.12+
- Docker & Docker Compose (for local dev)
- A GitHub OAuth App ([create here](https://github.com/settings/applications/new))
- A Google Gemini API key ([free at Google AI Studio](https://aistudio.google.com/))

---

## Quick Start (Local Development)

### 1. Clone and enter the backend directory
```bash
cd devinsight-design-system/backend
```

### 2. Create your environment file
```bash
cp .env.example .env
# Edit .env and fill in:
#   SECRET_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GEMINI_API_KEY
```

### 3. Start PostgreSQL and Redis via Docker
```bash
docker-compose up postgres redis -d
```

### 4. Create Python virtual environment and install dependencies
```bash
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 5. Run database migrations
```bash
alembic upgrade head
```

### 6. Start the FastAPI development server
```bash
uvicorn app.main:app --reload --port 8000
```

### 7. Start the ARQ background worker (separate terminal)
```bash
arq app.workers.settings.WorkerSettings
```

### 8. Open the API documentation
Visit: http://localhost:8000/docs

---

## Or: Start everything with Docker Compose

```bash
# Copy and edit env file first
cp .env.example .env

# Build and start all services
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **FastAPI app** on port 8000
- **ARQ worker** (background job processor)

---

## GitHub OAuth Setup

1. Go to https://github.com/settings/applications/new
2. Application name: `DevInsight Local`
3. Homepage URL: `http://localhost:5173`
4. Authorization callback URL: `http://localhost:8000/api/v1/auth/callback`
5. Copy the Client ID and Client Secret into your `.env` file

---

## GitHub Webhook Setup (for PR analysis)

1. In your GitHub repository settings → Webhooks → Add webhook
2. Payload URL: `https://your-ngrok-url.ngrok.io/api/v1/webhooks/github`
3. Content type: `application/json`
4. Secret: the value of `GITHUB_WEBHOOK_SECRET` in your `.env`
5. Events: Pull requests, Issues, Pushes

For local development, use [ngrok](https://ngrok.com/) to expose your local server:
```bash
ngrok http 8000
```

---

## Database Migrations

```bash
# Generate a new migration after changing models
alembic revision --autogenerate -m "describe your change"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1
```

---

## Running Tests

```bash
pytest tests/ -v --cov=app --cov-report=term-missing
```

The test suite includes:
- **Unit Tests**: RAG text chunker, unified diff parser, AI Agent registration and contract compliance, and Analytics service Overview KPI calculations.
- **Integration Tests**: OAuth authentication, API health check endpoints, and comprehensive intelligence reports (repository health, PR complexity, bug triage, technical debt, and recommendations).

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              ← FastAPI app entry point
│   ├── api/v1/              ← HTTP route handlers
│   ├── core/                ← Config, security, logging, exceptions
│   ├── database/            ← SQLAlchemy engine + session
│   ├── models/              ← ORM models (PostgreSQL tables)
│   ├── schemas/             ← Pydantic request/response schemas
│   ├── agents/              ← 6 AI agents + orchestrator
│   ├── github/              ← GitHub API client + webhook parser
│   ├── rag/                 ← Chunker + embedder + FAISS indexer + retriever
│   ├── workers/             ← ARQ background jobs
│   └── services/            ← Business logic services
├── alembic/                 ← Database migrations
├── tests/                   ← Test suite
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | System health check |
| GET | `/api/v1/auth/github` | Start GitHub OAuth |
| GET | `/api/v1/auth/callback` | OAuth callback → JWT |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Auth status check |
| GET | `/api/v1/repositories` | List repositories |
| POST | `/api/v1/repositories/connect` | Connect GitHub repo |
| GET | `/api/v1/repositories/{id}` | Repository detail |
| GET | `/api/v1/pull-requests` | List PRs |
| GET | `/api/v1/pull-requests/{id}` | PR with AI findings |
| POST | `/api/v1/pull-requests/{id}/findings/{fid}/feedback` | Finding feedback |
| GET | `/api/v1/bugs` | List bugs |
| GET | `/api/v1/bugs/{id}` | Bug with root cause |
| GET | `/api/v1/analytics/overview` | Dashboard KPIs |
| GET | `/api/v1/notifications` | User notifications |
| POST | `/api/v1/knowledge/upload` | Upload document |
| POST | `/api/v1/knowledge/search` | Semantic search |
| POST | `/api/v1/webhooks/github` | GitHub webhook receiver |
| WS | `/ws/{user_id}` | Real-time notifications |

---

## Deploying to Render (Free Tier)

1. Push the `backend/` folder to a GitHub repository
2. Create a new **Web Service** on [Render](https://render.com)
3. Build command: `pip install -r requirements.txt && alembic upgrade head`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all `.env` variables in Render's Environment settings
6. Create a free **PostgreSQL** database on Render and set `DATABASE_URL`
7. Create a free **Redis** instance (Upstash or Render) and set `REDIS_URL`
8. Create a second worker service with start command: `arq app.workers.settings.WorkerSettings`
