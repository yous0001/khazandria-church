import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { activityService } from "./activity.service";
import { HttpError } from "../../utils/httpError";

export class ActivityController {
  createActivity = asyncHandler(async (req: Request, res: Response) => {
    const { name, headAdminId, sessionBonusMax, sessionGrades, globalGrades } =
      req.body;

    if (!name || !headAdminId) {
      throw new HttpError(400, "Name and headAdminId are required");
    }

    const activity = await activityService.createActivity({
      name,
      headAdminId,
      sessionBonusMax,
      sessionGrades,
      globalGrades,
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  });

  getActivities = asyncHandler(async (req: Request, res: Response) => {
    const activities = await activityService.getActivitiesForUser(
      req.user!.userId,
      req.user!.role
    );

    res.json({
      success: true,
      data: activities,
    });
  });

  getActivityById = asyncHandler(async (req: Request, res: Response) => {
    const activity = await activityService.getActivityById(
      req.params.activityId
    );

    res.json({
      success: true,
      data: activity,
    });
  });

  updateActivity = asyncHandler(async (req: Request, res: Response) => {
    const { name, sessionBonusMax, sessionGrades, globalGrades } = req.body;

    const activity = await activityService.updateActivity(
      req.params.activityId,
      {
        name,
        sessionBonusMax,
        sessionGrades,
        globalGrades,
      }
    );

    res.json({
      success: true,
      data: activity,
    });
  });

  updateHeadAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { headAdminId } = req.body;

    if (!headAdminId) {
      throw new HttpError(400, "headAdminId is required");
    }

    const activity = await activityService.updateHeadAdmin(
      req.params.activityId,
      headAdminId
    );

    res.json({
      success: true,
      data: activity,
    });
  });
}

export const activityController = new ActivityController();
