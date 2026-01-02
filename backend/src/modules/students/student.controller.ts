import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { studentService } from './student.service';
import { HttpError } from '../../utils/httpError';

export class StudentController {
  createStudent = asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, email } = req.body;

    if (!name) {
      throw new HttpError(400, 'Student name is required');
    }

    const student = await studentService.createStudent({ name, phone, email });

    res.status(201).json({
      success: true,
      data: student,
    });
  });

  getAllStudents = asyncHandler(async (req: Request, res: Response) => {
    const searchTerm = req.query.search as string | undefined;

    const students = await studentService.getAllStudents(searchTerm);

    res.json({
      success: true,
      data: students,
    });
  });

  getStudentById = asyncHandler(async (req: Request, res: Response) => {
    const student = await studentService.getStudentById(req.params.studentId);

    res.json({
      success: true,
      data: student,
    });
  });
}

export const studentController = new StudentController();




