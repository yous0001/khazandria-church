import { Router } from 'express';
import { userController } from './user.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { requireSuperAdmin } from '../../middlewares/requireRole';

const router = Router();

// All user routes require superadmin
router.use(checkAuth);
router.use(requireSuperAdmin);

// POST /api/users
router.post('/', userController.createUser);

// GET /api/users
router.get('/', userController.getAllUsers);

// GET /api/users/:userId
router.get('/:userId', userController.getUserById);

export default router;

