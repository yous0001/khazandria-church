import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import activityRoutes from './modules/activities/activity.routes';
import activityMembershipRoutes from './modules/activityMemberships/activityMembership.routes';
import groupRoutes from './modules/groups/group.routes';
import studentRoutes from './modules/students/student.routes';
import enrollmentRoutes from './modules/enrollments/groupStudent.routes';
import sessionRoutes from './modules/sessions/session.routes';
import globalGradeRoutes from './modules/globalGrades/globalGrade.routes';
import reportsRoutes from './modules/reports/reports.routes';

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activities', activityMembershipRoutes);
app.use('/api/activities', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/groups', enrollmentRoutes);
app.use('/api/groups', sessionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/activities', globalGradeRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;

