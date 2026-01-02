import { ActivityMembership, IActivityMembership } from './activityMembership.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';

export interface AddAdminDTO {
  userId: string;
}

export class ActivityMembershipService {
  async addAdmin(activityId: string, userId: string): Promise<IActivityMembership> {
    if (!isValidObjectId(activityId) || !isValidObjectId(userId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    // Check if membership already exists
    const existing = await ActivityMembership.findOne({ activityId, userId });
    if (existing) {
      throw new HttpError(409, 'User is already a member of this activity');
    }

    const membership = await ActivityMembership.create({
      activityId,
      userId,
      roleInActivity: 'admin',
    });

    return membership;
  }

  async removeAdmin(activityId: string, userId: string): Promise<void> {
    if (!isValidObjectId(activityId) || !isValidObjectId(userId)) {
      throw new HttpError(400, 'Invalid ID');
    }

    const membership = await ActivityMembership.findOne({ activityId, userId });
    if (!membership) {
      throw new HttpError(404, 'Membership not found');
    }

    // Cannot remove head admin via this endpoint
    if (membership.roleInActivity === 'head') {
      throw new HttpError(400, 'Cannot remove head admin. Change head admin first.');
    }

    await ActivityMembership.deleteOne({ _id: membership._id });
  }

  async getActivityAdmins(activityId: string): Promise<IActivityMembership[]> {
    if (!isValidObjectId(activityId)) {
      throw new HttpError(400, 'Invalid activity ID');
    }

    return ActivityMembership.find({ activityId })
      .populate('userId', 'name email phone role')
      .sort({ roleInActivity: 1, createdAt: 1 });
  }
}

export const activityMembershipService = new ActivityMembershipService();




