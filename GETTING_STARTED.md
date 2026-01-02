# Khazandria Church Activities Management System
## Complete Getting Started Guide

This system consists of two parts:
1. **Backend** (Node.js + Express + MongoDB)
2. **Frontend** (Next.js + React)

## Quick Start (Both Systems)

### Prerequisites
- Node.js >= 16.x
- MongoDB >= 5.x (running)
- Terminal/Command Prompt

### Step 1: Start MongoDB
Make sure MongoDB is running on `localhost:27017` or configure your own connection string.

### Step 2: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment (optional, has defaults)
# Copy env.example to .env and modify if needed

# Seed database with superadmin
npm run seed

# Start backend server
npm run dev
```

Backend will run on **http://localhost:5000**

### Step 3: Setup Frontend

```bash
# Open a new terminal
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
# Copy env.example to .env.local
cp env.example .env.local

# Edit .env.local to set:
# INTERNAL_API_BASE_URL=http://localhost:5000/api

# Start frontend server
npm run dev
```

Frontend will run on **http://localhost:3000**

### Step 4: Login

1. Open browser to **http://localhost:3000**
2. Login with seed credentials:
   - **Email:** `superadmin@khazandria.com`
   - **Password:** `Admin@12345`

## 🎨 Add Your Church Logo

1. Save your church logo image as `frontend/public/logo.png`
2. Recommended size: 512x512px
3. The logo will automatically appear in the app

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│              (http://localhost:3000)            │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │      Next.js Frontend (Arabic/RTL)      │    │
│  │  - Login                                 │    │
│  │  - Activities Management                 │    │
│  │  - Groups & Students                     │    │
│  │  - Sessions & Attendance                 │    │
│  │  - Reports                               │    │
│  └────────────────────────────────────────┘    │
│                      ↓                           │
│  ┌────────────────────────────────────────┐    │
│  │    Next.js API Routes (Proxy)           │    │
│  │    - Secure httpOnly cookies            │    │
│  └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│       Express Backend API                        │
│       (http://localhost:5000/api)               │
│                                                  │
│  - JWT Authentication                            │
│  - Role-based Access Control                     │
│  - Activities, Groups, Students CRUD             │
│  - Session Attendance & Grades                   │
│  - Reports & Analytics                           │
│                                                  │
│              ↓                                   │
│  ┌────────────────────┐                         │
│  │   MongoDB Database  │                         │
│  │   (localhost:27017) │                         │
│  └────────────────────┘                         │
└─────────────────────────────────────────────────┘
```

## Features Overview

### ✅ Backend Features
- User authentication with JWT
- Role-based permissions (superadmin, admin)
- Activity management with configurable grading
- Groups with label-based filtering
- Student enrollment (one group per activity)
- Session attendance tracking
- Automatic grade calculations
- Global grades (exams, projects)
- Performance reports
- Activity admin management

### ✅ Frontend Features
- Mobile-first responsive design
- Arabic RTL interface
- Secure cookie-based authentication
- Activities list and navigation
- Groups with label filters
- Student roster management
- Session attendance recording
- Real-time grade calculations
- Bottom mobile navigation
- Blue & white theme (matches logo)

## User Roles

### Superadmin
- Full system access
- Create activities
- Assign head admins
- Manage all resources

### Admin (Head)
- Manage activity admins
- Create groups
- Manage students, sessions, grades
- Generate reports

### Admin (Regular)
- Manage students within their activity
- Record attendance and grades
- View reports

## Common Tasks

### Create a New Activity
1. Login as superadmin
2. Navigate to Activities
3. Click "نشاط جديد" (New Activity)
4. Fill in activity details
5. Set session and global grade types

### Add Students to a Group
1. Navigate to Activities → Select Activity → Groups
2. Select a group
3. Go to "الطلاب" (Students) tab
4. Click "إضافة طالب" (Add Student)

### Record Attendance
1. Navigate to Groups → Select Group
2. Go to "الجلسات" (Sessions) tab
3. Create or select a session
4. Toggle attendance switches
5. Add bonus marks
6. Changes save automatically

## API Documentation

Full API documentation available in:
- `backend/README.md` - Complete API reference
- Backend runs at: `http://localhost:5000/api`

Example endpoints:
- POST `/api/auth/login` - Login
- GET `/api/activities` - List activities
- GET `/api/activities/:id/groups` - Get groups
- POST `/api/groups/:id/sessions` - Create session
- PATCH `/api/sessions/:id/students/:studentId` - Record attendance

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/khazandria_church
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

### Frontend (.env.local)
```env
INTERNAL_API_BASE_URL=http://localhost:5000/api
```

## Troubleshooting

### Backend won't start
- Check if MongoDB is running: `mongosh`
- Check if port 5000 is available
- Verify `MONGODB_URI` in backend/.env

### Frontend won't connect to backend
- Ensure backend is running on port 5000
- Check `INTERNAL_API_BASE_URL` in frontend/.env.local
- Clear browser cookies and try again

### Can't login
- Make sure you ran `npm run seed` in backend
- Use correct credentials (check seed output)
- Check browser console for errors

### Logo not showing
- Save logo as `frontend/public/logo.png`
- Refresh the page (Ctrl+F5)
- Check file format (PNG/JPG supported)

## Development

### Backend
```bash
cd backend
npm run dev      # Start with hot reload
npm run seed     # Reset database with seed data
npm run build    # Build for production
```

### Frontend
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production build
```

## Production Deployment

### Backend
- Use environment variables for all secrets
- Set `NODE_ENV=production`
- Use a production MongoDB instance
- Enable HTTPS
- Set up reverse proxy (nginx)

### Frontend
- Deploy to Vercel or similar platform
- Set environment variables in platform
- Configure domain and SSL
- Update `INTERNAL_API_BASE_URL` to production backend URL

## Support

For issues or questions:
1. Check this guide
2. Review individual README files (backend/README.md, frontend/README.md)
3. Check the implementation summary (frontend/IMPLEMENTATION_SUMMARY.md)

## License

ISC

---

**Built for Khazandria Church**  
الكنيسة الكاثوليكية للأقباط الكاثوليك بالإسكندرية

