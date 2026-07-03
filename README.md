# DevInsight

[![Backend CI/CD](https://github.com/devinsight/devinsight/actions/workflows/ci.yml/badge.svg)](https://github.com/devinsight/devinsight/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.12%2B-blue.svg)](backend/)
[![Node Version](https://img.shields.io/badge/node-20%2B-green.svg)](frontend/)

**AI-powered Engineering Intelligence Platform — Automated Pull Request audits, repository health tracking, security risk alerts, and custom company knowledge RAG query engines.**

DevInsight integrates directly with GitHub to monitor repository activities, run 6 specialized AI agents concurrently for static analysis, index developer documentation inside a local FAISS semantic index, and deliver live analytics through a Vercel-style glassmorphic dashboard.

---

## 🚀 Key Features

*   **Engineering Dashboard**: High-level KPIs mapping repository health, security risks, open PRs, and team velocity.
*   **PR Review Queue**: Multi-agent code reviews evaluating Code Quality, Security, and Performance.
*   **Bug Triage & Root Cause Engine**: Automatic issue classification (P0–P3) and trace error analysis pinpointing source lines.
*   **Enterprise RAG Knowledge Base**: Semantic search and LLM context injection across custom uploaded company docs.
*   **First-Time UX Guide**: Interactive walkthroughs to connect GitHub OAuth credentials and register active repositories.

---

## 🛠️ Repository Architecture

DevInsight is divided into two distinct components:

```
devinsight/
├── backend/            ← FastAPI Gateway, SQLAlchemy DB Model, ARQ Background Worker, FAISS Index
└── frontend/           ← TanStack Start SSR App, Recharts analytics, Tailwind UI
```

### 1. [FastAPI Backend Gateway](backend/)
*   **Framework**: FastAPI with full Asyncpg SQLAlchemy 2.0 connection pooling.
*   **Database**: PostgreSQL 16 metadata storage + Alembic schema migrations.
*   **Task Broker**: Redis 7 powering ARQ asynchronous queues.
*   **Embeddings & Search**: local MiniLM transformer models mapping to an in-process FAISS Index.
*   **AI Providers**: Google Gemini 2.5 Flash API connector.

### 2. [TanStack Start Frontend](frontend/)
*   **UI Components**: Vite 8 + React 19 + Tailwind CSS + Lucide Icons.
*   **State Management**: TanStack React Query + React Router route guards.
*   **Analytics**: Recharts Area, Bar, and Line charts displaying codebase health metrics.

---

## ⚡ Quick Start (Local Docker Orchestration)

To build and start the entire ecosystem (frontend, backend gateway, postgres database, redis task manager, background task worker, and healthcheck probes):

```bash
# Clone the repository
git clone https://github.com/devinsight/devinsight.git
cd devinsight/backend

# Copy environment template and fill in Gemini/GitHub API keys
cp .env.example .env

# Compile and startup the container cluster
docker-compose up --build
```
Once initialized, visit:
*   **Frontend App**: `http://localhost:3000`
*   **Interactive REST Docs**: `http://localhost:8000/docs`
*   **API Gateway Status**: `http://localhost:8000/health`

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
