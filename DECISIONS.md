# Technical Decisions

## 1. Database: SQLite via sql.js

**Chosen:** SQLite (in-memory + file-backed via sql.js)

**Why:** For an internship assignment scope, SQLite is ideal — zero infrastructure, file-backed persistence, full SQL capabilities, and no external services required. sql.js is a pure-JavaScript SQLite port that works without native bindings, making it reliably portable across any Node.js environment.

**Alternatives Considered:**
- **PostgreSQL** — Production-grade but requires a running server; adds unnecessary infrastructure complexity for this scope.
- **MongoDB** — Flexible schema but document model is not the best fit for relational meeting/action item data.
- **better-sqlite3** — Faster than sql.js but requires native compilation (failed in CI environments).

**Trade-offs:**
- sql.js writes the entire database to disk on every mutation (via `export()`), which is slower than native SQLite for high-write workloads. Acceptable for this use case.
- For production: migrate to PostgreSQL or PlanetScale.

---

## 2. Authentication: JWT (JSON Web Tokens)

**Chosen:** JWT with Bearer tokens

**Why:** Stateless, no server-side session storage needed, well-understood standard, easy to test with `curl` and Swagger UI. Tokens include `userId`, `email`, and `name` in the payload, avoiding extra DB lookups per request.

**Alternatives Considered:**
- **Session-based auth** — Requires session store (Redis or DB table), adds infrastructure.
- **API keys** — Simple but lacks standard expiry and user identity conventions.
- **OAuth** — Overkill for this assignment; adds third-party dependency.

**Trade-offs:**
- JWTs cannot be invalidated before expiry without a token blacklist. Acceptable here since the assignment does not require logout functionality.
- Secret management is critical — using `JWT_SECRET` env var, never hardcoded.

---

## 3. AI Provider: Google Gemini 1.5 Flash

**Chosen:** Gemini 1.5 Flash via REST API

**Why:** Free tier available, large context window (1M tokens — perfect for long transcripts), fast response times, strong instruction following for JSON-only output.

**Alternatives Considered:**
- **OpenAI GPT-4o** — Excellent quality but paid-only; no free tier.
- **Groq** — Very fast (LLaMA 3), free tier, but JSON mode less reliable than Gemini.
- **Claude Haiku** — Would work well, but self-referential choice in an interview context.
- **OpenRouter** — Good abstraction layer but adds indirection.

**Trade-offs:**
- Gemini can occasionally return non-JSON despite strict prompting. Handled with `replace()` strip of markdown fences and try/catch with clear error messages.
- Rate limits on free tier: ~15 RPM. Acceptable for this scope.

---

## 4. External Integration: Discord Webhook

**Chosen:** Discord Webhook

**Why:** Zero authentication setup — just a URL. No SDK installation required (plain HTTP POST). Discord is widely used in developer teams. Rich embed support for visually structured reminder cards.

**Alternatives Considered:**
- **Slack Webhook** — Also simple, but requires workspace admin to create apps.
- **Resend/SendGrid Email** — Requires email domain verification.
- **Telegram Bot API** — Requires creating a bot and knowing chat IDs.
- **Notion API** — More complex for a simple notification.

**Trade-offs:**
- If `DISCORD_WEBHOOK_URL` is not configured, reminders are gracefully skipped with a log warning. The app does not crash.
- Webhook URLs can be revoked — no retry mechanism implemented (acceptable for MVP).

---

## 5. Validation: Zod

**Chosen:** Zod

**Why:** TypeScript-friendly (works great in JS too), composable schema definitions, excellent error messages, safeParse API for clean validation without exceptions in the middleware.

**Alternatives Considered:**
- **Joi** — Mature but more verbose; Zod's API is cleaner for modern JS.
- **express-validator** — Middleware-chaining style is less readable.
- **Manual validation** — Error-prone and harder to maintain.

---

## 6. Scheduler: node-cron

**Chosen:** node-cron

**Why:** Lightweight, no external queue required, runs in-process. Cron expression configurable via env var for flexibility. Reminder deduplication prevents spamming — items that received a reminder in the last 24 hours are skipped.

**Alternatives Considered:**
- **Bull/BullMQ** — Production-grade job queue with Redis. Overkill for this scope; adds Redis dependency.
- **setTimeout loops** — Fragile, not expressed in standard cron syntax.
- **Cloud schedulers (Render Cron Jobs)** — Would require a separate endpoint, adds complexity.

---

## 7. Project Structure

Organized by **layer** (routes, services, middleware, utils, jobs) rather than by feature. This is standard for Express projects of this size. Each layer has a single responsibility:

- `routes/` — HTTP request handling, validation, response
- `services/` — Business logic and third-party integrations (AI, Discord)
- `middleware/` — Cross-cutting concerns (auth, logging, errors, validation)
- `jobs/` — Background processes
- `utils/` — Pure helper functions (logging, responses, swagger)
- `db/` — Database initialization and query helpers

This separation makes each file independently testable and easy to navigate.
