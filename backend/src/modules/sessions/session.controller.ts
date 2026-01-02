import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sessionService } from './session.service';
import { HttpError } from '../../utils/httpError';

export class SessionController {
  createSession = asyncHandler(async (req: Request, res: Response) => {
    const { sessionDate, initializeStudents } = req.body;
    const { groupId } = req.params;

    if (!sessionDate) {
      throw new HttpError(400, 'sessionDate is required');
    }

    const session = await sessionService.createSession(groupId, req.user!.userId, {
      sessionDate: new Date(sessionDate),
      initializeStudents,
    });

    res.status(201).json({
      success: true,
      data: session,
    });
  });

  getSessionsByGroup = asyncHandler(async (req: Request, res: Response) => {
    const sessions = await sessionService.getSessionsByGroup(req.params.groupId);

    res.json({
      success: true,
      data: sessions,
    });
  });

  getSessionById = asyncHandler(async (req: Request, res: Response) => {
    const session = await sessionService.getSessionById(req.params.sessionId);

    res.json({
      success: true,
      data: session,
    });
  });

  updateSessionStudent = asyncHandler(async (req: Request, res: Response) => {
    const { present, bonusMark, sessionGrades } = req.body;
    const { sessionId, studentId } = req.params;

    if (present === undefined) {
      throw new HttpError(400, 'present field is required');
    }

    const session = await sessionService.updateSessionStudent(
      sessionId,
      studentId,
      req.user!.userId,
      {
        present,
        bonusMark,
        sessionGrades,
      }
    );

    res.json({
      success: true,
      data: session,
    });
  });
}

export const sessionController = new SessionController();




