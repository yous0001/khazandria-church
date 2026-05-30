import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { reportsService } from './reports.service';
import { groupStudentService } from '../enrollments/groupStudent.service';

export class ReportsController {
  getStudentSummary = asyncHandler(async (req: Request, res: Response) => {
    const { activityId, studentId } = req.params;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const summary = await reportsService.getStudentSummary(
      activityId,
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: summary,
    });
  });

  getGroupPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const performance = await reportsService.getGroupPerformance(
      groupId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: performance,
    });
  });

  getActivityStudents = asyncHandler(async (req: Request, res: Response) => {
    const { activityId } = req.params;

    const students = await groupStudentService.getActivityReportStudents(
      activityId
    );

    res.json({
      success: true,
      data: students,
    });
  });

  exportActivityStudents = asyncHandler(async (req: Request, res: Response) => {
    const { activityId } = req.params;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const groupId = req.query.groupId as string | undefined;

    const exportData = await reportsService.getActivityStudentsExport(
      activityId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      groupId
    );

    res.json({
      success: true,
      data: exportData,
    });
  });
}

export const reportsController = new ReportsController();





