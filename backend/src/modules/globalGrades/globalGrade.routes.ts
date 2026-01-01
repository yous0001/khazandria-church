import { Router } from 'express';
import { globalGradeController } from './globalGrade.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { checkActivityPermission } from '../../middlewares/activityPermission';

const router = Router();

router.use(checkAuth);

// PUT /api/activities/:activityId/students/:studentId/global-grades (member)
router.put(
  '/:activityId/students/:studentId/global-grades',
  checkActivityPermission('params', 'member'),
  globalGradeController.upsertGlobalGrade
);

// GET /api/activities/:activityId/students/:studentId/global-grades (member)
router.get(
  '/:activityId/students/:studentId/global-grades',
  checkActivityPermission('params', 'member'),
  globalGradeController.getGlobalGrade
);

export default router;

