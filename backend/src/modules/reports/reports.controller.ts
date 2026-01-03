import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { reportsService } from './reports.service';

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
}

export const reportsController = new ReportsController();





