import { Router } from 'express';
import { studentController } from './student.controller';
import { checkAuth } from '../../middlewares/checkAuth';

const router = Router();

router.use(checkAuth);

// POST /api/students
router.post('/', studentController.createStudent);

// GET /api/students
router.get('/', studentController.getAllStudents);

// GET /api/students/:studentId
router.get('/:studentId', studentController.getStudentById);

export default router;




