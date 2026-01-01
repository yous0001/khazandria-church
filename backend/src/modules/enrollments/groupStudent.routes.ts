import { Router } from 'express';
import { groupStudentController } from './groupStudent.controller';
import { checkAuth } from '../../middlewares/checkAuth';

const router = Router();

router.use(checkAuth);

// POST /api/groups/:groupId/students (member - needs activity permission check in practice)
router.post('/:groupId/students', groupStudentController.enrollStudent);

// GET /api/groups/:groupId/students (member)
router.get('/:groupId/students', groupStudentController.getGroupStudents);

// DELETE /api/groups/:groupId/students/:studentId (member)
router.delete('/:groupId/students/:studentId', groupStudentController.removeStudent);

export default router;

