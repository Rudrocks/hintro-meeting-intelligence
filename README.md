# Hintro Meeting Intelligence Service

An AI-powered backend service for managing meetings, extracting actionable insights, and tracking follow-ups. Built with Node.js, Express, SQLite (sql.js), and Gemini AI.

---

## Features

- **JWT Authentication** — Register and login with secure password hashing
- **Meeting Management** — Create, list (paginated), and retrieve meetings with transcripts
- **AI Meeting Analysis** — Gemini-powered summary, action items, decisions, and follow-up suggestions
- **Grounded Citations** — Every AI-generated insight is cited to the exact transcript timestamp
- **Hallucination Prevention** — Strict citation validation and grounding-only prompt design
- **Action Item Management** — Create, filter, and update action item status
- **Overdue Detection** — Automatically flags incomplete items past their due date
- **Scheduled Reminders** — node-cron job sends Discord webhook notifications for overdue items
- **Structured Logging** — Every request logged with trace ID, method, path, status
- **Unified API Responses** — Consistent `{ traceId, success, data/error }` format
- **Swagger/OpenAPI Docs** — Available at `/api-docs`

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | SQLite via sql.js (file-backed) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod |
| AI Provider | Google Gemini 1.5 Flash |
| Scheduler | node-cron |
| External Integration | Discord Webhook |
| Docs | Swagger UI (swagger-jsdoc + swagger-ui-express) |

---

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- A Gemini API key ([get one here](https://aistudio.google.com/apikey))
- A Discord webhook URL (optional, for reminders)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/hintro-meeting-intelligence.git
cd hintro-meeting-intelligence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your-gemini-api-key-here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
REMINDER_CRON=0 * * * *
```

### 4. Run locally

```bash
npm start
```

The server starts on `http://localhost:3000`.

- Swagger Docs: `http://localhost:3000/api-docs`
- Health: `http://localhost:3000/health`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3000) |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | JWT expiry (default: 7d) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `DISCORD_WEBHOOK_URL` | No | Discord webhook for reminders |
| `REMINDER_CRON` | No | Cron expression (default: `0 * * * *`) |
| `DEPLOYED_URL` | No | Public URL shown in /api/evaluation |

---

## API Usage Examples

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

### Create Meeting

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint Planning",
    "participants": ["alice@example.com", "bob@example.com"],
    "meetingDate": "2026-05-20T10:00:00Z",
    "transcript": [
      {"timestamp": "00:10", "speaker": "John", "text": "We should launch next Friday."},
      {"timestamp": "00:20", "speaker": "Alice", "text": "I will prepare release notes."}
    ]
  }'
```

### Analyze Meeting (AI)

```bash
curl -X POST http://localhost:3000/api/meetings/MEETING_ID/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Action Item Status

```bash
curl -X PATCH http://localhost:3000/api/action-items/ITEM_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

### Get Overdue Action Items

```bash
curl -X GET http://localhost:3000/api/action-items/overdue \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Running Tests

```bash
npm test
```

Runs a built-in test suite covering: auth, meetings, action items, validation, overdue detection, and system endpoints.

---

## Deployment

### Deploy to Render

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard
6. Add a **Disk** (mount at `/home/node/app/data`) for SQLite persistence

### Deploy to Railway

```bash
npm install -g railway
railway login
railway init
railway up
```

Set environment variables in the Railway dashboard.

---

## Project Structure

```
hintro-meeting-intelligence/
├── index.js                    # Express app entry point
├── src/
│   ├── db/
│   │   └── database.js         # SQLite setup (sql.js), schema, helpers
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── trace.js            # Request trace ID middleware
│   │   └── validate.js         # Zod schema validation helper
│   ├── routes/
│   │   ├── auth.js             # POST /api/auth/register, /login
│   │   ├── meetings.js         # Meeting CRUD
│   │   ├── analysis.js         # POST /api/meetings/:id/analyze
│   │   └── actionItems.js      # Action item management + overdue
│   ├── services/
│   │   ├── aiService.js        # Gemini AI integration + grounding
│   │   └── discordService.js   # Discord webhook integration
│   ├── jobs/
│   │   └── reminderJob.js      # node-cron scheduled reminder job
│   └── utils/
│       ├── logger.js           # Structured JSON logger
│       ├── response.js         # Unified response helpers
│       └── swagger.js          # OpenAPI/Swagger spec
├── tests/
│   └── run.js                  # Test suite (32 tests)
├── data/                       # SQLite database files (auto-created)
├── .env.example
├── README.md
├── DECISIONS.md
├── AI_APPROACH.md
├── TESTING.md
├── CHANGELOG.md
└── CHECKLIST.md
```
