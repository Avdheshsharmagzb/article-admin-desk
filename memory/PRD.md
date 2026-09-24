# Newsroom Admin Dashboard — PRD

## Original Problem Statement
Create the core database schema and Admin Dashboard UI for a news portal. The database stores news items with fields: id, original_url, original_title, original_content, rewritten_title, rewritten_content, media_url, media_type (photo/video), and status (Pending_Review, Approved_For_Rewrite, Rewritten_Pending_Publish, Published). Build a clean Admin Dashboard to view items in tabs by status.

## User Choices
- Manual editorial workflow for now (no AI rewrite yet)
- No authentication for now
- Seed sample news items
- Design chosen by agent (editorial high-contrast slate theme)

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Collection `news_items`. All routes `/api` prefixed.
- **Frontend**: React + Tailwind + shadcn/ui, Sonner toasts, lucide icons. Single Dashboard route.

## Data Model (news_items)
id (uuid), original_url, original_title, original_content, rewritten_title, rewritten_content, media_url, media_type (photo|video), status, created_at, updated_at.

## API (implemented 2026-06)
- GET `/api/news/stats` — counts per status + total
- GET `/api/news?status=` — list / filter (400 on invalid status)
- GET `/api/news/{id}` — single (404 if missing)
- POST `/api/news` — create
- PATCH `/api/news/{id}` — update rewritten fields / media
- PATCH `/api/news/{id}/status` — status transition
- DELETE `/api/news/{id}` — delete
- POST `/api/news/seed?force=` — seed/reset sample data (also auto-seeds on startup if empty)

## Implemented (2026-06)
- 4 stat cards + tabbed navigation (All + 4 statuses) with live counts
- Responsive news card grid with media preview, status badge, source link, original vs rewritten preview
- Side-by-side editor modal: original (read-only) vs rewritten (editable) title & content, word counts, media player
- Workflow actions: Approve for Rewrite → Submit Rewrite (requires rewrite content) → Publish, with toasts
- 5 seeded sample items across all statuses
- Verified: backend 10/10 pytest, frontend flows 100%

## Backlog
- P1: AI-powered rewrite (Emergent LLM key)
- P2: Authentication (JWT or Google) for admin access
- P2: Create-new-item UI form (backend POST already exists)
- P2: Pagination / search, lifespan handler migration
