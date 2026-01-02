import { Router } from 'express';
import { activityController } from './activity.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { requireSuperAdmin } from '../../middlewares/requireRole';
import { checkActivityPermission } from '../../middlewares/activityPermission';

const router = Router();

router.use(checkAuth);

// POST /api/activities (superadmin only)
router.post('/', requireSuperAdmin, activityController.createActivity);

// GET /api/activities (all authenticated)
router.get('/', activityController.getActivities);

// GET /api/activities/:activityId (member or superadmin)
router.get(
  '/:activityId',
  checkActivityPermission('params', 'member'),
  activityController.getActivityById
);

// PATCH /api/activities/:activityId (head or superadmin)
router.patch(
  '/:activityId',
  checkActivityPermission('params', 'head'),
  activityController.updateActivity
);

// PATCH /api/activities/:activityId/head (superadmin only)
router.patch('/:activityId/head', requireSuperAdmin, activityController.updateHeadAdmin);

export default router;




