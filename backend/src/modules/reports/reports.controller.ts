import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { reportsService } from './reports.service';

export class ReportsController {
  getStudentSummary = asyncHandler(async (req: Request, res: Response) => {
    const { activityId, studentId } = req.params;

    const summary = await reportsService.getStudentSummary(activityId, studentId);

    res.json({
      success: true,
      data: summary,
    });
  });

  getGroupPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;

    const performance = await reportsService.getGroupPerformance(groupId);

    res.json({
      success: true,
      data: performance,
    });
  });
}

export const reportsController = new ReportsController();

