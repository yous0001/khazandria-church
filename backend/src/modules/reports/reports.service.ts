import { GlobalGrade } from '../globalGrades/globalGrade.model';
import { Group } from '../groups/group.model';
import { Activity } from '../activities/activity.model';
import { Student } from '../students/student.model';
import { GroupStudent } from '../enrollments/groupStudent.model';
import { SessionAttendance } from '../attendance/sessionAttendance.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';
import { attendanceService } from '../attendance/attendance.service';
import { groupStudentService } from '../enrollments/groupStudent.service';

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

export interface StudentExportRow {
  studentId: string;
  studentName: string;
  phone: string;
  email: string;
  groupName: string;
  totalSessions: number;
  sessionsPresent: number;
  sessionsAbsent: number;
  attendanceRate: number;
  totalSessionMark: number;
  totalGlobalMark: number;
  totalFinalMark: number;
  globalGradesSummary: GlobalGradeSummary[];
}

export interface ActivityStudentsExport {
  activityName: string;
  gradeColumns: Array<{ name: string; fullMark: number }>;
  rows: StudentExportRow[];
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

  async getActivityStudentsExport(
    activityId: string,
    startDate?: Date,
    endDate?: Date,
    groupId?: string
  ): Promise<ActivityStudentsExport> {
    if (!isValidObjectId(activityId)) {
      throw new HttpError(400, 'Invalid activity ID');
    }

    if (groupId && !isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    if (groupId) {
      const group = await Group.findOne({ _id: groupId, activityId });
      if (!group) {
        throw new HttpError(404, 'Group not found in this activity');
      }
    }

    const gradeColumns = activity.globalGrades.map((g) => ({
      name: g.name,
      fullMark: g.fullMark,
    }));

    if (groupId) {
      const group = await Group.findById(groupId);
      const performance = await this.getGroupPerformance(
        groupId,
        startDate,
        endDate
      );

      const studentIds = performance.map((p) => p.studentId);
      const [students, globalGrades] = await Promise.all([
        Student.find({ _id: { $in: studentIds } }),
        GlobalGrade.find({ activityId, studentId: { $in: studentIds } }),
      ]);

      const studentMap = new Map(
        students.map((s) => [
          s._id.toString(),
          { phone: s.phone || '', email: s.email || '' },
        ])
      );
      const globalGradeMap = new Map(
        globalGrades.map((g) => [g.studentId.toString(), g])
      );

      const rows: StudentExportRow[] = performance.map((entry) => {
        const details = studentMap.get(entry.studentId);
        const globalGrade = globalGradeMap.get(entry.studentId);

        return {
          studentId: entry.studentId,
          studentName: entry.studentName,
          phone: details?.phone || '',
          email: details?.email || '',
          groupName: group?.name || '—',
          totalSessions: entry.totalSessions,
          sessionsPresent: entry.sessionsPresent,
          sessionsAbsent: entry.sessionsAbsent,
          attendanceRate: entry.attendanceRate,
          totalSessionMark: entry.totalSessionMark,
          totalGlobalMark: entry.totalGlobalMark,
          totalFinalMark: entry.totalFinalMark,
          globalGradesSummary:
            globalGrade?.grades.map((grade) => ({
              gradeName: grade.gradeName,
              mark: grade.mark,
              fullMark: grade.fullMark,
              status: grade.status,
            })) || [],
        };
      });

      rows.sort((a, b) => a.studentName.localeCompare(b.studentName, 'ar'));

      return { activityName: activity.name, gradeColumns, rows };
    }

    const [studentList, enrollments, globalGrades] = await Promise.all([
      groupStudentService.getActivityReportStudents(activityId),
      GroupStudent.find({ activityId }).populate('groupId', 'name'),
      GlobalGrade.find({ activityId }),
    ]);

    const enrollmentMap = new Map<
      string,
      { groupName: string }
    >();
    for (const enrollment of enrollments) {
      const group = enrollment.groupId as unknown as {
        _id: { toString(): string };
        name: string;
      };
      enrollmentMap.set(enrollment.studentId.toString(), {
        groupName: group.name,
      });
    }

    const globalGradeMap = new Map(
      globalGrades.map((g) => [g.studentId.toString(), g])
    );

    const studentIds = studentList.map((s) => s.studentId);
    const students = await Student.find({ _id: { $in: studentIds } });
    const studentDetailsMap = new Map(
      students.map((s) => [
        s._id.toString(),
        { phone: s.phone || '', email: s.email || '' },
      ])
    );

    const attendanceQuery: Record<string, unknown> = {
      activityId,
      studentId: { $in: studentIds },
    };

    const dateFilter = attendanceService.buildDateFilter(startDate, endDate);
    if (dateFilter) {
      attendanceQuery.sessionDate = dateFilter;
    }

    const attendanceRecords = await SessionAttendance.find(attendanceQuery);

    const attendanceByStudent = new Map<string, typeof attendanceRecords>();
    for (const record of attendanceRecords) {
      const key = record.studentId.toString();
      if (!attendanceByStudent.has(key)) {
        attendanceByStudent.set(key, []);
      }
      attendanceByStudent.get(key)!.push(record);
    }

    const rows: StudentExportRow[] = studentList.map(({ studentId, studentName }) => {
      const records = attendanceByStudent.get(studentId) || [];
      const totalSessions = records.length;
      const sessionsPresent = records.filter((r) => r.present).length;
      const totalSessionMark = records.reduce(
        (sum, r) => sum + r.totalSessionMark,
        0
      );

      const globalGrade = globalGradeMap.get(studentId);
      const totalGlobalMark = globalGrade?.totalGlobalMark || 0;
      const details = studentDetailsMap.get(studentId);
      const enrollment = enrollmentMap.get(studentId);

      return {
        studentId,
        studentName,
        phone: details?.phone || '',
        email: details?.email || '',
        groupName: enrollment?.groupName || '—',
        totalSessions,
        sessionsPresent,
        sessionsAbsent: totalSessions - sessionsPresent,
        attendanceRate: calcRate(sessionsPresent, totalSessions),
        totalSessionMark,
        totalGlobalMark,
        totalFinalMark: totalSessionMark + totalGlobalMark,
        globalGradesSummary:
          globalGrade?.grades.map((grade) => ({
            gradeName: grade.gradeName,
            mark: grade.mark,
            fullMark: grade.fullMark,
            status: grade.status,
          })) || [],
      };
    });

    rows.sort((a, b) => a.studentName.localeCompare(b.studentName, 'ar'));

    return { activityName: activity.name, gradeColumns, rows };
  }
}

export const reportsService = new ReportsService();
