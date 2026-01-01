import { GlobalGrade, IGlobalGrade, IGlobalGradeEntry } from './globalGrade.model';
import { Activity } from '../activities/activity.model';
import { Session } from '../sessions/session.model';
import { Group } from '../groups/group.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';
import { calculateGlobalTotal, validateGlobalGrades } from '../../utils/gradeCalc';

export interface UpsertGlobalGradeDTO {
  grades: IGlobalGradeEntry[];
}

export class GlobalGradeService {
  async upsertGlobalGrade(
    activityId: string,
    studentId: string,
    userId: string,
    dto: UpsertGlobalGradeDTO
  ): Promise<IGlobalGrade> {
    if (!isValidObjectId(activityId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    // Get activity for validation
    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    // Validate global grades
    const validation = validateGlobalGrades(activity, dto.grades);
    if (!validation.valid) {
      throw new HttpError(400, validation.errors.join(', '));
    }

    // Calculate total global mark
    const totalGlobalMark = calculateGlobalTotal(dto.grades);

    // Calculate total session mark from all sessions in this activity
    const totalSessionMark = await this.calculateStudentSessionTotal(activityId, studentId);

    // Calculate final total
    const totalFinalMark = totalGlobalMark + totalSessionMark;

    // Upsert global grade
    const globalGrade = await GlobalGrade.findOneAndUpdate(
      { activityId, studentId },
      {
        $set: {
          grades: dto.grades,
          totalGlobalMark,
          totalSessionMark,
          totalFinalMark,
          recordedByUserId: userId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return globalGrade;
  }

  async getGlobalGrade(activityId: string, studentId: string): Promise<IGlobalGrade | null> {
    if (!isValidObjectId(activityId) || !isValidObjectId(studentId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    // Calculate current session total
    const totalSessionMark = await this.calculateStudentSessionTotal(activityId, studentId);

    const globalGrade = await GlobalGrade.findOne({ activityId, studentId });

    if (globalGrade) {
      // Update session total and final mark if they've changed
      if (globalGrade.totalSessionMark !== totalSessionMark) {
        globalGrade.totalSessionMark = totalSessionMark;
        globalGrade.totalFinalMark = globalGrade.totalGlobalMark + totalSessionMark;
        await globalGrade.save();
      }
    }

    return globalGrade;
  }

  async calculateStudentSessionTotal(activityId: string, studentId: string): Promise<number> {
    // Find all groups in this activity
    const groups = await Group.find({ activityId });
    const groupIds = groups.map((g) => g._id);

    // Find all sessions for these groups
    const sessions = await Session.find({
      groupId: { $in: groupIds },
    });

    // Sum up totalSessionMark for this student across all sessions
    let total = 0;
    for (const session of sessions) {
      const studentEntry = session.students.find(
        (s) => s.studentId.toString() === studentId.toString()
      );
      if (studentEntry) {
        total += studentEntry.totalSessionMark;
      }
    }

    return total;
  }
}

export const globalGradeService = new GlobalGradeService();

