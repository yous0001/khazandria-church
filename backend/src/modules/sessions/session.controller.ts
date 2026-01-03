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

  deleteSession = asyncHandler(async (req: Request, res: Response) => {
    await sessionService.deleteSession(req.params.sessionId);

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  });

  updateSessionContent = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { text, removeImageIds, removeVideoIds, removePdfIds } = req.body;

    // Parse JSON fields if they're strings (common with multipart/form-data)
    let parsedRemoveImageIds: string[] | undefined;
    let parsedRemoveVideoIds: string[] | undefined;
    let parsedRemovePdfIds: string[] | undefined;

    if (removeImageIds) {
      parsedRemoveImageIds = typeof removeImageIds === 'string' 
        ? JSON.parse(removeImageIds) 
        : removeImageIds;
    }

    if (removeVideoIds) {
      parsedRemoveVideoIds = typeof removeVideoIds === 'string' 
        ? JSON.parse(removeVideoIds) 
        : removeVideoIds;
    }

    if (removePdfIds) {
      parsedRemovePdfIds = typeof removePdfIds === 'string' 
        ? JSON.parse(removePdfIds) 
        : removePdfIds;
    }

    // Get files from request
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const images = files?.['images'] || [];
    const videos = files?.['videos'] || [];
    const pdfs = files?.['pdfs'] || [];

    const session = await sessionService.updateSessionContent(sessionId, {
      text,
      images: images.length > 0 ? images : undefined,
      videos: videos.length > 0 ? videos : undefined,
      pdfs: pdfs.length > 0 ? pdfs : undefined,
      removeImageIds: parsedRemoveImageIds,
      removeVideoIds: parsedRemoveVideoIds,
      removePdfIds: parsedRemovePdfIds,
    });

    res.json({
      success: true,
      data: session,
    });
  });
}

export const sessionController = new SessionController();




