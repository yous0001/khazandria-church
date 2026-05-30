import mongoose from "mongoose";
import { GroupStudent } from "./groupStudent.model";
import {
  GroupEnrollmentHistory,
  IGroupEnrollmentHistory,
} from "./groupEnrollmentHistory.model";
import { HttpError } from "../../utils/httpError";
import {
  buildGroupMembershipPeriods,
  EnrollmentHistoryRecord,
  GroupMembershipPeriod,
  StudentEnrollmentContext,
  wasMemberAt,
} from "../../utils/attendanceStats";

export async function loadStudentMembershipPeriods(
  activityId: string,
  studentId: string
): Promise<GroupMembershipPeriod[]> {
  const [history, currentEnrollment] = await Promise.all([
    GroupEnrollmentHistory.find({ activityId, studentId }).sort({ startedAt: 1 }),
    GroupStudent.findOne({ activityId, studentId }),
  ]);

  return buildGroupMembershipPeriods(
    history.map(toHistoryRecord),
    currentEnrollment
      ? {
          groupId: currentEnrollment.groupId.toString(),
          createdAt: currentEnrollment.createdAt,
        }
      : null
  );
}

export async function loadStudentMembershipContext(
  activityId: string,
  studentId: string
): Promise<{
  history: EnrollmentHistoryRecord[];
  currentEnrollment: StudentEnrollmentContext | null;
  periods: GroupMembershipPeriod[];
}> {
  const [historyDocs, currentEnrollment] = await Promise.all([
    GroupEnrollmentHistory.find({ activityId, studentId }).sort({ startedAt: 1 }),
    GroupStudent.findOne({ activityId, studentId }),
  ]);

  const history = historyDocs.map(toHistoryRecord);
  const enrollmentContext = currentEnrollment
    ? {
        groupId: currentEnrollment.groupId.toString(),
        createdAt: currentEnrollment.createdAt,
      }
    : null;

  return {
    history,
    currentEnrollment: enrollmentContext,
    periods: buildGroupMembershipPeriods(history, enrollmentContext),
  };
}

export async function assertStudentWasGroupMemberAtSession(
  groupId: string,
  studentId: string,
  sessionDate: Date
): Promise<void> {
  const groupObjectId = new mongoose.Types.ObjectId(groupId);
  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  const current = await GroupStudent.findOne({
    groupId: groupObjectId,
    studentId: studentObjectId,
  });

  const history = await GroupEnrollmentHistory.find({
    groupId: groupObjectId,
    studentId: studentObjectId,
  });

  const allowed = wasMemberAt(
    groupId,
    sessionDate,
    history.map(toHistoryRecord),
    current
      ? {
          groupId: current.groupId.toString(),
          createdAt: current.createdAt,
        }
      : null
  );

  if (!allowed) {
    throw new HttpError(
      400,
      'Student was not a member of this group when the session took place'
    );
  }
}

function toHistoryRecord(record: IGroupEnrollmentHistory): EnrollmentHistoryRecord {
  return {
    groupId: record.groupId.toString(),
    startedAt: record.startedAt,
    endedAt: record.endedAt,
  };
}
