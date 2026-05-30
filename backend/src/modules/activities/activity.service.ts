import { Activity, IActivity, IGradeType } from './activity.model';
import { ActivityMembership } from '../activityMemberships/activityMembership.model';
import { Group } from '../groups/group.model';
import { Session } from '../sessions/session.model';
import { GroupStudent } from '../enrollments/groupStudent.model';
import { GlobalGrade } from '../globalGrades/globalGrade.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';
import { calculateGlobalTotal } from '../../utils/gradeCalc';
import mongoose from 'mongoose';

export interface CreateActivityDTO {
  name: string;
  headAdminId: string;
  sessionBonusMax?: number;
  globalGrades?: { name: string; fullMark: number }[];
}

export interface UpdateActivityDTO {
  name?: string;
  sessionBonusMax?: number;
  globalGrades?: { name: string; fullMark: number }[];
}

export class ActivityService {
  async createActivity(dto: CreateActivityDTO): Promise<IActivity> {
    if (!isValidObjectId(dto.headAdminId)) {
      throw new HttpError(400, 'Invalid head admin ID');
    }

    // Create activity
    const activity = await Activity.create({
      name: dto.name,
      headAdminId: dto.headAdminId,
      sessionBonusMax: Math.min(dto.sessionBonusMax ?? 5, 5),
      globalGrades: dto.globalGrades ?? [],
    });

    // Create membership for head admin
    await ActivityMembership.create({
      activityId: activity._id,
      userId: dto.headAdminId,
      roleInActivity: 'head',
    });

    return activity;
  }

  async getActivitiesForUser(userId: string, role: string): Promise<IActivity[]> {
    if (role === 'superadmin') {
      return Activity.find().sort({ createdAt: -1 });
    }

    // Get activities where user has membership
    const memberships = await ActivityMembership.find({ userId });
    const activityIds = memberships.map((m) => m.activityId);

    return Activity.find({ _id: { $in: activityIds } }).sort({ createdAt: -1 });
  }

  async getActivityById(activityId: string): Promise<IActivity> {
    if (!isValidObjectId(activityId)) {
      throw new HttpError(400, 'Invalid activity ID');
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    return activity;
  }

  async updateActivity(activityId: string, dto: UpdateActivityDTO): Promise<IActivity> {
    if (!isValidObjectId(activityId)) {
      throw new HttpError(400, 'Invalid activity ID');
    }

    const existing = await Activity.findById(activityId);
    if (!existing) {
      throw new HttpError(404, 'Activity not found');
    }

    if (dto.globalGrades !== undefined) {
      this.validateGlobalGradesConfig(dto.globalGrades);
      await this.syncStudentGlobalGrades(
        activityId,
        existing.globalGrades,
        dto.globalGrades
      );
    }

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      { $set: dto },
      { new: true, runValidators: true }
    );

    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    return activity;
  }

  private validateGlobalGradesConfig(globalGrades: IGradeType[]): void {
    const names = new Set<string>();

    for (const grade of globalGrades) {
      const trimmed = grade.name.trim();
      if (!trimmed) {
        throw new HttpError(400, 'Exam name is required');
      }
      if (names.has(trimmed)) {
        throw new HttpError(400, `Duplicate exam name: ${trimmed}`);
      }
      names.add(trimmed);
    }
  }

  private async syncStudentGlobalGrades(
    activityId: string,
    oldGrades: IGradeType[],
    newGrades: IGradeType[]
  ): Promise<void> {
    const newNames = new Set(newGrades.map((g) => g.name));

    for (const oldGrade of oldGrades) {
      if (!newNames.has(oldGrade.name)) {
        const hasTakenMarks = await GlobalGrade.findOne({
          activityId,
          grades: {
            $elemMatch: {
              gradeName: oldGrade.name,
              status: 'taken',
            },
          },
        });

        if (hasTakenMarks) {
          throw new HttpError(
            400,
            `Cannot remove exam "${oldGrade.name}" because students already have marks recorded`
          );
        }
      }
    }

    const globalGradeDocs = await GlobalGrade.find({ activityId });

    for (const doc of globalGradeDocs) {
      const existingMap = new Map(
        doc.grades.map((grade) => [grade.gradeName, grade])
      );

      const updatedGrades = newGrades.map((gradeType) => {
        const existing = existingMap.get(gradeType.name);
        if (existing) {
          return {
            gradeName: gradeType.name,
            mark: existing.mark,
            fullMark: gradeType.fullMark,
            status: existing.status,
          };
        }

        return {
          gradeName: gradeType.name,
          mark: 0,
          fullMark: gradeType.fullMark,
          status: 'not_taken' as const,
        };
      });

      const takenGrades = updatedGrades.filter((g) => g.status === 'taken');
      doc.grades = updatedGrades;
      doc.totalGlobalMark = calculateGlobalTotal(takenGrades);
      doc.totalFinalMark = doc.totalGlobalMark + doc.totalSessionMark;
      await doc.save();
    }
  }

  async updateHeadAdmin(activityId: string, newHeadAdminId: string): Promise<IActivity> {
    if (!isValidObjectId(activityId) || !isValidObjectId(newHeadAdminId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const activity = await Activity.findById(activityId).session(session);
      if (!activity) {
        throw new HttpError(404, 'Activity not found');
      }

      const oldHeadAdminId = activity.headAdminId;

      // Update activity head
      activity.headAdminId = new mongoose.Types.ObjectId(newHeadAdminId);
      await activity.save({ session });

      // Update old head to admin (if different)
      if (oldHeadAdminId.toString() !== newHeadAdminId) {
        await ActivityMembership.findOneAndUpdate(
          { activityId, userId: oldHeadAdminId },
          { roleInActivity: 'admin' },
          { session }
        );
      }

      // Ensure new head has membership
      await ActivityMembership.findOneAndUpdate(
        { activityId, userId: newHeadAdminId },
        { roleInActivity: 'head' },
        { upsert: true, session }
      );

      await session.commitTransaction();
      return activity;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteActivity(activityId: string): Promise<void> {
    if (!isValidObjectId(activityId)) {
      throw new HttpError(400, 'Invalid activity ID');
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw new HttpError(404, 'Activity not found');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find all groups in this activity
      const groups = await Group.find({ activityId }).session(session);
      const groupIds = groups.map((g) => g._id);

      // Delete all sessions for these groups
      await Session.deleteMany({ groupId: { $in: groupIds } }).session(session);

      // Delete all group-student enrollments
      await GroupStudent.deleteMany({ activityId }).session(session);

      // Delete all groups
      await Group.deleteMany({ activityId }).session(session);

      // Delete all global grades for this activity
      await GlobalGrade.deleteMany({ activityId }).session(session);

      // Delete all memberships
      await ActivityMembership.deleteMany({ activityId }).session(session);

      // Delete the activity
      await Activity.findByIdAndDelete(activityId).session(session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const activityService = new ActivityService();



