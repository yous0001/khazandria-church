import mongoose from 'mongoose';
import { Session, ISession, ISessionStudent, ISessionGrade, ISessionContent } from './session.model';
import { Group } from '../groups/group.model';
import { Activity } from '../activities/activity.model';
import { GroupStudent } from '../enrollments/groupStudent.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';
import { calculateSessionMarks, validateSessionGrades } from '../../utils/gradeCalc';
import { uploadService, UploadResult } from '../uploads/upload.service';

export interface CreateSessionDTO {
  sessionDate: Date;
  initializeStudents?: boolean;
}

export interface UpdateSessionStudentDTO {
  present: boolean;
  bonusMark?: number;
  sessionGrades?: ISessionGrade[];
}

export class SessionService {
  async createSession(
    groupId: string,
    userId: string,
    dto: CreateSessionDTO
  ): Promise<ISession> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    let students: ISessionStudent[] = [];

    // Initialize students array if requested
    if (dto.initializeStudents) {
      const enrollments = await GroupStudent.find({ groupId });
      const activity = await Activity.findById(group.activityId);

      if (!activity) {
        throw new HttpError(404, 'Activity not found');
      }

      // Pre-populate session grades from activity configuration
      const initialSessionGrades = activity.sessionGrades.map((grade) => ({
        gradeName: grade.name,
        mark: 0,
        fullMark: grade.fullMark,
      }));

      students = enrollments.map((enrollment) => ({
        studentId: enrollment.studentId,
        present: false,
        sessionMark: 0,
        bonusMark: 0,
        totalSessionMark: 0,
        sessionGrades: initialSessionGrades,
        recordedByUserId: new mongoose.Types.ObjectId(userId),
      }));
    }

    const session = await Session.create({
      groupId,
      sessionDate: dto.sessionDate,
      createdByUserId: userId,
      students,
    });

    return session;
  }

  async getSessionsByGroup(groupId: string): Promise<ISession[]> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    return Session.find({ groupId })
      .populate('students.studentId', 'name')
      .sort({ sessionDate: -1 });
  }

  async getSessionById(sessionId: string): Promise<ISession> {
    if (!isValidObjectId(sessionId)) {
      throw new HttpError(400, 'Invalid session ID');
    }

    const session = await Session.findById(sessionId).populate('students.studentId', 'name');
    if (!session) {
      throw new HttpError(404, 'Session not found');
    }

    return session;
  }

  async updateSessionStudent(
    sessionId: string,
    studentId: string,
    userId: string,
    dto: UpdateSessionStudentDTO
  ): Promise<ISession> {
    if (!isValidObjectId(sessionId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new HttpError(404, 'Session not found');
    }

    // Get group and activity for grade calculations
    const group = await Group.findById(session.groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const activity = await Activity.findById(group.activityId);
    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    // If student is present and sessionGrades are not provided or empty,
    // default to full marks for all session grades
    let sessionGrades = dto.sessionGrades;
    if (dto.present && (!sessionGrades || sessionGrades.length === 0)) {
      // Get existing student data to preserve their sessionGrades structure
      const existingStudent = session.students.find(
        (s) => s.studentId.toString() === studentId
      );
      
      if (existingStudent && existingStudent.sessionGrades.length > 0) {
        // Use existing structure but set marks to full marks
        sessionGrades = existingStudent.sessionGrades.map((grade) => ({
          gradeName: grade.gradeName,
          mark: grade.fullMark, // Default to full mark when present
          fullMark: grade.fullMark,
        }));
      } else {
        // Create from activity configuration
        sessionGrades = activity.sessionGrades.map((grade) => ({
          gradeName: grade.name,
          mark: grade.fullMark, // Default to full mark when present
          fullMark: grade.fullMark,
        }));
      }
    } else if (!dto.present) {
      // If student is absent, set all marks to 0
      if (sessionGrades && sessionGrades.length > 0) {
        sessionGrades = sessionGrades.map((grade) => ({
          ...grade,
          mark: 0,
        }));
      }
    }

    // Validate session grades if provided
    if (sessionGrades && sessionGrades.length > 0) {
      const validation = validateSessionGrades(activity, sessionGrades);
      if (!validation.valid) {
        throw new HttpError(400, validation.errors.join(', '));
      }
    }

    // Calculate marks using server-authoritative logic
    const calculated = calculateSessionMarks(activity, {
      present: dto.present,
      bonusMark: dto.bonusMark,
      sessionGrades: sessionGrades,
    });

    // Find student in session
    const studentIndex = session.students.findIndex(
      (s) => s.studentId.toString() === studentId
    );

    if (studentIndex === -1) {
      // Add new student entry
      session.students.push({
        studentId: new mongoose.Types.ObjectId(studentId),
        present: dto.present,
        sessionMark: calculated.sessionMark,
        bonusMark: calculated.bonusMark,
        totalSessionMark: calculated.totalSessionMark,
        sessionGrades: sessionGrades || [],
        recordedByUserId: new mongoose.Types.ObjectId(userId),
      });
    } else {
      // Update existing student entry
      session.students[studentIndex].present = dto.present;
      session.students[studentIndex].sessionMark = calculated.sessionMark;
      session.students[studentIndex].bonusMark = calculated.bonusMark;
      session.students[studentIndex].totalSessionMark = calculated.totalSessionMark;
      session.students[studentIndex].sessionGrades = sessionGrades || [];
      session.students[studentIndex].recordedByUserId = new mongoose.Types.ObjectId(userId);
    }

    await session.save();

    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!isValidObjectId(sessionId)) {
      throw new HttpError(400, 'Invalid session ID');
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new HttpError(404, 'Session not found');
    }

    await Session.deleteOne({ _id: sessionId });
  }

  async updateSessionContent(
    sessionId: string,
    content: {
      text?: string;
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
      pdfs?: Express.Multer.File[];
      removeImageIds?: string[];
      removeVideoIds?: string[];
      removePdfIds?: string[];
    }
  ): Promise<ISession> {
    if (!isValidObjectId(sessionId)) {
      throw new HttpError(400, 'Invalid session ID');
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new HttpError(404, 'Session not found');
    }

    // Initialize content if it doesn't exist
    if (!session.content) {
      session.content = {
        text: '',
        images: [],
        videos: [],
        pdfs: [],
      };
    }

    // Update text if provided
    if (content.text !== undefined) {
      session.content.text = content.text;
    }

    // Handle image uploads
    if (content.images && content.images.length > 0) {
      const uploadResults = await uploadService.uploadFiles(content.images, {
        folder: `sessions/${sessionId}/images`,
        resourceType: 'image',
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      });

      const newImages = uploadResults.map((result: UploadResult, index: number) => ({
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        resourceType: result.resourceType,
        bytes: result.bytes,
        originalName: content.images![index].originalname,
        uploadedAt: new Date(),
      }));

      session.content.images = [...(session.content.images || []), ...newImages];
    }

    // Handle video uploads
    if (content.videos && content.videos.length > 0) {
      const uploadResults = await uploadService.uploadFiles(content.videos, {
        folder: `sessions/${sessionId}/videos`,
        resourceType: 'video',
        allowedFormats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
      });

      const newVideos = uploadResults.map((result: UploadResult, index: number) => ({
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        resourceType: result.resourceType,
        bytes: result.bytes,
        originalName: content.videos![index].originalname,
        uploadedAt: new Date(),
      }));

      session.content.videos = [...(session.content.videos || []), ...newVideos];
    }

    // Handle PDF uploads
    if (content.pdfs && content.pdfs.length > 0) {
      const uploadResults = await uploadService.uploadFiles(content.pdfs, {
        folder: `sessions/${sessionId}/pdfs`,
        resourceType: 'raw',
        allowedFormats: ['pdf'],
      });

      const newPdfs = uploadResults.map((result: UploadResult, index: number) => ({
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        resourceType: result.resourceType,
        bytes: result.bytes,
        originalName: content.pdfs![index].originalname,
        uploadedAt: new Date(),
      }));

      session.content.pdfs = [...(session.content.pdfs || []), ...newPdfs];
    }

    // Handle file removals
    if (content.removeImageIds && content.removeImageIds.length > 0) {
      const imagesToRemove = session.content.images?.filter((img) =>
        content.removeImageIds!.includes(img.publicId)
      ) || [];

      // Delete from Cloudinary
      for (const image of imagesToRemove) {
        try {
          await uploadService.deleteFile(image.publicId, 'image');
        } catch (error) {
          // Log error but continue
          console.error(`Failed to delete image ${image.publicId}:`, error);
        }
      }

      session.content.images = session.content.images?.filter(
        (img) => !content.removeImageIds!.includes(img.publicId)
      ) || [];
    }

    if (content.removeVideoIds && content.removeVideoIds.length > 0) {
      const videosToRemove = session.content.videos?.filter((vid) =>
        content.removeVideoIds!.includes(vid.publicId)
      ) || [];

      // Delete from Cloudinary
      for (const video of videosToRemove) {
        try {
          await uploadService.deleteFile(video.publicId, 'video');
        } catch (error) {
          // Log error but continue
          console.error(`Failed to delete video ${video.publicId}:`, error);
        }
      }

      session.content.videos = session.content.videos?.filter(
        (vid) => !content.removeVideoIds!.includes(vid.publicId)
      ) || [];
    }

    if (content.removePdfIds && content.removePdfIds.length > 0) {
      const pdfsToRemove = session.content.pdfs?.filter((pdf) =>
        content.removePdfIds!.includes(pdf.publicId)
      ) || [];

      // Delete from Cloudinary
      for (const pdf of pdfsToRemove) {
        try {
          await uploadService.deleteFile(pdf.publicId, 'raw');
        } catch (error) {
          // Log error but continue
          console.error(`Failed to delete PDF ${pdf.publicId}:`, error);
        }
      }

      session.content.pdfs = session.content.pdfs?.filter(
        (pdf) => !content.removePdfIds!.includes(pdf.publicId)
      ) || [];
    }

    await session.save();
    return session;
  }
}

export const sessionService = new SessionService();

