import { Request, Response, NextFunction } from "express";
import { ActivityMembership } from "../modules/activityMemberships/activityMembership.model";
import { HttpError } from "../utils/httpError";
import { isValidObjectId } from "../utils/objectId";
import type {
  ActivityIdSource,
  RequiredActivityRole,
} from "../types/permissions";

export const checkActivityPermission = (
  activityIdSource: ActivityIdSource = "params",
  requiredRole: RequiredActivityRole = "member",
  activityIdField: string = "activityId"
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Must be authenticated
      if (!req.user) {
        throw new HttpError(401, "Authentication required");
      }

      // Superadmin bypasses all checks
      if (req.user.role === "superadmin") {
        next();
        return;
      }

      // Extract activityId from request
      let activityId: string | undefined;
      switch (activityIdSource) {
        case "params":
          activityId = req.params[activityIdField];
          break;
        case "body":
          activityId = req.body[activityIdField];
          break;
        case "query":
          activityId = req.query[activityIdField] as string;
          break;
      }

      if (!activityId) {
        throw new HttpError(
          400,
          `Activity ID (${activityIdField}) is required`
        );
      }

      if (!isValidObjectId(activityId)) {
        throw new HttpError(400, `Invalid activity ID: ${activityId}`);
      }

      // Load membership
      const membership = await ActivityMembership.findOne({
        activityId,
        userId: req.user.userId,
      });

      if (!membership) {
        throw new HttpError(
          403,
          "Access denied: not a member of this activity"
        );
      }

      // Check role requirement
      if (requiredRole === "head" && membership.roleInActivity !== "head") {
        throw new HttpError(403, "Access denied: head admin role required");
      }

      // Attach to request for later use
      req.activityId = activityId;
      req.membership = {
        activityId: membership.activityId.toString(),
        userId: membership.userId.toString(),
        roleInActivity: membership.roleInActivity,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
