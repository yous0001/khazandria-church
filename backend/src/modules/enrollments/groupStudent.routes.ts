import { Router } from 'express';
import { groupStudentController } from './groupStudent.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import { checkGroupPermission } from '../../middlewares/groupPermission';

const router = Router();

router.use(checkAuth);

// POST /api/groups/:groupId/students (member)
router.post(
  '/:groupId/students',
  checkGroupPermission('member'),
  groupStudentController.enrollStudent
);

// POST /api/groups/:groupId/students/bulk (member)
router.post(
  '/:groupId/students/bulk',
  checkGroupPermission('member'),
  groupStudentController.enrollStudentsBulk
);

// GET /api/groups/:groupId/students (member)
router.get(
  '/:groupId/students',
  checkGroupPermission('member'),
  groupStudentController.getGroupStudents
);

// POST /api/groups/:groupId/students/:studentId/transfer (head)
router.post(
  '/:groupId/students/:studentId/transfer',
  checkGroupPermission('head'),
  groupStudentController.transferStudent
);

// DELETE /api/groups/:groupId/students/:studentId (member)
router.delete(
  '/:groupId/students/:studentId',
  checkGroupPermission('member'),
  groupStudentController.removeStudent
);

export default router;
