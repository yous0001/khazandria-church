import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { activityMembershipService } from './activityMembership.service';
import { HttpError } from '../../utils/httpError';

export class ActivityMembershipController {
  addAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
      throw new HttpError(400, 'userId is required');
    }

    const membership = await activityMembershipService.addAdmin(req.params.activityId, userId);

    res.status(201).json({
      success: true,
      data: membership,
    });
  });

  removeAdmin = asyncHandler(async (req: Request, res: Response) => {
    await activityMembershipService.removeAdmin(req.params.activityId, req.params.userId);

    res.json({
      success: true,
      message: 'Admin removed successfully',
    });
  });

  getActivityAdmins = asyncHandler(async (req: Request, res: Response) => {
    const admins = await activityMembershipService.getActivityAdmins(req.params.activityId);

    res.json({
      success: true,
      data: admins,
    });
  });
}

export const activityMembershipController = new ActivityMembershipController();

