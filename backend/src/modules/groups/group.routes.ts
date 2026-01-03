import { Router } from 'express';
import { groupController } from './group.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { checkActivityPermission } from '../../middlewares/activityPermission';
import { checkGroupPermission } from '../../middlewares/groupPermission';

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

// Router for direct group routes (registered separately under /api/groups)
export const groupRouter = Router();
groupRouter.use(checkAuth);

// GET /api/groups/:groupId (member - check activity permission via group)
groupRouter.get('/:groupId', checkGroupPermission('member'), groupController.getGroupById);

// PATCH /api/groups/:groupId (head or superadmin)
groupRouter.patch('/:groupId', checkGroupPermission('head'), groupController.updateGroup);

export default router;





