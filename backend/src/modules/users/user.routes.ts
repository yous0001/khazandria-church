import { Router } from 'express';
import { userController } from './user.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { requireSuperAdmin } from '../../middlewares/requireRole';

const router = Router();

// Routes for current user (requires auth only)
router.get('/me', checkAuth, userController.getCurrentUser);
router.patch('/me/password', checkAuth, userController.updateOwnPassword);

// All other user routes require superadmin
router.use(checkAuth);
router.use(requireSuperAdmin);

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUserById);
router.patch('/:userId/password', userController.updatePassword);
router.delete('/:userId', userController.deleteUser);
router.get('/:userId/activities', userController.getUserActivityMemberships);
router.post('/:userId/activities', userController.addActivityPermission);
router.delete('/:userId/activities/:activityId', userController.removeActivityPermission);

export default router;


