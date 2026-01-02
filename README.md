# Khazandria Church Activities Management Platform

Complete system for managing church activities, groups, students, sessions, attendance, and grades.

## Project Description

Khazandria Church Activities Management Platform is a backend-first system designed to help the church **organize activities** (e.g., Sunday School, Choir, Meetings), **manage groups/classes** inside each activity, **register students**, and **track weekly sessions** with **attendance and grades**.

### What it does

- **Activities**: Create activities with a configurable grading system (session marks, bonus marks, and global grades like final exams).
- **Groups**: Create groups inside activities and tag them with labels for filtering (labels can be Arabic or English).
- **Students & Enrollment**: Create student records and enroll each student into **one group per activity**.
- **Sessions**: Create sessions per group and record attendance and per-student marks (stored directly inside the session for fast reporting).
- **Totals & Reports**: Calculate totals per student per activity and generate reports (student summary and group performance).

### Roles & permissions

- **superadmin**: full access to the entire system (including creating activities and assigning activity heads).
- **admin**: access is restricted per activity using memberships:
  - **head**: can manage activity admins and groups (plus everything else).
  - **admin**: can manage students, sessions, grades, and reports (but cannot manage admins or create groups).

### Localization

- **Arabic UI/content**: activity names, group names, labels, and grade names can be Arabic.
- **English backend identifiers**: code, schemas, and API routes use English naming for maintainability.

## Project Structure

```
khazandria-church/
├── backend/          # Express.js + TypeScript + MongoDB backend
└── frontend/         # (Planned: Next.js)
```

## Backend

The backend is a complete RESTful API with:

- JWT authentication
- Role-based access control (superadmin, admin with activity-scoped permissions)
- Activities, groups, students, sessions, and grades management
- Reports and analytics

See [backend/README.md](backend/README.md) for detailed documentation.

## Quick Start

### Prerequisites

- Node.js >= 16.x
- MongoDB >= 5.x

### Setup Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

The backend will be available at `http://localhost:5000`

### Default Login Credentials (after seed)

- **Superadmin**: `superadmin@khazandria.com` / `Admin@12345`
- **Head Admin**: `head@khazandria.com` / `HeadAdmin@123`
- **Regular Admin**: `admin@khazandria.com` / `Admin@123`

## API Documentation

Full API documentation available in [backend/README.md](backend/README.md)

Base URL: `http://localhost:5000/api`

## Features

✅ **User Management**

- Superadmin and admin roles
- JWT authentication

✅ **Activity Management**

- Create activities with configurable grading systems
- Assign head admin and team admins per activity

✅ **Groups (Classes)**

- Organize students into groups
- Label-based filtering

✅ **Student Enrollment**

- One group per activity constraint
- Track student information

✅ **Session & Attendance**

- Record session attendance
- Automatic grade calculations
- Bonus marks support

✅ **Grading System**

- Session-level grades (attendance + bonus)
- Global grades (exams, projects)
- Automatic total calculations

✅ **Reports**

- Student performance summary
- Group performance analytics

✅ **Permissions**

- Activity-scoped access control
- Head admin vs regular admin roles

## Technology Stack

### Backend

- Node.js + Express.js
- TypeScript
- MongoDB + Mongoose
- JWT authentication
- bcrypt for password hashing

### Frontend (Planned)

- Next.js
- TypeScript
- Arabic UI

## Development

### Backend Development

```bash
cd backend
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run seed         # Seed database
```

## License

ISC

---

**Built for Khazandria Church**
