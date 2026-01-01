import { Activity, IActivity } from './activity.model';
import { ActivityMembership } from '../activityMemberships/activityMembership.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';
import mongoose from 'mongoose';

export interface CreateActivityDTO {
  name: string;
  headAdminId: string;
  sessionFullMark: number;
  sessionBonusMax?: number;
  sessionGrades?: { name: string; fullMark: number }[];
  globalGrades?: { name: string; fullMark: number }[];
}

export interface UpdateActivityDTO {
  name?: string;
  sessionFullMark?: number;
  sessionBonusMax?: number;
  sessionGrades?: { name: string; fullMark: number }[];
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
      sessionFullMark: dto.sessionFullMark,
      sessionBonusMax: dto.sessionBonusMax ?? 5,
      sessionGrades: dto.sessionGrades ?? [],
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
}

export const activityService = new ActivityService();

