import mongoose from 'mongoose';
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

    // Calculate total global mark (only count taken grades)
    const takenGrades = dto.grades.filter(g => g.status === 'taken');
    const totalGlobalMark = calculateGlobalTotal(takenGrades);

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

    // Get activity to ensure all grade types are included
    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    // Calculate current session total
    const totalSessionMark = await this.calculateStudentSessionTotal(activityId, studentId);

    let globalGrade = await GlobalGrade.findOne({ activityId, studentId });

    // If no global grade exists, create one with all grade types initialized
    if (!globalGrade) {
      const initialGrades: IGlobalGradeEntry[] = activity.globalGrades.map((gradeType) => ({
        gradeName: gradeType.name,
        mark: 0,
        fullMark: gradeType.fullMark,
        status: 'not_taken',
      }));

      // Create with a system user ID (will be updated on first edit)
      // Using a default ObjectId that represents system initialization
      const systemUserId = new mongoose.Types.ObjectId('000000000000000000000000');
      
      globalGrade = await GlobalGrade.create({
        activityId,
        studentId,
        grades: initialGrades,
        totalGlobalMark: 0,
        totalSessionMark,
        totalFinalMark: totalSessionMark,
        recordedByUserId: systemUserId,
      });
    } else {
      // Ensure all grade types from activity are present
      const existingGradeMap = new Map(
        globalGrade.grades.map((g) => [g.gradeName, g])
      );

      // Add missing grade types with default values
      const allGrades: IGlobalGradeEntry[] = activity.globalGrades.map((gradeType) => {
        const existing = existingGradeMap.get(gradeType.name);
        if (existing) {
          return existing;
        }
        return {
          gradeName: gradeType.name,
          mark: 0,
          fullMark: gradeType.fullMark,
          status: 'not_taken',
        };
      });

      // Update if grades changed
      const gradesChanged = JSON.stringify(globalGrade.grades) !== JSON.stringify(allGrades);
      if (gradesChanged) {
        globalGrade.grades = allGrades;
        // Recalculate total (only count taken grades)
        globalGrade.totalGlobalMark = calculateGlobalTotal(globalGrade.grades.filter(g => g.status === 'taken'));
        globalGrade.totalFinalMark = globalGrade.totalGlobalMark + totalSessionMark;
      }

      // Update session total and final mark if they've changed
      if (globalGrade.totalSessionMark !== totalSessionMark) {
        globalGrade.totalSessionMark = totalSessionMark;
        globalGrade.totalFinalMark = globalGrade.totalGlobalMark + totalSessionMark;
      }

      if (gradesChanged || globalGrade.totalSessionMark !== totalSessionMark) {
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





