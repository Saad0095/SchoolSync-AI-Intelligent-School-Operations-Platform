# 🏫 School Management System API

A modern, scalable backend API built with Node.js for managing educational institutions. Features multi-campus support, role-based authentication, complete academic workflow management, and comprehensive reporting capabilities.

![GitHub last commit](https://img.shields.io/github/last-commit/Sheryaar-Ansar/School-Management-API)
![GitHub issues](https://img.shields.io/github/issues/Sheryaar-Ansar/School-Management-API)
![GitHub license](https://img.shields.io/github/license/Sheryaar-Ansar/School-Management-API)

## 📋 Project Overview

This School Management System is a comprehensive Node.js/Express backend solution designed for modern educational institutions. At its core, it implements a multi-tenant architecture supporting multiple campuses, each with its own administrators, teachers, and students. The system handles the complete academic lifecycle, from student enrollment and class management to examination scheduling and result processing.

The application is built with a strong emphasis on security, featuring JWT-based authentication with role-specific access control (Super Admin, Campus Admin, Teacher, Student). It includes sophisticated modules for attendance tracking (both students and teachers), comprehensive examination management, and automated marksheet generation with PDF export capabilities. The system also leverages AI through OpenRouter integration for generating personalized study recommendations based on student performance.

Key technical features include automated report generation through cron jobs, email notifications via Nodemailer (Gmail SMTP), and extensive data export options in both PDF and CSV formats. The system employs MongoDB with Mongoose ODM for flexible data modeling, implements thorough request validation using Joi, and includes comprehensive error handling and logging mechanisms. Notable features include bulk operations for marksheet generation with ZIP support, configurable dashboard analytics, and a well-structured API supporting future scaling to mobile applications and frontend integrations.

## 🎯 Key Features

- 👥 **Multi-Role System**: Super Admin, Campus Admin, Teacher, Student access levels
- 🏫 **Multi-Campus Support**: Manage multiple school branches efficiently
- 📚 **Academic Management**: Classes, subjects, exams, and marksheets
- ✅ **Attendance Tracking**: For both students and teachers
- 📊 **Advanced Reporting**: PDF marksheets, CSV exports, attendance reports
- 🤖 **AI Integration**: Smart study recommendations via OpenRouter API
- ⚡ **Real-time Updates**: Automated notifications and reports
- 🔒 **Secure Authentication**: JWT-based with role-specific access

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- Gmail account (for email services)

### Installation

1. Clone the repository
```bash
git clone https://github.com/Sheryaar-Ansar/School-Management-API.git
cd School-Management-API
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/school-management
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
OPENROUTER_API_KEY=your-openrouter-api-key  # For AI features
```

4. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 📁 Project Structure

```
school-management-api/
├── config/               # Configuration files
│   └── openrouter.js    # AI integration config
├── controllers/         # Route controllers
│   ├── aiController.js
│   ├── authController.js
│   ├── campusController.js
│   ├── classController.js
│   ├── enrollmentController.js
│   ├── examController.js
│   ├── marksheetController.js
│   ├── scoreController.js
│   ├── studentAttendanceController.js
│   └── teacherAttendanceController.js
├── models/             # Database schemas
│   ├── Assignment.js
│   ├── Campus.js
│   ├── Class.js
│   ├── Exam.js
│   ├── Marksheet.js
│   ├── Score.js
│   ├── StudentAttendance.js
│   ├── StudentEnrollment.js
│   ├── Subject.js
│   ├── TeacherAssignment.js
│   ├── TeacherAttendance.js
│   └── User.js
├── routes/             # API routes
│   ├── aiRoutes.js
│   ├── authRoutes.js
│   ├── campusRoutes.js
│   ├── classRoutes.js
│   ├── enrollmentRoutes.js
│   ├── examRoutes.js
│   ├── marksheetRoute.js
│   ├── scoreRoutes.js
│   └── teacherAttendanceRoutes.js
├── middlewares/        # Custom middlewares
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   └── validate.js
├── validators/         # Request validation
│   ├── authValidator.js
│   ├── campusValidator.js
│   ├── classValidator.js
│   ├── examValidator.js
│   └── scoreValidator.js
├── utils/             # Helper utilities
│   ├── logger.js
│   └── nodemailer.js
├── cronJobs/          # Automated tasks
│   └── cronJobs.js
├── services/          # Business services
│   └── reportService.js
├── uploads/           # File storage
├── index.js          # Application entry point
└── package.json     # Project dependencies
```

---

## 🧠 Core Controllers Overview

### 🔑 Auth Controller
Handles:
- `register` — Register a new user (Super Admin, Campus Admin, Teacher, Student)
- `login` — Authenticate and issue JWT
- `getMe` — Get currently logged-in user
- `forgotPassword` — Send reset link via Gmail
- `resetPassword` — Reset password via token
- `updateUser`, `deleteUser`, `getUserById`, `getAllUsers` — Admin-level user management

---

### 📘 Marksheet Controller
Handles:
- `getStudentMarksheet` — Fetch marksheets by filters (role-based)
- Supports query filters: `studentId`, `classId`, `campusId`, `term`, `academicSession`
- Generates **individual PDF** per student
- Zips multiple PDFs into a single downloadable archive when `?downloadZIP=true`

---

### 🏫 Campus Controller
Handles:
- Create and manage campuses
- Assign and manage campus-admin users
- Ensure each campus has its respective admin and classes

---

### 🧑‍🏫 Class Controller
Handles:
- Create and manage classes (grade, section)
- Assign class teacher
- Manage class-student relationships

---

### 📚 Attendance Controller
Handles:
- Record attendance per class and date
- Supports multiple statuses (`present`, `absent`, `late`, etc.)
- Allows teachers or admins to view and export attendance

---

### 🧾 Subject Controller
Handles:
- Manage subject list per class/campus
- Associate with marksheets and grading system

---

### 📊 Dashboard Controller
Handles:
- `getCampusComparison` — Compare performance metrics across all campuses (Super Admin only)
- `getOverviewStats` — Comprehensive overview statistics including total counts, attendance rates, and performance metrics
- `getTopPerformers` — Retrieve top-performing students based on scores and academic achievements
- `getDropRatio` — Analyze student dropout rates, retention trends, and comparison with previous periods

**Role-based Access:**
- **Super Admin:** Full access to all dashboard endpoints including cross-campus comparisons
- **Campus Admin:** Access to overview, top performers, and drop ratio for their assigned campus only

---

## 🧩 Middlewares

| Middleware | Purpose |
|-------------|----------|
| **authMiddleware.js** | Verifies JWT and attaches user object (`req.user`) |
| **roleMiddleware.js** | Restricts access based on role |
| **validationMiddleware.js** | Runs Joi validation on incoming data |
| **loggingMiddleware.js** | Logs every request (method, path, status, duration) |
| **errorMiddleware.js** | Handles uncaught errors gracefully |

---

## ✅ Validators (Joi)

Validators ensure data integrity across all API inputs.

| Validator | Purpose |
|------------|----------|
| **authValidator.js** | Validate `register`, `login`, `forgotPassword`, and `resetPassword` payloads |
| **marksheetValidator.js** | Validate marksheet creation — requires valid student, class, and subjects array |
| **userValidator.js** | Validate user CRUD operations |
| **classValidator.js** | Validate class creation & update |
| **campusValidator.js** | Validate campus details |

---

## 📦 Main Dependencies

| Package | Description |
|----------|-------------|
| **express** | Web framework for Node.js |
| **mongoose** | MongoDB object modeling |
| **jsonwebtoken** | Authentication via JWT |
| **bcryptjs** | Password hashing |
| **joi** | Schema validation |
| **nodemailer** | Email sending for password reset |
| **json2csv** | Convert JSON data to CSV |
| **pdfkit / reportlab** | PDF generation for marksheets |
| **archiver** | Create ZIP files for multiple student PDFs |
| **dotenv** | Environment variable management |
| **morgan** | HTTP request logging (optional) |

---

## ⚙️ Environment Variables

Create a `.env` file in the root with:

```env
PORT=5000
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail@example.com
EMAIL_PASS=your_gmail_app_password
OPENROUTER_API_KEY=your_openrouter_key
```

---

## 🛣️ API Routes

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Authenticate user
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
GET    /api/auth/me                # Get current user
```

### Campus Management
```
POST   /api/campus                 # Create new campus
GET    /api/campus                 # List all campuses
GET    /api/campus/:id             # Get campus details
PUT    /api/campus/:id             # Update campus
DELETE /api/campus/:id             # Remove campus
```

### Academic Management
```
POST   /api/class                  # Create class
GET    /api/class                  # List classes
PUT    /api/class/:id             # Update class
DELETE /api/class/:id             # Delete class

POST   /api/subject               # Add subject
GET    /api/subject              # List subjects
PUT    /api/subject/:id          # Update subject
DELETE /api/subject/:id          # Remove subject
```

### Enrollment & Assignments
```
POST   /api/enrollment            # Enroll student
GET    /api/enrollment           # List enrollments
PUT    /api/enrollment/:id       # Update enrollment
DELETE /api/enrollment/:id       # Cancel enrollment

POST   /api/assignment           # Create assignment
GET    /api/assignment          # List assignments
PUT    /api/assignment/:id      # Update assignment
DELETE /api/assignment/:id      # Remove assignment
```

### Attendance Management
```
POST   /api/student-attendance    # Mark student attendance
GET    /api/student-attendance   # Get student attendance
POST   /api/teacher-attendance   # Mark teacher attendance
GET    /api/teacher-attendance  # Get teacher attendance
```

### Examination System
```
POST   /api/exam                 # Schedule exam
GET    /api/exam                # List exams
PUT    /api/exam/:id            # Update exam
DELETE /api/exam/:id            # Cancel exam

POST   /api/score               # Record scores
GET    /api/score              # Get scores
PUT    /api/score/:id          # Update scores

GET    /api/marksheet          # Generate marksheet
GET    /api/marksheet/download # Download marksheet (PDF/ZIP)
```

### AI Features
```
POST   /api/ai/recommend        # Get AI study recommendations
POST   /api/ai/analyze         # Analyze performance
```

### Dashboard & Reports
```
GET    /api/dashboard/stats    # Get dashboard statistics
GET    /api/dashboard/reports  # Generate custom reports

---

## 💌 Password Reset Flow (Gmail)

1. **POST `/api/auth/forgot-password`**  
   Body: `{ "email": "user@example.com" }`  
   → Sends an email with reset link to Gmail.

2. **Email Content Example:**  
   ```
   Click below to reset your password:
   http://localhost:3000/api/auth/reset-password/<resetToken>
   ```

3. **POST `/api/auth/reset-password/:token`**  
   Body: `{ "newPassword": "NewSecure123" }`  
   → Verifies token, updates password, invalidates token.

---

## ⚙️ Run Locally

```bash
# Clone the repo
git clone https://github.com/Sheryaar-Ansar/School-Management-API.git
cd School-Management-API

# Install dependencies
npm install

# Start server
npm run dev
```

---

## 🛠️ Core Technologies

### Backend Framework
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB

### Security & Authentication
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Joi** - Input validation

### Features & Utilities
- **Nodemailer** - Email service integration
- **node-cron** - Scheduled tasks
- **OpenRouter API** - AI integration
- **PDFKit** - PDF generation
- **Archiver** - ZIP file creation
- **json2csv** - Data exports

### Development Tools
- **dotenv** - Environment management
- **morgan** - HTTP request logging
- **winston** - Application logging

## 🔄 Current Development Status

### ✅ Implemented Features
- Complete authentication system with JWT
- Multi-campus management
- Student & teacher attendance tracking
- Examination and marksheet system
- AI-powered study recommendations
- Automated report generation
- Email notifications
- PDF/CSV exports

### 🚧 In Development
- Real-time notifications
- Advanced analytics dashboard
- Parent portal access
- Mobile app API endpoints
- Batch processing improvements

### 📋 Future Roadmap
1. GraphQL API support
2. WebSocket integration
3. Payment gateway integration
4. Learning management system
5. Resource scheduling system
6. Advanced AI features

This project already includes many of the building blocks listed below. The sections summarize what's implemented and what you can enable or extend easily.

- **Node-cron (scheduled jobs)**
   - Purpose: automate monthly attendance report generation and weekly low-attendance checks.
   - Location: `cronJobs/cronJobs.js` calls `services/reportService.js`.
   - Notes: Cron schedule runs in server process — in production use a dedicated worker or external scheduler for reliability.

- **Attendance reports & low-attendance checks**
   - Purpose: Aggregation pipelines compute per-student attendance percentages and optionally email students when below threshold.
   - Location: `services/reportService.js`, `utils/nodemailer.js` (email templates), and a manual trigger route can be added for on-demand generation.

- **AI study recommendations (OpenRouter integration)**
   - Purpose: Generate short, personalized study recommendations using the OpenRouter API (model prompts tuned in code).
   - Location: `controllers/aiController.js`, `models/Score.js` (marksheet AI remarks), and `routes/aiRoutes.js`.
   - Notes: Requires `OPENROUTER_API_KEY` in environment variables.

- **json2csv (CSV export)**
   - Purpose: Convert user and report JSON data into CSV for admins/downloads.
   - Location: Implemented in `controllers/authController.js` (CSV export example for users).

- **Nodemailer (email sending)**
   - Purpose: Send password reset links and attendance reports via Gmail SMTP or other providers.
   - Location: `utils/nodemailer.js` and usages in `controllers/authController.js` and reporting services.
   - Notes: Requires SMTP credentials in `.env` (SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS).

- **Password reset flow & archiver for attachments**
   - Purpose: Password reset via time-limited JWT tokens. Archiver used to create ZIPs of marksheets for batch download.
   - Location: `controllers/authController.js` (forgot/reset password), `controllers/marksheetController.js` (PDF & ZIP export using `pdfkit` + `archiver`).

- **Bcryptjs + JWT**
   - Purpose: Password hashing and session/token management.
   - Location: `models/User.js` (pre-save hashing using `bcryptjs`), `controllers/authController.js` (login/jwt issuance).

- **CRUD for campuses, classes, users, enrollments, assignments, exams, scores, attendance**
   - Purpose: Full management endpoints for all core entities.
   - Location: See `controllers/` and `routes/` folders — most controllers and routes are scaffolded (auth, campus, class, enrollment, exam, score, attendance). Use standard RESTful patterns and validation middlewares already in place.

- **Aggregation analytics & dashboard data**
   - Purpose: Provide aggregate metrics for dashboards (attendance rates, top/bottom students, average scores per class, pass/fail statistics).
   - Location: `services/reportService.js` contains example aggregation queries; you can extend them into dedicated dashboard endpoints. Dashboard-specific analytics are implemented in `controllers/dashboardController.js` with the following endpoints:
     - `getCampusComparison` — Cross-campus performance metrics (Super Admin only)
     - `getOverviewStats` — Comprehensive statistics including student counts, attendance rates, and performance averages
     - `getTopPerformers` — List of highest-performing students with filtering options
     - `getDropRatio` — Student retention and dropout analysis with trend comparisons

- **Pagination & filtering**
   - Purpose: Use query parameters for pagination and filtering across list endpoints (e.g., `?page=1&limit=20&role=teacher`).
   - Location: Implemented in several controllers (for example `controllers/authController.js` for users). Apply the same pattern to other list endpoints.

- **PDFKit for marksheets**
   - Purpose: Generate printable PDF marksheets per student and zip multiple marksheets for download.
   - Location: `controllers/marksheetController.js` (uses `pdfkit` and `archiver`).

- **OpenRouter AI integration for study recommendations**
   - Purpose: Short AI-generated study recommendations are created from student scores and included in marksheets or returned by endpoints.
   - Location: `config/openrouter.js`, `controllers/aiController.js`, and `models/Score.js` (AI remark generation during marksheet creation).

## � Contributors

### Lead Developers
- **Sheryaar Ansar** - [GitHub](https://github.com/Sheryaar-Ansar)
- **Saad Bin Khalid** - [GitHub](https://github.com/Saad0095)

## 📄 License

This project is licensed under the MIT License.

---

> "Empowering education through technology, one school at a time."
