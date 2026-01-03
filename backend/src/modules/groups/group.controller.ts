import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { groupService } from './group.service';
import { HttpError } from '../../utils/httpError';

export class GroupController {
  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const { name, labels } = req.body;
    const { activityId } = req.params;

    if (!name) {
      throw new HttpError(400, 'Group name is required');
    }

    const group = await groupService.createGroup({
      activityId,
      name,
      labels,
    });

    res.status(201).json({
      success: true,
      data: group,
    });
  });

  getGroupsByActivity = asyncHandler(async (req: Request, res: Response) => {
    const { activityId } = req.params;
    const labelFilter = req.query.label as string | undefined;

    const groups = await groupService.getGroupsByActivity(activityId, labelFilter);

    res.json({
      success: true,
      data: groups,
    });
  });

  getGroupById = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;

    const group = await groupService.getGroupById(groupId);

    res.json({
      success: true,
      data: group,
    });
  });

  updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const { name, labels } = req.body;
    const { groupId } = req.params;

    const group = await groupService.updateGroup(groupId, {
      name,
      labels,
    });

    res.json({
      success: true,
      data: group,
    });
  });
}

export const groupController = new GroupController();





