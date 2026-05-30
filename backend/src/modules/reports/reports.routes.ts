import { Router } from 'express';
import { reportsController } from './reports.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { checkActivityPermission } from '../../middlewares/activityPermission';
import { checkGroupPermission } from '../../middlewares/groupPermission';

const router = Router();

router.use(checkAuth);

// GET /api/reports/activity/:activityId/student/:studentId/summary (member)
router.get(
  '/activity/:activityId/student/:studentId/summary',
  checkActivityPermission('params', 'member'),
  reportsController.getStudentSummary
);

// GET /api/reports/activity/:activityId/students (member)
router.get(
  '/activity/:activityId/students',
  checkActivityPermission('params', 'member'),
  reportsController.getActivityStudents
);

// GET /api/reports/activity/:activityId/export (member)
router.get(
  '/activity/:activityId/export',
  checkActivityPermission('params', 'member'),
  reportsController.exportActivityStudents
);

// GET /api/reports/group/:groupId/performance (member)
router.get(
  '/group/:groupId/performance',
  checkGroupPermission('member'),
  reportsController.getGroupPerformance
);

export default router;





