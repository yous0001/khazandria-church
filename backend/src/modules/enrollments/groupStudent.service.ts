import mongoose from 'mongoose';
import { GroupStudent, IGroupStudent } from './groupStudent.model';
import { GroupEnrollmentHistory } from './groupEnrollmentHistory.model';
import { Group } from '../groups/group.model';
import { Activity } from '../activities/activity.model';
import { Student } from '../students/student.model';
import { SessionAttendance } from '../attendance/sessionAttendance.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';
import { globalGradeService } from '../globalGrades/globalGrade.service';
import { attendanceService } from '../attendance/attendance.service';

export interface EnrollStudentDTO {
  studentId: string;
}

export interface BulkEnrollResult {
  enrolled: string[];
  skipped: Array<{ studentId: string; reason: string }>;
}

export class GroupStudentService {
  private async removeStudentFromGroupSessionsAfter(
    groupId: string,
    studentId: string,
    afterDate: Date
  ): Promise<void> {
    await attendanceService.deleteStudentFromGroupSessionsAfter(
      groupId,
      studentId,
      afterDate
    );
  }

  private async backfillStudentIntoGroupSessions(
    groupId: string,
    activityId: mongoose.Types.ObjectId,
    studentId: string,
    userId: string,
    fromDate: Date
  ): Promise<void> {
    await attendanceService.backfillForStudentInGroup(
      groupId,
      activityId,
      studentId,
      fromDate,
      userId
    );
  }

  private async recordEnrollmentStarted(
    activityId: mongoose.Types.ObjectId,
    groupId: mongoose.Types.ObjectId,
    studentId: string,
    startedAt: Date
  ): Promise<void> {
    await GroupEnrollmentHistory.create({
      activityId,
      groupId,
      studentId,
      startedAt,
      endedAt: null,
    });
  }

  private async recordEnrollmentEnded(
    activityId: mongoose.Types.ObjectId,
    groupId: mongoose.Types.ObjectId,
    studentId: string,
    endedAt: Date
  ): Promise<void> {
    const result = await GroupEnrollmentHistory.updateMany(
      { activityId, groupId, studentId, endedAt: null },
      { endedAt }
    );

    if (result.matchedCount === 0) {
      const enrollment = await GroupStudent.findOne({
        activityId,
        groupId,
        studentId,
      });
      if (enrollment) {
        await GroupEnrollmentHistory.create({
          activityId,
          groupId,
          studentId,
          startedAt: enrollment.createdAt,
          endedAt,
        });
      }
    }
  }

  private formatEnrollError(error: unknown): string {
    if (error instanceof HttpError) {
      return error.message;
    }

    const mongoError = error as { code?: number; message?: string };
    if (mongoError?.code === 11000) {
      const msg = mongoError.message ?? '';
      if (msg.includes('activityId') && msg.includes('studentId')) {
        return 'لا يمكن تسجيل الطالب في مجموعة ثانية: فهرس قاعدة البيانات القديم ما زال نشطاً. أعد تشغيل الخادم لمزامنة الفهارس.';
      }
      return 'الطالب مسجل مسبقاً في هذه المجموعة';
    }

    return 'فشل التسجيل';
  }

  private async assertCanEnroll(
    groupId: string,
    activityId: mongoose.Types.ObjectId,
    allowMultipleGroups: boolean,
    studentId: string
  ): Promise<void> {
    const inThisGroup = await GroupStudent.findOne({ groupId, studentId });
    if (inThisGroup) {
      throw new HttpError(409, 'Student is already enrolled in this group');
    }

    if (!allowMultipleGroups) {
      const inActivity = await GroupStudent.findOne({
        activityId,
        studentId,
      });
      if (inActivity) {
        throw new HttpError(
          409,
          'Student is already enrolled in another group in this activity'
        );
      }
    }
  }

  async enrollStudent(
    groupId: string,
    studentId: string,
    userId: string
  ): Promise<IGroupStudent> {
    if (!isValidObjectId(groupId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const activity = await Activity.findById(group.activityId);
    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new HttpError(404, 'Student not found');
    }

    await this.assertCanEnroll(
      groupId,
      group.activityId,
      activity.allowMultipleGroups === true,
      studentId
    );

    const enrollment = await GroupStudent.create({
      activityId: group.activityId,
      groupId,
      studentId,
    });

    await this.backfillStudentIntoGroupSessions(
      groupId,
      group.activityId,
      studentId,
      userId,
      enrollment.createdAt
    );

    await this.recordEnrollmentStarted(
      group.activityId,
      new mongoose.Types.ObjectId(groupId),
      studentId,
      enrollment.createdAt
    );

    return enrollment;
  }

  async enrollStudents(
    groupId: string,
    studentIds: string[],
    userId: string
  ): Promise<BulkEnrollResult> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new HttpError(400, 'studentIds must be a non-empty array');
    }

    const enrolled: string[] = [];
    const skipped: Array<{ studentId: string; reason: string }> = [];

    for (const studentId of studentIds) {
      if (!isValidObjectId(studentId)) {
        skipped.push({ studentId, reason: 'Invalid student ID' });
        continue;
      }

      try {
        await this.enrollStudent(groupId, studentId, userId);
        enrolled.push(studentId);
      } catch (error) {
        skipped.push({
          studentId,
          reason: this.formatEnrollError(error),
        });
      }
    }

    return { enrolled, skipped };
  }

  async transferStudent(
    fromGroupId: string,
    toGroupId: string,
    studentId: string,
    userId: string
  ): Promise<IGroupStudent> {
    if (
      !isValidObjectId(fromGroupId) ||
      !isValidObjectId(toGroupId) ||
      !isValidObjectId(studentId)
    ) {
      throw new HttpError(400, 'Invalid ID');
    }

    if (fromGroupId === toGroupId) {
      throw new HttpError(400, 'Source and target groups must be different');
    }

    const [fromGroup, toGroup] = await Promise.all([
      Group.findById(fromGroupId),
      Group.findById(toGroupId),
    ]);

    if (!fromGroup) {
      throw new HttpError(404, 'Source group not found');
    }
    if (!toGroup) {
      throw new HttpError(404, 'Target group not found');
    }

    if (fromGroup.activityId.toString() !== toGroup.activityId.toString()) {
      throw new HttpError(400, 'Groups must belong to the same activity');
    }

    const activity = await Activity.findById(fromGroup.activityId);
    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    if (activity.allowMultipleGroups) {
      throw new HttpError(
        400,
        'Student transfer is not available when multiple groups per student are allowed'
      );
    }

    const enrollment = await GroupStudent.findOne({
      groupId: fromGroupId,
      studentId,
    });

    if (!enrollment) {
      throw new HttpError(404, 'Student is not enrolled in the source group');
    }

    const existingInTarget = await GroupStudent.findOne({
      groupId: toGroupId,
      studentId,
    });

    if (existingInTarget) {
      throw new HttpError(409, 'Student is already enrolled in the target group');
    }

    const activityId = fromGroup.activityId.toString();
    const transferDate = new Date();

    const openHistory = await GroupEnrollmentHistory.findOne({
      activityId: enrollment.activityId,
      groupId: fromGroupId,
      studentId,
      endedAt: null,
    });

    if (openHistory) {
      openHistory.endedAt = transferDate;
      await openHistory.save();
    } else {
      await GroupEnrollmentHistory.create({
        activityId: enrollment.activityId,
        groupId: fromGroupId,
        studentId,
        startedAt: enrollment.createdAt,
        endedAt: transferDate,
      });
    }

    await GroupStudent.deleteOne({ _id: enrollment._id });

    await this.removeStudentFromGroupSessionsAfter(
      fromGroupId,
      studentId,
      transferDate
    );

    const newEnrollment = await GroupStudent.create({
      activityId: toGroup.activityId,
      groupId: toGroupId,
      studentId,
    });

    await this.backfillStudentIntoGroupSessions(
      toGroupId,
      toGroup.activityId,
      studentId,
      userId,
      transferDate
    );

    await this.recordEnrollmentStarted(
      toGroup.activityId,
      new mongoose.Types.ObjectId(toGroupId),
      studentId,
      newEnrollment.createdAt
    );

    await globalGradeService.refreshGlobalGradeSessionTotals(
      activityId,
      studentId
    );

    return newEnrollment;
  }

  async getGroupStudents(groupId: string): Promise<IGroupStudent[]> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    return GroupStudent.find({ groupId })
      .populate('studentId', 'name phone email')
      .sort({ createdAt: 1 });
  }

  async getEnrollmentSummary(): Promise<
    Record<
      string,
      Array<{
        groupId: string;
        groupName: string;
        activityId: string;
        activityName: string;
      }>
    >
  > {
    const enrollments = await GroupStudent.find({})
      .populate('groupId', 'name')
      .populate('activityId', 'name');

    const summary: Record<
      string,
      Array<{
        groupId: string;
        groupName: string;
        activityId: string;
        activityName: string;
      }>
    > = {};

    for (const enrollment of enrollments) {
      const studentId = enrollment.studentId.toString();
      const group = enrollment.groupId as unknown as {
        _id: { toString(): string };
        name: string;
      };
      const activity = enrollment.activityId as unknown as {
        _id: { toString(): string };
        name: string;
      };

      if (!summary[studentId]) {
        summary[studentId] = [];
      }

      summary[studentId].push({
        groupId: group._id.toString(),
        groupName: group.name,
        activityId: activity._id.toString(),
        activityName: activity.name,
      });
    }

    return summary;
  }

  async getActivityReportStudents(activityId: string): Promise<
    Array<{ studentId: string; studentName: string }>
  > {
    if (!isValidObjectId(activityId)) {
      throw new HttpError(400, 'Invalid activity ID');
    }

    const enrollments = await GroupStudent.find({
      activityId,
    }).populate('studentId', 'name');

    const attendanceStudentIds = await SessionAttendance.distinct('studentId', {
      activityId,
    });

    const studentMap = new Map<string, string>();

    for (const enrollment of enrollments) {
      const student = enrollment.studentId as unknown as {
        _id: { toString(): string };
        name: string;
      };
      studentMap.set(student._id.toString(), student.name);
    }

    for (const studentId of attendanceStudentIds) {
      const id = studentId.toString();
      if (!studentMap.has(id)) {
        const student = await Student.findById(id).select('name');
        if (student) {
          studentMap.set(id, student.name);
        }
      }
    }

    return Array.from(studentMap.entries())
      .map(([studentId, studentName]) => ({ studentId, studentName }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ar'));
  }

  async removeStudent(groupId: string, studentId: string): Promise<void> {
    if (!isValidObjectId(groupId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    const enrollment = await GroupStudent.findOne({ groupId, studentId });
    if (!enrollment) {
      throw new HttpError(404, 'Student enrollment not found');
    }

    const endedAt = new Date();

    await this.recordEnrollmentEnded(
      enrollment.activityId,
      enrollment.groupId,
      studentId,
      endedAt
    );

    await this.removeStudentFromGroupSessionsAfter(
      groupId,
      studentId,
      endedAt
    );

    await GroupStudent.deleteOne({ _id: enrollment._id });
  }
}

export const groupStudentService = new GroupStudentService();
