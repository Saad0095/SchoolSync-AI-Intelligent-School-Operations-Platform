# School Management System — Frontend (React + Vite)

This repository contains the frontend (React + Vite) for the School Management System project. It is a single-page application built with React and Vite and connects to a Node.js backend API (see Backend link below).

This README explains how to install dependencies and run the development server on Windows (PowerShell). It also includes links to the backend API and useful scripts.

## Backend API

The backend API for this project (Node.js/Express + MongoDB) is available at:

https://github.com/Sheryaar-Ansar/School-Management-API

The backend provides endpoints for authentication, campuses, classes, attendance, exams, marksheets, and AI-powered recommendations.

## Prerequisites

- Node.js v14 or newer (recommended: latest LTS)
- yarn (comes with Node.js)

## Quick start (Windows PowerShell)

Open PowerShell in this project's root directory and run:

```powershell
# Install dependencies
yarn install

# Start development server (Vite)
yarn run dev
```

The Vite dev server typically starts on http://localhost:5173. If the port is in use, Vite will suggest an alternative port.

## Available scripts

- `yarn run dev` — Start Vite dev server with HMR
- `yarn run build` — Build production assets
- `yarn run preview` — Preview the production build locally
- `yarn run lint` — Run ESLint

## Environment

This frontend does not require any specific `.env` variables by default. If you need to point the app to a local backend, set the API base URL in your environment or in the app configuration (where applicable). For example, you might set a variable like `VITE_API_BASE_URL=http://localhost:5000/api` before running the dev server.

To set that in PowerShell for the current session (optional):

```powershell
$env:VITE_API_BASE_URL = "http://localhost:5000/api"
yarn run dev
```

Note: Vite exposes environment variables prefixed with `VITE_` to the client.

## How this was verified

- Read `package.json` scripts (`dev`, `build`, `preview`, `lint`) and verified this is a Vite + React project.
- Use `yarn install` then `yarn run dev` to start the dev server locally.

## Troubleshooting

- If `yarn install` fails, ensure you have a recent Node.js version installed and an internet connection.
- If the dev server won't start because of a port conflict, follow the CLI prompt to accept a different port or stop the process using that port.
- If React fast refresh or linting complains, run `yarn run lint` and follow the messages.

## Contributors

- Frontend: Saad Bin Khalid (this workspace)
- Backend: Sheryaar Ansar — https://github.com/Sheryaar-Ansar/School-Management-API

---

If you want, I can also start the dev server now and report the URL and output.
