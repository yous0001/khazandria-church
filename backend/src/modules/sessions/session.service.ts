import mongoose from "mongoose";
import { Session, ISession } from "./session.model";
import { Group } from "../groups/group.model";
import { Activity } from "../activities/activity.model";
import { GroupStudent } from "../enrollments/groupStudent.model";
import { HttpError } from "../../utils/httpError";
import { isValidObjectId } from "../../utils/objectId";
import { uploadService, UploadResult } from "../uploads/upload.service";
import { globalGradeService } from "../globalGrades/globalGrade.service";
import { User } from "../users/user.model";
import { generateAttendancePdf } from "../../utils/generateAttendancePdf";
import { attendanceService } from "../attendance/attendance.service";
import { SessionAttendance } from "../attendance/sessionAttendance.model";

export interface CreateSessionDTO {
  sessionDate: Date;
  initializeStudents?: boolean;
}

export interface UpdateSessionStudentDTO {
  present: boolean;
  bonusMark?: number;
}

export class SessionService {
  private enrichAttendanceReportUrl(session: ISession): ISession {
    if (session.attendanceReport?.publicId) {
      session.attendanceReport.url = uploadService.getSignedDeliveryUrl(
        session.attendanceReport.publicId,
        (session.attendanceReport.resourceType as "raw") || "raw"
      );
    }
    return session;
  }

  private resolveStudentName(
    studentId: mongoose.Types.ObjectId | { name?: string; _id?: unknown }
  ): string {
    if (!studentId) return "طالب";
    if (typeof studentId === "object" && "name" in studentId) {
      const name = (studentId as { name?: string }).name?.trim();
      if (name) return name;
    }
    return "طالب";
  }

  async createSession(
    groupId: string,
    userId: string,
    dto: CreateSessionDTO
  ): Promise<ISession & { students: unknown[] }> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, "Invalid group ID");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new HttpError(404, "Group not found");
    }

    const session = await Session.create({
      groupId,
      sessionDate: dto.sessionDate,
      createdByUserId: userId,
      attendanceIds: [],
    });

    if (dto.initializeStudents) {
      const sessionDayEnd = new Date(dto.sessionDate);
      sessionDayEnd.setHours(23, 59, 59, 999);

      const enrollments = await GroupStudent.find({
        groupId,
        createdAt: { $lte: sessionDayEnd },
      });

      const studentIds = enrollments.map((e) => e.studentId);
      await attendanceService.createAbsentRecordsForSession(
        session,
        group.activityId,
        studentIds,
        userId
      );
    }

    return attendanceService.attachStudentsToSession(session, true);
  }

  async getSessionsByGroup(
    groupId: string
  ): Promise<Array<ISession & { students: unknown[] }>> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, "Invalid group ID");
    }

    const sessions = await Session.find({ groupId }).sort({ sessionDate: -1 });
    return attendanceService.attachStudentsToSessions(sessions, true);
  }

  async getSessionById(
    sessionId: string
  ): Promise<ISession & { students: unknown[] }> {
    if (!isValidObjectId(sessionId)) {
      throw new HttpError(400, "Invalid session ID");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    const withStudents = await attendanceService.attachStudentsToSession(
      session,
      true
    );
    return this.enrichAttendanceReportUrl(
      withStudents as ISession
    ) as ISession & { students: unknown[] };
  }

  async downloadAttendanceReportPdf(
    sessionId: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const session = await this.getSessionById(sessionId);

    if (!session.attendanceReport?.publicId) {
      throw new HttpError(404, "Attendance report not found");
    }

    const buffer = await uploadService.fetchResourceBuffer(
      session.attendanceReport.publicId,
      "raw"
    );

    return {
      buffer,
      filename:
        session.attendanceReport.originalName || "attendance-report.pdf",
    };
  }

  async updateSessionStudent(
    sessionId: string,
    studentId: string,
    userId: string,
    dto: UpdateSessionStudentDTO
  ): Promise<ISession & { students: unknown[] }> {
    if (!isValidObjectId(sessionId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, "Invalid ID");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    const group = await Group.findById(session.groupId);
    if (!group) {
      throw new HttpError(404, "Group not found");
    }

    await attendanceService.upsertStudentAttendance(
      sessionId,
      studentId,
      userId,
      dto
    );

    await globalGradeService.refreshGlobalGradeSessionTotals(
      group.activityId.toString(),
      studentId
    );

    return this.getSessionById(sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!isValidObjectId(sessionId)) {
      throw new HttpError(400, "Invalid session ID");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    const group = await Group.findById(session.groupId);
    const records = await SessionAttendance.find({ sessionId });
    const studentIds = [
      ...new Set(records.map((r) => r.studentId.toString())),
    ];

    if (session.attendanceReport?.publicId) {
      try {
        await uploadService.deleteFile(session.attendanceReport.publicId, "raw");
      } catch {
        // Continue
      }
    }

    await attendanceService.deleteBySessionId(sessionId);
    await Session.deleteOne({ _id: sessionId });

    if (group) {
      for (const sid of studentIds) {
        await globalGradeService.refreshGlobalGradeSessionTotals(
          group.activityId.toString(),
          sid
        );
      }
    }
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
      throw new HttpError(400, "Invalid session ID");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    if (!session.content) {
      session.content = {
        text: "",
        images: [],
        videos: [],
        pdfs: [],
      };
    }

    if (content.text !== undefined) {
      session.content.text = content.text;
    }

    if (content.images && content.images.length > 0) {
      const uploadResults = await uploadService.uploadFiles(content.images, {
        folder: `sessions/${sessionId}/images`,
        resourceType: "image",
        allowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
      });

      const newImages = uploadResults.map(
        (result: UploadResult, index: number) => {
          const originalFile = content.images![index];
          let format = result.format;
          if (!format || format === "") {
            const fileExtension = originalFile.originalname
              .split(".")
              .pop()
              ?.toLowerCase();
            format = fileExtension || "jpg";
          }

          return {
            url: result.url,
            publicId: result.publicId,
            format,
            resourceType: result.resourceType,
            bytes: result.bytes,
            originalName: originalFile.originalname,
            uploadedAt: new Date(),
          };
        }
      );

      session.content.images = [
        ...(session.content.images || []),
        ...newImages,
      ];
    }

    if (content.videos && content.videos.length > 0) {
      const uploadResults = await uploadService.uploadFiles(content.videos, {
        folder: `sessions/${sessionId}/videos`,
        resourceType: "video",
        allowedFormats: ["mp4", "mov", "avi", "webm", "mkv"],
      });

      const newVideos = uploadResults.map(
        (result: UploadResult, index: number) => {
          const originalFile = content.videos![index];
          let format = result.format;
          if (!format || format === "") {
            const fileExtension = originalFile.originalname
              .split(".")
              .pop()
              ?.toLowerCase();
            format = fileExtension || "mp4";
          }

          return {
            url: result.url,
            publicId: result.publicId,
            format,
            resourceType: result.resourceType,
            bytes: result.bytes,
            originalName: originalFile.originalname,
            uploadedAt: new Date(),
          };
        }
      );

      session.content.videos = [
        ...(session.content.videos || []),
        ...newVideos,
      ];
    }

    if (content.pdfs && content.pdfs.length > 0) {
      const uploadResults = await uploadService.uploadFiles(content.pdfs, {
        folder: `sessions/${sessionId}/pdfs`,
        resourceType: "raw",
        allowedFormats: ["pdf"],
      });

      const newPdfs = uploadResults.map(
        (result: UploadResult, index: number) => {
          const originalFile = content.pdfs![index];
          let format = result.format;
          if (!format || format === "") {
            const fileExtension = originalFile.originalname
              .split(".")
              .pop()
              ?.toLowerCase();
            format = fileExtension === "pdf" ? "pdf" : fileExtension || "pdf";
          }

          return {
            url: result.url,
            publicId: result.publicId,
            format,
            resourceType: result.resourceType,
            bytes: result.bytes,
            originalName: originalFile.originalname,
            uploadedAt: new Date(),
          };
        }
      );

      session.content.pdfs = [...(session.content.pdfs || []), ...newPdfs];
    }

    if (content.removeImageIds?.length) {
      const imagesToRemove =
        session.content.images?.filter((img) =>
          content.removeImageIds!.includes(img.publicId)
        ) || [];

      for (const image of imagesToRemove) {
        try {
          await uploadService.deleteFile(image.publicId, "image");
        } catch (error) {
          console.error(`Failed to delete image ${image.publicId}:`, error);
        }
      }

      session.content.images =
        session.content.images?.filter(
          (img) => !content.removeImageIds!.includes(img.publicId)
        ) || [];
    }

    if (content.removeVideoIds?.length) {
      const videosToRemove =
        session.content.videos?.filter((vid) =>
          content.removeVideoIds!.includes(vid.publicId)
        ) || [];

      for (const video of videosToRemove) {
        try {
          await uploadService.deleteFile(video.publicId, "video");
        } catch (error) {
          console.error(`Failed to delete video ${video.publicId}:`, error);
        }
      }

      session.content.videos =
        session.content.videos?.filter(
          (vid) => !content.removeVideoIds!.includes(vid.publicId)
        ) || [];
    }

    if (content.removePdfIds?.length) {
      const pdfsToRemove =
        session.content.pdfs?.filter((pdf) =>
          content.removePdfIds!.includes(pdf.publicId)
        ) || [];

      for (const pdf of pdfsToRemove) {
        try {
          await uploadService.deleteFile(pdf.publicId, "raw");
        } catch (error) {
          console.error(`Failed to delete PDF ${pdf.publicId}:`, error);
        }
      }

      session.content.pdfs =
        session.content.pdfs?.filter(
          (pdf) => !content.removePdfIds!.includes(pdf.publicId)
        ) || [];
    }

    await session.save();
    return session;
  }

  async generateAttendanceReportPdf(
    sessionId: string,
    userId: string
  ): Promise<ISession & { students: unknown[] }> {
    if (!isValidObjectId(sessionId)) {
      throw new HttpError(400, "Invalid session ID");
    }

    const session = await this.getSessionById(sessionId);
    const group = await Group.findById(session.groupId);
    if (!group) {
      throw new HttpError(404, "Group not found");
    }

    const activity = await Activity.findById(group.activityId);
    if (!activity) {
      throw new HttpError(404, "Activity not found");
    }

    const user = await User.findById(userId);
    const generatedBy = user?.name || "مستخدم";

    const records = await SessionAttendance.find({ sessionId }).populate(
      "studentId",
      "name"
    );

    const students = records
      .map((entry) => ({
        name: this.resolveStudentName(
          entry.studentId as mongoose.Types.ObjectId & { name?: string }
        ),
        present: entry.present,
        bonusMark: entry.bonusMark,
      }))
      .sort((a, b) => {
        if (a.present !== b.present) {
          return a.present ? -1 : 1;
        }
        return a.name.localeCompare(b.name, "ar");
      });

    const pdfBuffer = await generateAttendancePdf({
      activityName: activity.name,
      groupName: group.name,
      sessionDate: session.sessionDate,
      generatedBy,
      generatedAt: new Date(),
      students,
    });

    const sessionDoc = await Session.findById(sessionId);
    if (!sessionDoc) {
      throw new HttpError(404, "Session not found");
    }

    if (sessionDoc.attendanceReport?.publicId) {
      try {
        await uploadService.deleteFile(
          sessionDoc.attendanceReport.publicId,
          "raw"
        );
      } catch {
        // Continue
      }
    }

    const dateLabel = session.sessionDate.toISOString().split("T")[0];
    const uploadResult = await uploadService.uploadBuffer(pdfBuffer, {
      folder: `sessions/${sessionId}/attendance-reports`,
      originalName: `attendance-${dateLabel}.pdf`,
      resourceType: "raw",
    });

    sessionDoc.attendanceReport = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      format: "pdf",
      resourceType: "raw",
      bytes: uploadResult.bytes,
      originalName: `تقرير-حضور-${dateLabel}.pdf`,
      uploadedAt: new Date(),
    };

    await sessionDoc.save();

    return this.getSessionById(sessionId);
  }
}

export const sessionService = new SessionService();
