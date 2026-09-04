<div align="center">

<img src="assets/logo.png" alt="SchoolSync Logo" width="140" />

# SchoolSync

**AI-Powered Multi-Campus School Management System**

[Live Demo](https://schoolsync-dashboard.devphic.com) · [API Docs (Postman)](backend/postman_collection/) · [Getting Started](#-getting-started)

</div>

---

## Overview

SchoolSync is a full-stack school management platform built for multi-campus schools. It replaces fragmented tools — Excel sheets, paper registers, WhatsApp groups — with one unified, intelligent system.

What makes SchoolSync different: **AI is woven into the daily workflow**, not bolted on. Teachers get auto-generated marksheet remarks, admins get AI-drafted parent communications, and reports write themselves.

## AI Features

| Feature | Description |
| --- | --- |
| **Automated Marksheet Remarks** | LLMs analyze each student's scores across all subjects and generate personalized, encouraging teacher comments — eliminating hours of manual writing per term |
| **AI Communications Hub** | AI drafts professional parent messages — attendance warnings, performance alerts, fee reminders — with context-aware tone |
| **Smart Report Generation** | AI summarizes campus-wide academic and attendance trends, producing actionable reports for administrators |
| **Dual-LLM Architecture** | Groq as the primary engine for speed, with automatic Gemini failover for reliability |

## Core Modules

- **Multi-Campus Management** — Super Admin oversees all branches; each Campus Admin manages their own teachers, classes, and students
- **Academic Management** — Classes, sections, subjects, teacher assignments, and student enrollment per academic session
- **Exams & Marksheets** — Multiple exam types (Examinations, Assessments, Classwork, Homework) with auto-generated marksheets and PDF export
- **Attendance** — Student attendance (Present / Absent / Leave / Late) plus teacher check-in/check-out, with monthly email reports
- **Fee Management** — Fee structures, bulk voucher generation, payment recording, automatic overdue detection, and collection analytics
- **Role-Based Dashboards** — Tailored analytics for admins, teachers, and students with real-time charts
- **Real-Time Notifications** — Socket.IO-powered instant updates

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui, Recharts, React Router v6 |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose ODM, JWT Auth, Socket.IO, Node-cron |
| **AI** | Groq LLM (primary), Google Gemini (fallback) |
| **Services** | Nodemailer (email reports), PDFKit (marksheet PDFs) |

## Project Structure

```
SchoolSync/
├── backend/                 # Express.js REST API
│   ├── controllers/         # Business logic (14 controllers)
│   ├── models/              # Mongoose schemas (14 models)
│   ├── routes/              # API route definitions
│   ├── services/            # AI (Groq/Gemini), email, PDF services
│   ├── middlewares/         # Auth & error handling
│   ├── validators/          # Joi input validators
│   ├── seed/                # Database seeding script
│   └── postman_collection/  # Complete API documentation
└── frontend/                # React SPA
    └── src/
        ├── pages/           # Feature pages (14 modules)
        ├── components/      # UI components (class, layout, shared)
        ├── services/        # API service layer
        ├── context/         # Auth context
        └── routes/          # Protected route guards
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local instance or Atlas cluster)
- A Groq API key (for AI features) — free at [console.groq.com](https://console.groq.com)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # Windows: copy .env.example .env
# Fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY (see .env.example)
npm run dev
```

The API starts on `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # Windows: copy .env.example .env
npm run dev
```

The app starts on `http://localhost:5173`.

### 3. Seed Demo Data (optional)
Populates the database with 2 campuses, 12 teachers, ~100 students, classes, exams, scores, attendance, and marksheets:

```bash
cd backend
node seed/full-seed.js
```

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Campus Admin | `north.admin@school.com` | `admin123` |
| Teacher | `south-001_teacher6@school.com` | `teacher123` |
| Student | `student_e8af_1@school.com` | `student123` |

> A Super Admin account also exists but is not published for security reasons.

## API Documentation

A complete Postman collection covering every endpoint is included at [`backend/postman_collection/`](backend/postman_collection/).

---

<div align="center">

**[Live Demo](https://schoolsync-dashboard.devphic.com)**

</div>
