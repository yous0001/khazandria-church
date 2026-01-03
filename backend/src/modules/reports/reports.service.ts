import { Session } from '../sessions/session.model';
import { GlobalGrade } from '../globalGrades/globalGrade.model';
import { Group } from '../groups/group.model';
import { Student } from '../students/student.model';
import { GroupStudent } from '../enrollments/groupStudent.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';

export interface AttendanceDetail {
  date: string;
  present: boolean;
  sessionMark: number;
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
  totalSessionMark: number;
  totalGlobalMark: number;
  totalFinalMark: number;
}

export class ReportsService {
  async getStudentSummary(activityId: string, studentId: string): Promise<StudentSummary> {
    if (!isValidObjectId(activityId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    // Get student info
    const student = await Student.findById(studentId);
    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    // Get all groups in this activity
    const groups = await Group.find({ activityId });
    const groupIds = groups.map((g) => g._id);

    // Get all sessions for these groups, sorted by date
    const sessions = await Session.find({
      groupId: { $in: groupIds },
    }).sort({ sessionDate: 1 });

    // Calculate attendance and session marks, and collect attendance details
    let totalSessions = 0;
    let sessionsPresent = 0;
    let sessionsAbsent = 0;
    let totalSessionMark = 0;
    const attendanceDetails: AttendanceDetail[] = [];

    for (const session of sessions) {
      const studentEntry = session.students.find(
        (s) => s.studentId.toString() === studentId.toString()
      );

      if (studentEntry) {
        totalSessions++;
        if (studentEntry.present) {
          sessionsPresent++;
        } else {
          sessionsAbsent++;
        }
        totalSessionMark += studentEntry.totalSessionMark;

        // Add attendance detail
        attendanceDetails.push({
          date: session.sessionDate.toISOString(),
          present: studentEntry.present,
          sessionMark: studentEntry.totalSessionMark,
        });
      }
    }

    const attendanceRate = totalSessions > 0 ? (sessionsPresent / totalSessions) * 100 : 0;

    // Get global grades
    const globalGrade = await GlobalGrade.findOne({ activityId, studentId });
    const totalGlobalMark = globalGrade?.totalGlobalMark || 0;
    const totalFinalMark = globalGrade?.totalFinalMark || totalSessionMark;

    // Get global grades summary
    const globalGradesSummary: GlobalGradeSummary[] = globalGrade?.grades.map((grade) => ({
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
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalSessionMark,
      totalGlobalMark,
      totalFinalMark,
      attendanceDetails,
      globalGradesSummary,
    };
  }

  async getGroupPerformance(groupId: string): Promise<GroupPerformance[]> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    // Get group
    const group = await Group.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    // Get enrolled students
    const enrollments = await GroupStudent.find({ groupId }).populate('studentId');

    // Get all sessions for this group
    const sessions = await Session.find({ groupId });

    // Build performance data for each student
    const performance: GroupPerformance[] = [];

    for (const enrollment of enrollments) {
      const student = enrollment.studentId as any;
      const studentId = student._id.toString();

      let totalSessions = 0;
      let sessionsPresent = 0;
      let totalSessionMark = 0;

      for (const session of sessions) {
        const studentEntry = session.students.find(
          (s) => s.studentId.toString() === studentId
        );

        if (studentEntry) {
          totalSessions++;
          if (studentEntry.present) {
            sessionsPresent++;
          }
          totalSessionMark += studentEntry.totalSessionMark;
        }
      }

      // Get global grades for this student in this activity
      const globalGrade = await GlobalGrade.findOne({
        activityId: group.activityId,
        studentId,
      });
      const totalGlobalMark = globalGrade?.totalGlobalMark || 0;
      const totalFinalMark = globalGrade?.totalFinalMark || totalSessionMark;

      performance.push({
        studentId,
        studentName: student.name,
        totalSessions,
        sessionsPresent,
        totalSessionMark,
        totalGlobalMark,
        totalFinalMark,
      });
    }

    // Sort by total final mark descending
    performance.sort((a, b) => b.totalFinalMark - a.totalFinalMark);

    return performance;
  }
}

export const reportsService = new ReportsService();





