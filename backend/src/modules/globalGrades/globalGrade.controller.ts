import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { globalGradeService } from './globalGrade.service';
import { HttpError } from '../../utils/httpError';

export class GlobalGradeController {
  upsertGlobalGrade = asyncHandler(async (req: Request, res: Response) => {
    const { grades } = req.body;
    const { activityId, studentId } = req.params;

    if (!grades || !Array.isArray(grades)) {
      throw new HttpError(400, 'grades array is required');
    }

    const globalGrade = await globalGradeService.upsertGlobalGrade(
      activityId,
      studentId,
      req.user!.userId,
      { grades }
    );

    res.json({
      success: true,
      data: globalGrade,
    });
  });

  getGlobalGrade = asyncHandler(async (req: Request, res: Response) => {
    const { activityId, studentId } = req.params;

    const globalGrade = await globalGradeService.getGlobalGrade(activityId, studentId);

    if (!globalGrade) {
      res.status(404).json({
        success: false,
        message: 'Global grade not found',
      });
      return;
    }

    res.json({
      success: true,
      data: globalGrade,
    });
  });
}

export const globalGradeController = new GlobalGradeController();




