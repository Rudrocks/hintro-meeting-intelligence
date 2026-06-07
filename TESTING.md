# Testing

## Test Suite

Located in `tests/run.js`. Run with:

```bash
npm test
```

The suite starts the Express server on port 3999 and runs 32 HTTP-level tests covering all major flows.

**Results: 32/32 passing**

---

## Test Scenarios

### Auth Tests (9 tests)
| Scenario | Expected |
|---|---|
| Register new user | 201, token returned |
| Register returns traceId | traceId in response |
| Register returns success:true | success field present |
| Duplicate email registration | 400 EMAIL_EXISTS |
| Invalid email / short password | 400 VALIDATION_ERROR |
| Login with correct credentials | 200, token returned |
| Login returns token | token field present |
| Wrong password | 401 INVALID_CREDENTIALS |

### Meeting Tests (9 tests)
| Scenario | Expected |
|---|---|
| Unauthenticated GET /api/meetings | 401 UNAUTHORIZED |
| Create meeting with valid data | 201, id present |
| Meeting has UUID id | id field non-null |
| Invalid participant email | 400 VALIDATION_ERROR |
| Get meeting by ID | 200, correct id |
| Returns correct meeting object | id matches |
| Get non-existent meeting | 404 NOT_FOUND |
| List meetings (paginated) | 200, array + pagination |
| Pagination metadata present | page, limit, total |

### Action Item Tests (7 tests)
| Scenario | Expected |
|---|---|
| Create action item with past dueDate | 201 |
| PATCH with invalid status | 400 VALIDATION_ERROR |
| PATCH with valid status IN_PROGRESS | 200 |
| Status field correctly updated | status === IN_PROGRESS |
| GET with status filter | 200 |
| GET /overdue endpoint | 200 |
| Past-due PENDING item appears in overdue | overdueItems.length > 0 |

### System Tests (7 tests)
| Scenario | Expected |
|---|---|
| GET /health | 200 |
| Health returns { status: "UP" } | status field |
| GET /api/evaluation | 200 |
| Evaluation lists features | features.length > 0 |
| Unknown route | 404 |
| Error response has success:false | success === false |

---

## Edge Cases Considered

- **Empty transcript** — Zod validation rejects with VALIDATION_ERROR
- **Invalid email in participants** — Rejected before hitting DB
- **Invalid ISO date for meetingDate** — Rejected at validation layer
- **Invalid status value** — Rejected by Zod enum validation
- **Missing required fields** — Zod provides field-specific error messages
- **Non-existent meeting ID** — 404 NOT_FOUND response
- **Non-existent action item ID** — 404 NOT_FOUND response
- **Re-analysis of same meeting** — Previous analysis replaced, PENDING action items re-generated
- **Overdue item that's COMPLETED** — Excluded from overdue list correctly
- **Missing DISCORD_WEBHOOK_URL** — Reminder job skips gracefully with log warning
- **Missing GEMINI_API_KEY** — Analysis endpoint returns 500 with clear error message
- **Malformed JSON request body** — Express JSON middleware returns 400

---

## Limitations Discovered

1. **AI analysis tests are not included in the automated suite** — They require a live Gemini API key and make real network calls. Manual testing was performed.

2. **Discord reminder tests are not automated** — Requires a live webhook URL. The service code is unit-tested only through manual verification.

3. **No database isolation between test runs** — The test suite deletes `data/meetings.db` before running to ensure a clean state. Tests should be idempotent.

4. **No load/stress testing** — sql.js serialized writes would be a bottleneck under concurrent load. Acceptable for MVP scope.

5. **No integration tests for the reminder scheduler** — The `processOverdueReminders()` function is exported and can be called directly for integration testing with a seeded DB.
