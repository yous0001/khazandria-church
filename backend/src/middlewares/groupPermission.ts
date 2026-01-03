import { Request, Response, NextFunction } from "express";
import { Group } from "../modules/groups/group.model";
import { checkActivityPermission } from "./activityPermission";
import { HttpError } from "../utils/httpError";
import { isValidObjectId } from "../utils/objectId";

/**
 * Middleware to check group access by verifying activity membership
 * First fetches the group, then checks activity permission
 */
export const checkGroupPermission = (
  requiredRole: "member" | "head" = "member",
  groupIdParam: string = "groupId"
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const groupId = req.params[groupIdParam];

      if (!groupId) {
        throw new HttpError(400, "Group ID is required");
      }

      if (!isValidObjectId(groupId)) {
        throw new HttpError(400, "Invalid group ID");
      }

      // Fetch the group to get its activityId
      const group = await Group.findById(groupId);
      if (!group) {
        throw new HttpError(404, "Group not found");
      }

      // Temporarily set activityId in params to use checkActivityPermission
      const originalActivityId = req.params.activityId;
      req.params.activityId = group.activityId.toString();

      // Use the existing activity permission middleware
      const activityPermissionMiddleware = checkActivityPermission(
        "params",
        requiredRole,
        "activityId"
      );

      // Call the middleware
      await activityPermissionMiddleware(req, res, () => {
        // Restore original activityId if it existed
        if (originalActivityId) {
          req.params.activityId = originalActivityId;
        } else {
          delete req.params.activityId;
        }
        // Attach group to request for later use
        (req as any).group = group;
        next();
      });
    } catch (error) {
      next(error);
    }
  };
};

