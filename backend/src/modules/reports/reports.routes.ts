import { Router } from 'express';
import { reportsController } from './reports.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { checkActivityPermission } from '../../middlewares/activityPermission';

const router = Router();

router.use(checkAuth);

// GET /api/reports/activity/:activityId/student/:studentId/summary (member)
router.get(
  '/activity/:activityId/student/:studentId/summary',
  checkActivityPermission('params', 'member'),
  reportsController.getStudentSummary
);

// GET /api/reports/group/:groupId/performance (member - needs activity permission in practice)
router.get('/group/:groupId/performance', reportsController.getGroupPerformance);

export default router;





