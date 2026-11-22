# Sweety – Blood Glucose Tracker

Sweety is a web-based blood glucose tracking application that allows patients to record their blood glucose readings, view daily and monthly reports, and connect with registered doctors. Doctors can view their assigned patients and access their reports through a separate dashboard.

## Technology Stack

- **Frontend:** React 18, Vite
- **Backend:** Node.js, Express
- **Database:** PostgreSQL 16
- **Authentication:** JWT, HTTP-only cookies, bcrypt
- **Validation:** Zod
- **Testing:** Vitest, Supertest, React Testing Library
- **Database setup:** Docker Compose

## Features

### 1. Patient

- Register and log in as a patient.
- Add, view, edit and delete blood glucose readings.
- Record up to four readings per day:
  - Morning (fasting)
  - After breakfast
  - After lunch
  - After dinner
- View daily, month-to-date and previous-month reports.
- Connect with a registered doctor using the doctor's email address.

### 2. Doctor

- Register and log in as a doctor.
- Access a dedicated doctor dashboard.
- View assigned patients.
- Select a patient and view their blood glucose reports.
- Access is restricted to patients assigned to that doctor.

### 3. Security and Validation

- Passwords are hashed using bcrypt and never stored as plain text.
- JWT-based authentication using HTTP-only cookies.
- Role-based access control for patients and doctors.
- Server-side validation of incoming requests.
- Reading values must be whole numbers between 40 and 600 mg/dL.
- Only one reading is allowed per time slot per day.
- A maximum of four readings is allowed per day.
- Future reading dates are not allowed.
- Database constraints provide additional data integrity.

## Prerequisites

Install the following before running the application:

- Git
- Node.js 20.6 or later
- npm
- Docker Desktop with Docker Compose

**PostgreSQL does not need to be installed separately.** Docker Compose runs the PostgreSQL database.

The backend and frontend run separately using Node.js and npm.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Charvi012/Sweety-Blood-Glucose-Tracker.git
cd Sweety-Blood-Glucose-Tracker
```

### 2. Start the PostgreSQL database

From the project root, run:

```bash
docker compose up -d db
```

This starts PostgreSQL 16 and creates the `sweety` database.

The initialization script in `db-init/` also creates the `sweety_test` database when the PostgreSQL data volume is initialized for the first time.

To check the database container:

```bash
docker compose ps
```

### 3. Configure backend environment variables

Create a `.env` file from the example.

**Windows PowerShell:**

```powershell
Copy-Item .\server\.env.example .\server\.env
```

**Linux/macOS:**

```bash
cp server/.env.example server/.env
```

Open `server/.env` and configure `JWT_SECRET`.

Generate a secure secret using:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into `JWT_SECRET` in `server/.env`.

The `.env.example` file contains the following configuration variables:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Application environment |
| `PORT` | Backend server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `JWT_EXPIRES_IN_HOURS` | Session expiration time |
| `BCRYPT_COST` | Password hashing cost |
| `APP_TIMEZONE` | Time zone used for date validation |
| `CLIENT_ORIGIN` | Allowed frontend origin |


### 4. Install backend dependencies and run migrations

Open a terminal at the project root:

```bash
cd server
npm install
npm run migrate
```

Start the backend:

```bash
npm run dev
```

The backend API runs at:

`http://localhost:4000`

### 5. Install and start the frontend

Open a second terminal at the project root:

```bash
cd client
npm install
npm run dev
```

The frontend runs at:

`http://localhost:5173`

Open the application in your browser:

`http://localhost:5173`

Register as a Patient or Doctor to begin using Sweety.

## Running Tests

### Backend tests

The backend integration tests require the `sweety_test` PostgreSQL database.

From the project root:

```bash
cd server
npm test
```

To run only unit tests:

```bash
npm run test:unit
```

### Frontend tests

From the project root, open a separate terminal:

```bash
cd client
npm test
```

### Production build

To verify the frontend production build:

```bash
cd client
npm run build
```

**Important:** Integration tests use `TEST_DATABASE_URL` if configured. Otherwise, they use:

`postgres://sweety:sweety@localhost:5432/sweety_test`

Tests truncate database tables between test cases. Never configure the test database to point to real user data.

## Assignment Requirements

The following required features from the assignment have been implemented.

### 1. Sign Up and Log In

- Users can register with their name, email and password.
- Users can log in using their registered credentials.
- Passwords are hashed using bcrypt.
- Each patient's reading data is isolated from other patients' data.

### 2. Add, View, Edit and Delete Readings

Patients can manage their blood glucose readings.

Each reading contains:

- Date
- Time slot
- Glucose value in mg/dL

The four supported time slots are morning (fasting), after breakfast, after lunch and after dinner.

**Validation rules:**

| Rule | Expected validation message |
|---|---|
| Value is required | Please enter a glucose value. |
| Value must be a whole number between 40 and 600 | Value must be between 40 and 600 mg/dL. |
| Only one reading per slot per day | You already have an [slot] reading for this date. |
| Maximum four readings per day | You can add only 4 readings per day. |
| Date cannot be in the future | Date cannot be in the future. |

Validation is performed on both the frontend and backend. Database constraints provide additional protection against duplicate readings.

### 3. Reports

The application provides three report types:

| Report | Date range |
|---|---|
| Daily | Selected date |
| Month-to-date | First day of the selected month through the selected date |
| Previous month | Entire calendar month preceding the selected date's month |

Each report displays:

- Highest reading
- Lowest reading
- Average reading, rounded to one decimal place
- Number of readings

The daily report also displays individual readings with their corresponding time slots.

A friendly empty state is displayed when no readings exist for the selected reporting period.

## Assignment Bonus Tasks

The following optional bonus tasks have been addressed:

| Bonus task | Status | Implementation |
|---|---|---|
| Pagination on `GET /readings` | Not implemented | Not included in the current version. |
| Monthly line chart | Not implemented | Not included in the current version. |
| Docker Compose for PostgreSQL and application | Partially implemented | Docker Compose starts PostgreSQL 16. The backend and frontend are started separately using npm. |
| React Testing Library for reading form | Completed | Reading form component tests are implemented using React Testing Library. |
| Redis report caching | Not implemented | Not included in the current version. |
| BullMQ background job | Not implemented | Not included in the current version. |
| Doctor role | Completed | Doctor dashboard, assigned-patient listing and assigned-patient report access. |

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register a patient or doctor |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get the authenticated user |
| GET | `/api/readings?from=&to=` | List the authenticated user's readings |
| POST | `/api/readings` | Create a reading |
| GET | `/api/readings/:id` | Get a reading |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |
| GET | `/api/reports?type=daily&date=YYYY-MM-DD` | Get a report for the selected date |
| POST | `/api/patients/doctor` | Connect a patient to a registered doctor |
| GET | `/api/patients/assigned` | List patients assigned to a doctor |
| GET | `/api/reports/patients/:patientId` | Get an assigned patient's report (doctor only) |

Protected endpoints require authentication. Patient and doctor endpoints also enforce the appropriate role.

Supported report types are `daily`, `month-to-date` and `monthly`.

## Project Structure

```text
Sweety-Blood-Glucose-Tracker/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── readings/
│   │   │   ├── reports/
│   │   │   └── patients/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── DoctorPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ReadingsPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ReportsPage.jsx
│   │   └── utils/
│   └── package.json
│
├── db-init/
├── docker-compose.yml
└── README.md
```

## Design Decisions

- Business rules are validated on the backend, with frontend validation providing immediate feedback.
- PostgreSQL constraints provide an additional layer of data integrity.
- Reports are calculated using SQL aggregate functions.
- Dates are handled as `YYYY-MM-DD` strings to avoid unintended date changes caused by time zones.
- Backend modules separate routes, controllers, services and repositories.
- Role-based middleware restricts access to patient and doctor functionality.

## Security

- Passwords are hashed using bcrypt.
- Authentication uses signed JWTs stored in HTTP-only cookies.
- API routes enforce authentication and role-based authorization.
- Database queries use parameterized SQL.
- Helmet security headers and request rate limits are enabled.
- CORS is restricted to the configured frontend origin.
- Unknown server errors return generic messages without exposing internal details.
- The server requires a JWT secret of at least 32 characters.

## Notes

### Assumptions

- The default application time zone is `Asia/Kolkata`.
- Patients can record up to four readings per day.
- Reading values must be whole numbers between 40 and 600 mg/dL.
- Reports include daily, month-to-date and previous-month summaries.
- A doctor can access reports only for patients assigned to that doctor.
- The application displays recorded values without providing medical diagnosis or treatment recommendations.

### Potential Improvements

With additional development time, the project could be extended with:

- Pagination for longer reading histories.
- Monthly charts for visualizing glucose trends.
- Automated end-to-end tests using Playwright.
- Continuous integration for backend and frontend tests.
- Redis caching for report results.
- Background jobs using BullMQ.
- Structured application logging.
- Account deletion and improved session management.
- Dockerfiles for running the complete application in containers.
