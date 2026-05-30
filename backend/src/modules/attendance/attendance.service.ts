import mongoose from "mongoose";
import {
  SessionAttendance,
  ISessionAttendance,
  SessionStudentView,
} from "./sessionAttendance.model";
import { Session, ISession } from "../sessions/session.model";
import { Student } from "../students/student.model";
import { Group } from "../groups/group.model";
import { Activity } from "../activities/activity.model";
import { HttpError } from "../../utils/httpError";
import { calculateSessionMarks } from "../../utils/gradeCalc";
import { assertStudentWasGroupMemberAtSession } from "../enrollments/membership.service";

export class AttendanceService {
  async attachStudentsToSessions(
    sessions: ISession[],
    populateNames = false
  ): Promise<Array<ISession & { students: SessionStudentView[] }>> {
    if (sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s._id);
    const records = await SessionAttendance.find({
      sessionId: { $in: sessionIds },
    }).sort({ createdAt: 1 });

    if (populateNames) {
      await SessionAttendance.populate(records, {
        path: "studentId",
        select: "name",
      });
    }

    const bySession = new Map<string, SessionStudentView[]>();
    for (const record of records) {
      const key = record.sessionId.toString();
      if (!bySession.has(key)) bySession.set(key, []);
      bySession.get(key)!.push({
        studentId: record.studentId as SessionStudentView["studentId"],
        present: record.present,
        bonusMark: record.bonusMark,
        totalSessionMark: record.totalSessionMark,
        recordedByUserId: record.recordedByUserId,
      });
    }

    return sessions.map((session) => {
      const doc = session.toObject ? session.toObject() : { ...session };
      return {
        ...doc,
        students: bySession.get(session._id.toString()) ?? [],
      } as ISession & { students: SessionStudentView[] };
    });
  }

  async attachStudentsToSession(
    session: ISession,
    populateNames = false
  ): Promise<ISession & { students: SessionStudentView[] }> {
    const [result] = await this.attachStudentsToSessions([session], populateNames);
    return result;
  }

  async createAbsentRecordsForSession(
    session: ISession,
    activityId: mongoose.Types.ObjectId,
    studentIds: mongoose.Types.ObjectId[],
    userId: string
  ): Promise<mongoose.Types.ObjectId[]> {
    if (studentIds.length === 0) return [];

    const recordedBy = new mongoose.Types.ObjectId(userId);
    const ids: mongoose.Types.ObjectId[] = [];

    for (const studentId of studentIds) {
      const existing = await SessionAttendance.findOne({
        sessionId: session._id,
        studentId,
      });
      if (existing) {
        ids.push(existing._id);
        continue;
      }

      const record = await SessionAttendance.create({
        sessionId: session._id,
        studentId,
        activityId,
        groupId: session.groupId,
        sessionDate: session.sessionDate,
        present: false,
        bonusMark: 0,
        totalSessionMark: 0,
        recordedByUserId: recordedBy,
      });

      ids.push(record._id);

      await Promise.all([
        Session.updateOne(
          { _id: session._id },
          { $addToSet: { attendanceIds: record._id } }
        ),
        Student.updateOne(
          { _id: studentId },
          { $addToSet: { attendanceIds: record._id } }
        ),
      ]);
    }

    return ids;
  }

  async upsertStudentAttendance(
    sessionId: string,
    studentId: string,
    userId: string,
    input: { present: boolean; bonusMark?: number }
  ): Promise<ISessionAttendance> {
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new HttpError(404, "Session not found");
    }

    const group = await Group.findById(session.groupId);
    if (!group) {
      throw new HttpError(404, "Group not found");
    }

    const activity = await Activity.findById(group.activityId);
    if (!activity) {
      throw new HttpError(404, "Activity not found");
    }

    const calculated = calculateSessionMarks(activity, input);
    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const recordedBy = new mongoose.Types.ObjectId(userId);

    let record = await SessionAttendance.findOne({
      sessionId,
      studentId: studentObjectId,
    });

    if (!record) {
      await assertStudentWasGroupMemberAtSession(
        session.groupId.toString(),
        studentId,
        session.sessionDate
      );

      record = await SessionAttendance.create({
        sessionId: session._id,
        studentId: studentObjectId,
        activityId: group.activityId,
        groupId: session.groupId,
        sessionDate: session.sessionDate,
        present: input.present,
        bonusMark: calculated.bonusMark,
        totalSessionMark: calculated.totalSessionMark,
        recordedByUserId: recordedBy,
      });

      await Promise.all([
        Session.updateOne(
          { _id: session._id },
          { $addToSet: { attendanceIds: record._id } }
        ),
        Student.updateOne(
          { _id: studentObjectId },
          { $addToSet: { attendanceIds: record._id } }
        ),
      ]);
    } else {
      record.present = input.present;
      record.bonusMark = calculated.bonusMark;
      record.totalSessionMark = calculated.totalSessionMark;
      record.recordedByUserId = recordedBy;
      await record.save();
    }

    return record;
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    const records = await SessionAttendance.find({ sessionId });
    const recordIds = records.map((r) => r._id);
    const studentIds = [...new Set(records.map((r) => r.studentId.toString()))];

    await SessionAttendance.deleteMany({ sessionId });

    if (recordIds.length > 0) {
      await Session.updateOne(
        { _id: sessionId },
        { $pull: { attendanceIds: { $in: recordIds } } }
      );

      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $pull: { attendanceIds: { $in: recordIds } } }
      );
    }
  }

  async deleteStudentFromGroupSessionsAfter(
    groupId: string,
    studentId: string,
    afterDate: Date
  ): Promise<void> {
    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const records = await SessionAttendance.find({
      groupId,
      studentId: studentObjectId,
      sessionDate: { $gt: afterDate },
    });

    if (records.length === 0) return;

    const recordIds = records.map((r) => r._id);
    const sessionIds = [...new Set(records.map((r) => r.sessionId.toString()))];

    await SessionAttendance.deleteMany({ _id: { $in: recordIds } });

    await Session.updateMany(
      { _id: { $in: sessionIds } },
      { $pull: { attendanceIds: { $in: recordIds } } }
    );

    await Student.updateOne(
      { _id: studentObjectId },
      { $pull: { attendanceIds: { $in: recordIds } } }
    );
  }

  async backfillForStudentInGroup(
    groupId: string,
    activityId: mongoose.Types.ObjectId,
    studentId: string,
    fromDate: Date,
    userId: string
  ): Promise<void> {
    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const sessions = await Session.find({
      groupId,
      sessionDate: { $gte: fromDate },
    });

    for (const session of sessions) {
      const exists = await SessionAttendance.findOne({
        sessionId: session._id,
        studentId: studentObjectId,
      });
      if (!exists) {
        await this.createAbsentRecordsForSession(
          session,
          activityId,
          [studentObjectId],
          userId
        );
      }
    }
  }

  async sumMarksForStudent(
    activityId: string,
    studentId: string
  ): Promise<number> {
    const result = await SessionAttendance.aggregate([
      {
        $match: {
          activityId: new mongoose.Types.ObjectId(activityId),
          studentId: new mongoose.Types.ObjectId(studentId),
        },
      },
      { $group: { _id: null, total: { $sum: "$totalSessionMark" } } },
    ]);

    return result[0]?.total ?? 0;
  }

  buildDateFilter(
    startDate?: Date,
    endDate?: Date
  ): Record<string, Date> | undefined {
    if (!startDate && !endDate) return undefined;

    const filter: Record<string, Date> = {};
    if (startDate) filter.$gte = startDate;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.$lte = endOfDay;
    }
    return filter;
  }
}

export const attendanceService = new AttendanceService();
