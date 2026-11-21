# Sweety – Blood Glucose Tracker

A small web app where a person with diabetes records up to four blood-glucose readings a day and views daily, month-to-date and previous-month reports.

**Stack:** Node.js + Express API · PostgreSQL · React (Vite) frontend · Vitest + Supertest + Testing Library.

## Features

- **Sign up / log in** with name, email and password. Passwords are hashed with bcrypt; users only ever see their own readings.
- **Add, view, edit and delete readings** (date, one of four time slots, value in mg/dl) with clear validation messages in the UI.
- **Reports** for a selected date: *Daily*, *Month-to-date* and *Previous month*, each showing highest, lowest, average (1 decimal) and count. The daily report also lists every reading with its slot. Empty periods show a friendly empty state.

## Quick start

Requirements: Node.js 20.6+ and PostgreSQL 14+ (Docker is the easiest way to get it).

```bash
# 1. Start PostgreSQL (creates the `sweety` and `sweety_test` databases)
docker compose up -d

# 2. API
cd server
cp .env.example .env          # then set JWT_SECRET (instructions inside the file)
npm install
npm run migrate               # creates the tables
npm run dev                   # http://localhost:4000

# 3. Frontend (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173
```

Open http://localhost:5173, create an account and add a reading.

Not using Docker? Create the databases yourself (`createdb sweety && createdb sweety_test`) and update `DATABASE_URL` in `server/.env`.

## Running the tests

```bash
cd server && npm test          # unit + integration (needs the sweety_test database)
cd server && npm run test:unit # unit tests only, no database required
cd client && npm test          # validation, form and report component tests
```

Integration tests use `TEST_DATABASE_URL` if set, otherwise `postgres://sweety:sweety@localhost:5432/sweety_test`. They truncate tables between tests, so never point it at real data.

**What the tests cover**

| Area | Examples |
| --- | --- |
| Validation (unit) | every reading rule and its exact message, boundary values 40/600, impossible dates, password rules |
| Date logic (unit) | previous-month range across year boundary and leap years, "today" in a time zone |
| Auth (integration) | bcrypt hash stored, duplicate email (any case), generic login error, tampered token, logout |
| Readings (integration) | create/update/delete, one-per-slot, max 4/day, moving a reading into a full day or taken slot, a concurrent double submit, **user isolation** (404 on other users' readings) |
| Reports (integration) | exact date ranges incl. first/last day boundaries, rounding to 1 decimal, empty period, per-user isolation |
| UI | form shows the right error messages, server errors appear next to the field, report card empty/filled states |

## Project structure

```
server/src
  app.js, server.js          Express app (testable, no listen) and the entry point
  config/                    Environment validation (fails fast on bad config)
  db/                        pg pool, schema.sql, migration runner
  middleware/                auth, validation, error handling, rate limits
  modules/auth|readings|reports
      routes -> controller -> service -> repository   (HTTP / rules / SQL kept apart)
  utils/                     date helpers, AppError, asyncHandler
client/src
  api/                       fetch wrapper + ApiError
  context/                   AuthContext
  components/ pages/ utils/
```

## API

All endpoints are under `/api`. Errors always look like `{ "error": { "code", "message", "fields?" } }`.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password }` → 201, sets login cookie |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/logout` | clears the cookie |
| GET | `/auth/me` | current user |
| GET | `/readings?from=&to=` | own readings, newest day first, slots in order |
| POST | `/readings` | `{ date, slot, value }` |
| GET/PUT/DELETE | `/readings/:id` | PUT replaces date, slot and value |
| GET | `/reports?type=daily\|month-to-date\|monthly&date=YYYY-MM-DD` | summary (+ readings for `daily`) |

Slots: `morning_fasting`, `after_breakfast`, `after_lunch`, `after_dinner`.

## Design decisions

- **Rules are enforced on the server first.** The UI mirrors them for instant feedback, but the API re-validates everything with zod.
- **The database is the last line of defence.** `CHECK` constraints on slot and value, and a `UNIQUE (user_id, reading_date, slot)` constraint. With four slots, that unique constraint also guarantees "max 4 readings per day" even when two requests race. The service checks first only so the user gets the clear message from the brief.
- **Reports are computed in SQL** (`MIN/MAX/AVG/COUNT`), not by loading rows into Node.
- **Dates are plain `YYYY-MM-DD` strings** end to end (the pg DATE type is parsed as a string), so time zones can never move a reading to another day.
- **Layered modules** (routes → controller → service → repository) keep HTTP, business rules and SQL separate and easy to test.

## Security

- Passwords hashed with bcrypt (cost 12; `bcryptjs`, the pure-JS implementation, so it installs on any machine without native builds). Never logged or returned.
- Login always performs a bcrypt comparison and returns one generic message, so it does not reveal which emails exist or leak timing differences.
- Session is a signed JWT (HS256 pinned) in an **httpOnly, SameSite=Strict** cookie (`Secure` in production): JavaScript cannot read it, and cross-site requests do not carry it. The API only accepts JSON bodies, which adds a second CSRF barrier.
- Every readings/reports query filters by the logged-in user's id taken from the token, never from the request body or URL. Another user's reading returns 404, not 403, so ids cannot be probed.
- Parameterised SQL everywhere (no string-built queries with user input), `helmet` headers, a 10 KB body limit, rate limits (20 auth attempts / 15 min / IP), CORS limited to the frontend origin, and unknown errors return a generic 500 without internals.
- The server refuses to start if `JWT_SECRET` is shorter than 32 characters.

## Assumptions

The brief left a few things open, so I decided and wrote them down:

1. **"Today" / future dates** are judged in `APP_TIMEZONE` (default `Asia/Kolkata`) on the server. The browser uses its own local date; if the two disagree around midnight the server's answer wins and the UI shows its message.
2. **Reports use the selected date as an anchor.** Daily = that day; month-to-date = 1st of that month → that date; monthly = the whole calendar month *before* the selected date's month. The selected date cannot be in the future.
3. **Editing** can change date, slot and value, and follows the same rules as adding (a reading moved to a full day or an occupied slot is rejected; it does not conflict with itself).
4. **Check order:** if a day already has 4 readings you see "You can add only 4 readings per day."; otherwise a taken slot shows "You already have an … reading for this date."
5. **Value** must be a whole JSON number. `"120"` (a string) or `120.5` is rejected by the API; the UI converts the input to a number.
6. **Password policy:** at least 8 characters with a letter and a number, at most 72 bytes (bcrypt ignores anything beyond that).
7. **Duplicate email on sign-up** says so explicitly. That is friendlier but does reveal that the email is registered; a production system might send an email instead.
8. Sessions last 12 hours (`JWT_EXPIRES_IN_HOURS`); there is no refresh-token flow.
9. Values are shown without clinical colour-coding or advice, because that needs medical guidance beyond this assignment.

## What I would do next

Pagination for long histories, a refresh-token flow and account deletion, e2e tests (Playwright), CI running both test suites against a Postgres service, structured logging with request ids, and a Dockerfile for the API.
