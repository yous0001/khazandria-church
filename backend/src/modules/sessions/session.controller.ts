import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sessionService } from './session.service';
import { HttpError } from '../../utils/httpError';

function parseJsonArrayField(
  value: unknown,
  fieldName: string
): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value as string[];

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new HttpError(400, `${fieldName} must be a JSON array`);
      }
      return parsed;
    } catch {
      throw new HttpError(400, `Invalid JSON for ${fieldName}`);
    }
  }

  throw new HttpError(400, `${fieldName} must be a JSON array`);
}

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
    const { present, bonusMark } = req.body;
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

    const parsedRemoveImageIds = parseJsonArrayField(
      removeImageIds,
      'removeImageIds'
    );
    const parsedRemoveVideoIds = parseJsonArrayField(
      removeVideoIds,
      'removeVideoIds'
    );
    const parsedRemovePdfIds = parseJsonArrayField(removePdfIds, 'removePdfIds');

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

  generateAttendancePdf = asyncHandler(async (req: Request, res: Response) => {
    const session = await sessionService.generateAttendanceReportPdf(
      req.params.sessionId,
      req.user!.userId
    );

    res.json({
      success: true,
      data: session,
      message: 'Attendance PDF generated successfully',
    });
  });

  downloadAttendancePdf = asyncHandler(async (req: Request, res: Response) => {
    const { buffer, filename } =
      await sessionService.downloadAttendanceReportPdf(req.params.sessionId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(filename)}"`
    );
    res.send(buffer);
  });
}

export const sessionController = new SessionController();




