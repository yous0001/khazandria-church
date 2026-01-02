import { Router } from 'express';
import { userController } from './user.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { requireSuperAdmin } from '../../middlewares/requireRole';

const router = Router();

// Route for users to update their own password (requires auth only)
router.patch('/me/password', checkAuth, userController.updateOwnPassword);

// All other user routes require superadmin
router.use(checkAuth);
router.use(requireSuperAdmin);

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUserById);
router.patch('/:userId/password', userController.updatePassword);

export default router;


