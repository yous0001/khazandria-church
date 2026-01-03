# Khazandria Church Activities Management System - Backend

Complete backend API for managing church activities, groups, students, sessions, attendance, and grades with role-based access control.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing, helmet, CORS, rate limiting

## Features

- ✅ JWT-based authentication
- ✅ Role-based access control (superadmin, admin with activity memberships)
- ✅ Activities management with configurable grading systems
- ✅ Groups (classes) with label-based filtering
- ✅ Student enrollment (one group per activity constraint)
- ✅ Session attendance tracking with embedded student data
- ✅ Server-authoritative grade calculations
- ✅ Global grades (final exams, projects)
- ✅ Reports (student summary, group performance)
- ✅ Activity-scoped admin permissions (head vs regular admin)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Environment configuration
│   │   └── db.ts               # MongoDB connection
│   ├── middlewares/
│   │   ├── checkAuth.ts        # JWT verification
│   │   ├── requireRole.ts      # Role-based gates
│   │   ├── activityPermission.ts # Activity membership checks
│   │   └── errorHandler.ts    # Centralized error handling
│   ├── utils/
│   │   ├── asyncHandler.ts    # Async route wrapper
│   │   ├── httpError.ts       # Custom error class
│   │   ├── gradeCalc.ts       # Grade calculation logic
│   │   └── objectId.ts        # ObjectId validation
│   ├── modules/
│   │   ├── auth/              # Authentication
│   │   ├── users/             # User management
│   │   ├── activities/        # Activities CRUD
│   │   ├── activityMemberships/ # Admin assignments
│   │   ├── groups/            # Groups/classes
│   │   ├── students/          # Students
│   │   ├── enrollments/       # Group enrollments
│   │   ├── sessions/          # Session & attendance
│   │   ├── globalGrades/      # Final grades
│   │   └── reports/           # Reports & analytics
│   ├── scripts/
│   │   └── seed.ts            # Database seeding
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup Instructions

### Prerequisites

- Node.js >= 16.x
- MongoDB >= 5.x (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository and navigate to backend:**

```bash
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/khazandria_church
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

SEED_SUPERADMIN_EMAIL=superadmin@khazandria.com
SEED_SUPERADMIN_PASSWORD=Admin@12345
```

4. **Seed the database (optional but recommended):**

```bash
npm run seed
```

This creates:
- 1 superadmin account
- 2 admin accounts (head + regular)
- 1 sample activity (مدارس الأحد)
- 2 groups with labels
- 6 students
- Sample sessions with attendance
- Sample global grades

5. **Start development server:**

```bash
npm run dev
```

The server will start on `http://localhost:5000`

6. **Build for production:**

```bash
npm run build
npm start
```

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected routes require:

```
Authorization: Bearer <JWT_TOKEN>
```

### API Endpoints

#### Auth

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/login` | Login with email/phone + password | Public |

**Login Request:**
```json
{
  "emailOrPhone": "superadmin@khazandria.com",
  "password": "Admin@12345"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "Super Admin",
      "role": "superadmin",
      "email": "superadmin@khazandria.com"
    }
  }
}
```

#### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/users` | Create new user | Superadmin |
| GET | `/users` | Get all users | Superadmin |
| GET | `/users/:userId` | Get user by ID | Superadmin |

#### Activities

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/activities` | Create activity | Superadmin |
| GET | `/activities` | Get activities (filtered by membership for admins) | Authenticated |
| GET | `/activities/:activityId` | Get activity details | Member/Superadmin |
| PATCH | `/activities/:activityId` | Update activity | Head/Superadmin |
| PATCH | `/activities/:activityId/head` | Change head admin | Superadmin |

#### Activity Admin Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/activities/:activityId/admins` | Add admin to activity | Head/Superadmin |
| DELETE | `/activities/:activityId/admins/:userId` | Remove admin | Head/Superadmin |
| GET | `/activities/:activityId/admins` | Get activity admins | Member |

#### Groups

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/activities/:activityId/groups` | Create group | Head/Superadmin |
| GET | `/activities/:activityId/groups` | Get groups (with ?label filter) | Member |
| PATCH | `/groups/:groupId` | Update group | Head/Superadmin |

#### Students

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/students` | Create student | Authenticated |
| GET | `/students` | Search students (?search query) | Authenticated |
| GET | `/students/:studentId` | Get student details | Authenticated |

#### Enrollments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/groups/:groupId/students` | Enroll student in group | Member |
| GET | `/groups/:groupId/students` | Get group roster | Member |
| DELETE | `/groups/:groupId/students/:studentId` | Remove student | Member |

#### Sessions

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/groups/:groupId/sessions` | Create session | Member |
| GET | `/groups/:groupId/sessions` | Get group sessions | Member |
| GET | `/sessions/:sessionId` | Get session details | Member |
| PATCH | `/sessions/:sessionId/students/:studentId` | Record attendance/grades | Member |

**Create Session:**
```json
{
  "sessionDate": "2025-01-15T10:00:00Z",
  "initializeStudents": true
}
```

**Update Session Student:**
```json
{
  "present": true,
  "bonusMark": 3,
  "sessionGrades": [
    { "gradeName": "الحضور", "mark": 10, "fullMark": 10 },
    { "gradeName": "المشاركة", "mark": 4, "fullMark": 5 }
  ]
}
```

#### Global Grades

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| PUT | `/activities/:activityId/students/:studentId/global-grades` | Upsert global grades | Member |
| GET | `/activities/:activityId/students/:studentId/global-grades` | Get global grades | Member |

**Upsert Global Grade:**
```json
{
  "grades": [
    { "gradeName": "الامتحان النهائي", "mark": 85, "fullMark": 100 },
    { "gradeName": "المشروع", "mark": 45, "fullMark": 50 }
  ]
}
```

#### Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reports/activity/:activityId/student/:studentId/summary` | Student summary | Member |
| GET | `/reports/group/:groupId/performance` | Group performance | Member |

## Authorization Model

### Global Roles

- **superadmin**: Full unrestricted access to all resources
- **admin**: Access restricted to assigned activities via memberships

### Activity-Level Roles (via ActivityMembership)

- **head**: Can manage admins, create groups, manage all activity resources
- **admin**: Can manage students, sessions, grades, and reports (cannot manage admins or groups)

### Permission Matrix

| Action | Superadmin | Head | Admin |
|--------|-----------|------|-------|
| Create activity | ✅ | ❌ | ❌ |
| Change head admin | ✅ | ❌ | ❌ |
| Add/remove admins | ✅ | ✅ | ❌ |
| Create groups | ✅ | ✅ | ❌ |
| Enroll students | ✅ | ✅ | ✅ |
| Record attendance | ✅ | ✅ | ✅ |
| Record grades | ✅ | ✅ | ✅ |
| View reports | ✅ | ✅ | ✅ |

## Data Model

### Key Collections

- **users**: Authentication + roles
- **activities**: Top-level domain with grading config
- **activity_memberships**: Links admins to activities with role (head/admin)
- **groups**: Classes within activities, with labels for filtering
- **students**: Student records
- **group_students**: Enrollment (1 group per activity per student)
- **sessions**: Session records with embedded student attendance/grades
- **global_grades**: Activity-wide final grades per student

### Grade Calculation Rules

#### Session Marks (Server-Authoritative)

```
if present:
    sessionMark = activity.sessionFullMark
    bonusMark = min(requestedBonus, activity.sessionBonusMax)
else:
    sessionMark = 0
    bonusMark = 0

totalSessionMark = sessionMark + bonusMark
```

#### Final Totals

```
totalGlobalMark = sum(globalGrades.grades.mark)
totalSessionMark = sum(all sessions.students.totalSessionMark)
totalFinalMark = totalGlobalMark + totalSessionMark
```

## Code Conventions

### Naming

- **Models**: PascalCase (e.g., `User`, `Activity`, `ActivityMembership`)
- **Files**: kebab-case for utilities, `feature.type.ts` for modules
- **Variables/Fields**: camelCase (all English identifiers)
- **Routes**: nouns, not verbs (e.g., `/api/activities/:id/groups`)

### Layering

- **Routes**: Define endpoints + middleware chains
- **Controllers**: Handle req/res, no business logic
- **Services**: Contain business logic, DB access, calculations
- **Models**: Mongoose schemas + indexes

### Error Handling

- Use `asyncHandler` wrapper for all async routes
- Throw `HttpError` with appropriate status codes
- Central `errorHandler` middleware formats responses

### Validation

- Validate ObjectId strings before DB queries
- Validate DTOs in controllers
- Use Mongoose schema validation for data integrity

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Run production build
npm run seed         # Seed database with sample data
```

### Testing the API

Use the seed script to create test accounts:

```bash
npm run seed
```

Login credentials will be displayed in the console.

Use tools like:
- Postman
- Thunder Client (VS Code)
- curl
- HTTPie

Example curl request:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"superadmin@khazandria.com","password":"Admin@12345"}'

# Get activities (with token)
curl http://localhost:5000/api/activities \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Deployment

### Environment Variables (Production)

Ensure you set strong values for:

- `JWT_SECRET`: Use a strong random string (32+ characters)
- `MONGODB_URI`: Your production MongoDB connection string
- `BCRYPT_SALT_ROUNDS`: 10 is recommended

### Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Use MongoDB Atlas or secured MongoDB instance
- [ ] Enable MongoDB authentication
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting appropriately
- [ ] Enable HTTPS (reverse proxy like nginx)
- [ ] Set `NODE_ENV=production`
- [ ] Monitor logs and errors
- [ ] Set up database backups

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
mongosh

# Or with connection string
mongosh "mongodb://localhost:27017/khazandria_church"
```

### Port Already in Use

Change `PORT` in `.env` file or:

```bash
PORT=3000 npm run dev
```

### TypeScript Errors

```bash
# Clean build
rm -rf dist/
npm run build
```

## License

ISC

## Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for Khazandria Church**





