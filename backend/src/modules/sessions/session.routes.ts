import { Router } from 'express';
import { sessionController } from './session.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { requireSuperAdmin } from '../../middlewares/requireRole';

const router = Router();

router.use(checkAuth);

// POST /api/groups/:groupId/sessions (member)
router.post('/:groupId/sessions', sessionController.createSession);

// GET /api/groups/:groupId/sessions (member)
router.get('/:groupId/sessions', sessionController.getSessionsByGroup);

// GET /api/sessions/:sessionId (member)
router.get('/:sessionId', sessionController.getSessionById);

// PATCH /api/sessions/:sessionId/students/:studentId (member)
router.patch('/:sessionId/students/:studentId', sessionController.updateSessionStudent);

// DELETE /api/sessions/:sessionId (superadmin only)
router.delete('/:sessionId', requireSuperAdmin, sessionController.deleteSession);

export default router;




