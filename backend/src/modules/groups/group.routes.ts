import { Router } from 'express';
import { groupController } from './group.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { checkActivityPermission } from '../../middlewares/activityPermission';

const router = Router();

router.use(checkAuth);

// POST /api/activities/:activityId/groups (head or superadmin)
router.post(
  '/:activityId/groups',
  checkActivityPermission('params', 'head'),
  groupController.createGroup
);

// GET /api/activities/:activityId/groups (member)
router.get(
  '/:activityId/groups',
  checkActivityPermission('params', 'member'),
  groupController.getGroupsByActivity
);

// PATCH /api/groups/:groupId (head or superadmin)
// Note: We need a separate middleware to check group's activity
router.patch('/:groupId', groupController.updateGroup);

export default router;





