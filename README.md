# Assessment Platform

A full-stack online assessment platform built with **Next.js 16**, **Supabase**, and **Redux Toolkit**. Employers create and manage timed exams; candidates register, sit, and submit them — with offline resilience via a service worker and IndexedDB.

---

## Features

### Employer
- Create multi-section exams with configurable time windows, slot limits, duration, and optional negative marking
- Define question sets with multiple-choice (radio/checkbox) and free-text questions
- View per-exam candidate registrations and submission status

### Candidate
- Browse and register for active exams
- Take exams in a timed, fullscreen-enforced session
- Answers are saved locally (IndexedDB) and synced to the server; no progress is lost on a brief disconnect
- Behavioral events (tab switches, fullscreen exits, focus loss) are logged

### General
- Role-based routing enforced in both middleware and API routes
- Service worker for offline page caching
- Toast notifications and accessible UI via shadcn/ui

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth & DB | Supabase (Auth + Postgres) |
| State | Redux Toolkit |
| Forms | React Hook Form + Zod |
| UI | shadcn/ui, Tailwind CSS v4 |
| Offline | Service Worker + idb-keyval |
| HTTP | Axios |

---

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)
- A [Supabase](https://supabase.com/) project

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
pnpm build
pnpm start
```

---

## Project Structure

```
app/
  api/                  # Route handlers (auth, employer, candidate)
  candidate/            # Candidate pages (dashboard, exam)
  candidate-login/
  employer/             # Employer pages (dashboard, exams)
  employer-login/
components/
  candidate/            # ExamScreen, QuestionRenderer
  employer/             # CreateExamStepper, QuestionModal, QuestionSetManager
  shared/               # Navbar, LoginForm, AuthHydrator, OfflineBanner
  ui/                   # shadcn/ui primitives
hooks/                  # useAuth, useExamSession, useExamTimer, useBehaviorTracking
lib/
  supabase/             # Server and client Supabase clients
  axios.ts              # Axios instance with 401 interceptor
middleware.ts           # Auth guards and role-based redirects
store/                  # Redux store, slices (auth, exams, examSession)
types/                  # Shared TypeScript interfaces
public/
  sw.js                 # Service worker
```

---

## Database Schema

The application expects the following Supabase tables:

| Table | Key Columns |
|---|---|
| `profiles` | `id, role, full_name, email, created_at` |
| `exams` | `id, employer_id, title, total_candidates, total_slots, start_time, end_time, duration, negative_marking, created_at` |
| `question_sets` | `id, exam_id, title, created_at` |
| `questions` | `id, question_set_id, title, type, options, correct_answers, created_at` |
| `exam_registrations` | `id, exam_id, candidate_id, status, started_at, submitted_at, created_at` |
| `exam_answers` | `id, registration_id, question_id, answer, created_at` |
| `behavioral_logs` | `id, registration_id, event_type, logged_at` |

Row-level security (RLS) should be enabled and policies scoped to the authenticated user's role.
# assessment-platform
