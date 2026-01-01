import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { groupStudentService } from './groupStudent.service';
import { HttpError } from '../../utils/httpError';

export class GroupStudentController {
  enrollStudent = asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.body;
    const { groupId } = req.params;

    if (!studentId) {
      throw new HttpError(400, 'studentId is required');
    }

    const enrollment = await groupStudentService.enrollStudent(groupId, studentId);

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  });

  getGroupStudents = asyncHandler(async (req: Request, res: Response) => {
    const students = await groupStudentService.getGroupStudents(req.params.groupId);

    res.json({
      success: true,
      data: students,
    });
  });

  removeStudent = asyncHandler(async (req: Request, res: Response) => {
    await groupStudentService.removeStudent(req.params.groupId, req.params.studentId);

    res.json({
      success: true,
      message: 'Student removed from group successfully',
    });
  });
}

export const groupStudentController = new GroupStudentController();

