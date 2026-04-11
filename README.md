# Assessment Platform

A full-stack **Online Assessment Platform** built with **Next.js 16**, **Supabase**, and **Redux Toolkit**. Employers create and manage timed exams with multi-step forms and question sets; candidates browse, register, and sit exams in a timed fullscreen session — with offline resilience via a Service Worker and IndexedDB.

> **Live Demo:** [https://assessment-platform-rosy.vercel.app/employer-login](https://assessment-platform-rosy.vercel.app/employer-login)
> **Video Walkthrough:** [Watch on Loom](https://www.loom.com/share/your-video-id-here)

---

## Features

### Employer Panel

- **Login** — real authentication via Supabase Auth; redirects to dashboard on success
- **Dashboard** — exam cards showing Exam Name, Candidates, Question Sets, Exam Slots, and a "View Candidates" button
- **Create Online Test (multi-step)**
  - Step 1 — Basic Info: Title, Total Candidates, Total Slots, Question Sets, Question Type, Start/End Time, Duration
  - Step 2 — Question Sets: add/edit/delete questions via modal (Checkbox, Radio, Text types)
- **Candidates page** — view registrations and submission status per exam

### Candidate Panel

- **Login** — real authentication via Supabase Auth
- **Dashboard** — exam cards showing Duration, Questions count, Negative Marking flag, and "Start" button
- **Exam Screen** — question display with countdown timer, auto-submit on timeout, manual submit, and behavioral tracking (tab switch, fullscreen exit, focus loss)

### General

- Role-based routing enforced in `proxy.ts` (middleware) and all API routes
- Service Worker for offline page caching
- Answers persisted to IndexedDB and synced on reconnect — no progress lost on brief disconnects
- Toast notifications and accessible UI via shadcn/ui

---

## Tech Stack

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| Framework          | Next.js 16 (App Router)                 |
| Auth & Database    | Supabase (Auth + Postgres + RLS)        |
| State Management   | Redux Toolkit                           |
| Forms & Validation | React Hook Form + Zod                   |
| UI / Styling       | shadcn/ui, Tailwind CSS v4              |
| Offline            | Service Worker + idb-keyval (IndexedDB) |
| HTTP               | Axios (with 401 interceptor)            |

---

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) — `npm i -g pnpm`
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

### Demo Accounts

| Role      | Email              | Password |
| --------- | ------------------ | -------- |
| Employer  | employer@demo.com  | demo1234 |
| Candidate | candidate@demo.com | demo1234 |

---

## Project Structure

```
app/
  api/                  # Next.js Route Handlers (auth, employer, candidate)
  candidate/            # Candidate pages — dashboard, exam session
  candidate-login/
  candidate-register/
  employer/             # Employer pages — dashboard, create exam, candidates
  employer-login/
  employer-register/
components/
  candidate/            # ExamScreen, QuestionRenderer
  employer/             # CreateExamStepper, QuestionModal, QuestionSetManager
  shared/               # Navbar, LoginForm, RegisterForm, AuthHydrator, OfflineBanner
  ui/                   # shadcn/ui primitives
hooks/
  useAuth.ts            # Login, logout, session hydration
  useExamSession.ts     # Answer tracking, IndexedDB sync, flush on reconnect
  useExamTimer.ts       # Server-anchored countdown timer
  useBehaviorTracking.ts# Tab switch / fullscreen exit event logging
lib/
  axios.ts              # Axios instance with global 401 interceptor
  supabase/             # Server and browser Supabase clients
proxy.ts                # Auth guards and role-based redirects (middleware)
store/                  # Redux store + slices: auth, exams, examSession
types/                  # Shared TypeScript interfaces
public/
  sw.js                 # Service Worker
```

---

## Database Schema

| Table                | Key Columns                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `profiles`           | `id, role, full_name, email, created_at`                                                                  |
| `exams`              | `id, employer_id, title, total_candidates, total_slots, start_time, end_time, duration, negative_marking` |
| `question_sets`      | `id, exam_id, title`                                                                                      |
| `questions`          | `id, question_set_id, title, type, options, correct_answers`                                              |
| `exam_registrations` | `id, exam_id, candidate_id, status, started_at, submitted_at`                                             |
| `exam_answers`       | `id, registration_id, question_id, answer`                                                                |
| `behavioral_logs`    | `id, registration_id, event_type, logged_at`                                                              |

Row-Level Security (RLS) is enabled on all tables; policies are scoped to the authenticated user's role and ownership.

---

## Additional Questions

### MCP (Model Context Protocol) Integration

**Have you worked with any MCP?**

Yes. During this project I used **GitHub Copilot** (via VS Code) which internally leverages an MCP-style tool protocol — Copilot called workspace search, file read, terminal, and edit tools autonomously to scaffold components, generate Zod schemas from the DB types, and fix routing logic, without requiring manual copy-paste of context.

**Idea for explicit MCP use in this project:**

- **Figma MCP** — connect Figma's REST API as an MCP server so the AI can read design tokens (colours, spacing, typography) directly from the assessment platform Figma file and auto-generate matching Tailwind config and shadcn theme variables, keeping code and design in sync.
- **Supabase MCP** — expose the live Supabase schema as an MCP resource so the AI can introspect tables and generate typed query helpers, RLS policies, and migration files without manual copy-paste of the schema.
- **Chrome DevTools MCP** — stream console errors and network requests into the AI context during development so it can diagnose failed API calls or hydration mismatches in real time.

---

### AI Tools for Development

The following tools were used or are recommended to accelerate frontend development:

| Tool                            | How it was used                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **GitHub Copilot (Agent mode)** | End-to-end scaffolding — generated route handlers, Redux slices, Zod schemas, and hooks with full project context awareness |
| **Claude (claude.ai)**          | Architectural decisions, complex debugging (e.g., offline sync strategy), and writing this README                           |
| **ChatGPT**                     | Quick reference for Supabase RLS policy syntax and Tailwind v4 migration notes                                              |

**Recommended workflow:**

1. Use Copilot Agent mode for file creation and multi-file refactors inside the editor.
2. Use Claude for design decisions, code reviews, and anything requiring extended reasoning.
3. Use AI-generated commit messages (`git commit` via Copilot) to keep history descriptive without overhead.

---

### Offline Mode

**How the app handles a candidate losing internet during an exam:**

1. **Service Worker** (`public/sw.js`) pre-caches the exam shell, static assets, and the active exam page on first load — the UI remains visible even with no network.

2. **IndexedDB via idb-keyval** — every answer change triggers a write to IndexedDB inside `useExamSession`. This is synchronous from the user's perspective; the API call is fire-and-forget.

3. **Optimistic UI** — the exam screen never blocks on a network response. Answers appear selected immediately; the loading state is suppressed during offline periods.

4. **Reconnect flush** — `useExamSession` listens for the browser `online` event. On reconnect, it reads the full answer map from IndexedDB and replays any API calls that failed while offline, de-duplicating by `question_id`.

5. **Timer** — `useExamTimer` derives remaining time from `started_at` (stored server-side and cached locally). The countdown continues using `Date.now()` locally, so a network drop does not pause or reset the timer.

6. **Auto-submit** — when the timer reaches zero, submission is attempted immediately. If still offline, the submission is queued in IndexedDB and retried on the next `online` event; the UI shows a "Submitting…" state until confirmed.

This approach ensures a candidate can complete an entire exam offline and have their answers faithfully recorded the moment connectivity is restored.
