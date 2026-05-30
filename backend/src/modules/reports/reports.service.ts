import { GlobalGrade } from '../globalGrades/globalGrade.model';
import { Group } from '../groups/group.model';
import { Student } from '../students/student.model';
import { GroupStudent } from '../enrollments/groupStudent.model';
import { SessionAttendance } from '../attendance/sessionAttendance.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';
import { attendanceService } from '../attendance/attendance.service';

export interface AttendanceDetail {
  date: string;
  present: boolean;
  sessionMark: number;
  groupId: string;
  groupName: string;
}

export interface GlobalGradeSummary {
  gradeName: string;
  mark: number;
  fullMark: number;
  status: 'not_taken' | 'taken';
}

export interface StudentSummary {
  studentId: string;
  studentName: string;
  totalSessions: number;
  sessionsPresent: number;
  sessionsAbsent: number;
  attendanceRate: number;
  totalSessionMark: number;
  totalGlobalMark: number;
  totalFinalMark: number;
  attendanceDetails: AttendanceDetail[];
  globalGradesSummary: GlobalGradeSummary[];
}

export interface GroupPerformance {
  studentId: string;
  studentName: string;
  totalSessions: number;
  sessionsPresent: number;
  sessionsAbsent: number;
  attendanceRate: number;
  totalSessionMark: number;
  totalGlobalMark: number;
  totalFinalMark: number;
}

function calcRate(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 10000) / 100;
}

export class ReportsService {
  async getStudentSummary(
    activityId: string,
    studentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<StudentSummary> {
    if (!isValidObjectId(activityId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    const groups = await Group.find({ activityId });
    const groupMap = new Map(
      groups.map((g) => [g._id.toString(), g.name])
    );

    const query: Record<string, unknown> = {
      activityId,
      studentId,
    };

    const dateFilter = attendanceService.buildDateFilter(startDate, endDate);
    if (dateFilter) {
      query.sessionDate = dateFilter;
    }

    const records = await SessionAttendance.find(query).sort({ sessionDate: 1 });

    const totalSessions = records.length;
    const sessionsPresent = records.filter((r) => r.present).length;
    const sessionsAbsent = totalSessions - sessionsPresent;
    const attendanceRate = calcRate(sessionsPresent, totalSessions);
    const totalSessionMark = records.reduce(
      (sum, r) => sum + r.totalSessionMark,
      0
    );

    const attendanceDetails: AttendanceDetail[] = records.map((record) => {
      const groupIdStr = record.groupId.toString();
      return {
        date: record.sessionDate.toISOString(),
        present: record.present,
        sessionMark: record.totalSessionMark,
        groupId: groupIdStr,
        groupName: groupMap.get(groupIdStr) || 'Unknown',
      };
    });

    const globalGrade = await GlobalGrade.findOne({ activityId, studentId });
    const totalGlobalMark = globalGrade?.totalGlobalMark || 0;
    const totalFinalMark = totalSessionMark + totalGlobalMark;

    const globalGradesSummary: GlobalGradeSummary[] =
      globalGrade?.grades.map((grade) => ({
        gradeName: grade.gradeName,
        mark: grade.mark,
        fullMark: grade.fullMark,
        status: grade.status,
      })) || [];

    return {
      studentId: student._id.toString(),
      studentName: student.name,
      totalSessions,
      sessionsPresent,
      sessionsAbsent,
      attendanceRate,
      totalSessionMark,
      totalGlobalMark,
      totalFinalMark,
      attendanceDetails,
      globalGradesSummary,
    };
  }

  async getGroupPerformance(
    groupId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GroupPerformance[]> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const enrollments = await GroupStudent.find({ groupId }).populate(
      'studentId'
    );

    const studentIds = enrollments.map((e) => {
      const s = e.studentId as { _id: { toString(): string } };
      return s._id.toString();
    });

    const globalGrades = await GlobalGrade.find({
      activityId: group.activityId,
      studentId: { $in: studentIds },
    });

    const globalGradeMap = new Map(
      globalGrades.map((g) => [g.studentId.toString(), g])
    );

    const performance: GroupPerformance[] = [];

    for (const enrollment of enrollments) {
      const student = enrollment.studentId as unknown as {
        _id: { toString(): string };
        name: string;
      };
      const studentId = student._id.toString();

      const sessionDateFilter: Record<string, Date> = {
        $gte: enrollment.createdAt,
      };

      if (startDate && startDate > enrollment.createdAt) {
        sessionDateFilter.$gte = startDate;
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        sessionDateFilter.$lte = endOfDay;
      }

      const query: Record<string, unknown> = {
        groupId,
        studentId,
        sessionDate: sessionDateFilter,
      };

      const records = await SessionAttendance.find(query);

      const totalSessions = records.length;
      const sessionsPresent = records.filter((r) => r.present).length;
      const sessionsAbsent = totalSessions - sessionsPresent;
      const totalSessionMark = records.reduce(
        (sum, r) => sum + r.totalSessionMark,
        0
      );

      const globalGrade = globalGradeMap.get(studentId);
      const totalGlobalMark = globalGrade?.totalGlobalMark || 0;

      performance.push({
        studentId,
        studentName: student.name,
        totalSessions,
        sessionsPresent,
        sessionsAbsent,
        attendanceRate: calcRate(sessionsPresent, totalSessions),
        totalSessionMark,
        totalGlobalMark,
        totalFinalMark: totalSessionMark + totalGlobalMark,
      });
    }

    performance.sort((a, b) => b.totalFinalMark - a.totalFinalMark);
    return performance;
  }
}

export const reportsService = new ReportsService();
