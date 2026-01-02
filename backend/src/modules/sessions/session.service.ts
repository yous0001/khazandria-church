import mongoose from 'mongoose';
import { Session, ISession, ISessionStudent, ISessionGrade } from './session.model';
import { Group } from '../groups/group.model';
import { Activity } from '../activities/activity.model';
import { GroupStudent } from '../enrollments/groupStudent.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';
import { calculateSessionMarks, validateSessionGrades } from '../../utils/gradeCalc';

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

    // Validate session grades if provided
    if (dto.sessionGrades && dto.sessionGrades.length > 0) {
      const validation = validateSessionGrades(activity, dto.sessionGrades);
      if (!validation.valid) {
        throw new HttpError(400, validation.errors.join(', '));
      }
    }

    // Calculate marks using server-authoritative logic
    const calculated = calculateSessionMarks(activity, {
      present: dto.present,
      bonusMark: dto.bonusMark,
      sessionGrades: dto.sessionGrades,
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
        sessionGrades: dto.sessionGrades || [],
        recordedByUserId: new mongoose.Types.ObjectId(userId),
      });
    } else {
      // Update existing student entry
      session.students[studentIndex].present = dto.present;
      session.students[studentIndex].sessionMark = calculated.sessionMark;
      session.students[studentIndex].bonusMark = calculated.bonusMark;
      session.students[studentIndex].totalSessionMark = calculated.totalSessionMark;
      session.students[studentIndex].sessionGrades = dto.sessionGrades || [];
      session.students[studentIndex].recordedByUserId = new mongoose.Types.ObjectId(userId);
    }

    await session.save();

    return session;
  }
}

export const sessionService = new SessionService();

