# Changelog

## [1.0.0] — 2026-06-07

### Initial Implementation

#### Infrastructure
- Initialized Express.js project with Node.js 18+
- Set up SQLite database via sql.js (no native bindings required)
- Created schema: `users`, `meetings`, `meeting_analyses`, `action_items`, `reminder_history`
- Configured dotenv for environment variable management

#### Authentication
- Implemented user registration with bcrypt password hashing (10 rounds)
- Implemented JWT-based login with configurable expiry
- Added JWT auth middleware protecting all `/api/*` routes (except auth endpoints)

#### Meeting Management
- `POST /api/meetings` — Create meeting with transcript (Zod validation)
- `GET /api/meetings` — List with pagination + optional title filter
- `GET /api/meetings/:id` — Get meeting with embedded analysis and action items

#### AI Meeting Analysis
- Integrated Google Gemini 1.5 Flash via REST API
- Designed grounding-first prompt with negative constraints to prevent hallucination
- Implemented citation extraction — every insight references a transcript timestamp
- Added post-processing citation validation against actual transcript timestamps
- `POST /api/meetings/:id/analyze` — Triggers analysis and saves results

#### Action Item Management
- `POST /api/action-items` — Create manual action items with optional citations
- `PATCH /api/action-items/:id/status` — Update to PENDING/IN_PROGRESS/COMPLETED
- `GET /api/action-items` — List with filters: status, assignee, meetingId
- `GET /api/action-items/overdue` — Detect items past due date, not completed

#### Scheduled Reminders
- Implemented node-cron scheduler (configurable cron expression)
- Reminder job detects overdue items and sends Discord webhook notifications
- Deduplication: items that received a reminder in last 24h are skipped
- Reminder history stored in `reminder_history` table

#### External Integration
- Discord webhook integration with rich embed cards
- Reminder payload includes: task, assignee, due date, status, meeting ID
- Graceful skip when `DISCORD_WEBHOOK_URL` not configured

#### Non-Functional
- Unified API response format: `{ traceId, success, data/error }`
- Request trace IDs (auto-generated UUID or from `X-Trace-Id` header)
- Structured JSON logging with timestamp, traceId, method, path, status
- Global error handler — app never crashes on invalid input
- CORS enabled for all origins
- Health endpoint: `GET /health`
- Evaluation endpoint: `GET /api/evaluation`

#### Documentation
- Swagger/OpenAPI spec auto-generated from JSDoc comments
- Swagger UI at `/api-docs`
- README, DECISIONS, AI_APPROACH, TESTING, CHANGELOG, CHECKLIST

#### Testing
- 32-test suite covering auth, meetings, action items, validation, overdue, and system endpoints
- 32/32 tests passing
