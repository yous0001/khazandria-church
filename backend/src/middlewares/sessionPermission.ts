import { Request, Response, NextFunction } from "express";
import { Session } from "../modules/sessions/session.model";
import { Group } from "../modules/groups/group.model";
import { ActivityMembership } from "../modules/activityMemberships/activityMembership.model";
import { HttpError } from "../utils/httpError";
import { isValidObjectId } from "../utils/objectId";

export const checkSessionPermission = (
  requiredRole: "member" | "head" = "member",
  sessionIdParam: string = "sessionId"
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new HttpError(401, "Authentication required");
      }

      const sessionId = req.params[sessionIdParam];
      if (!sessionId) {
        throw new HttpError(400, "Session ID is required");
      }
      if (!isValidObjectId(sessionId)) {
        throw new HttpError(400, "Invalid session ID");
      }

      const session = await Session.findById(sessionId).select("groupId");
      if (!session) {
        throw new HttpError(404, "Session not found");
      }

      const group = await Group.findById(session.groupId);
      if (!group) {
        throw new HttpError(404, "Group not found");
      }

      const activityId = group.activityId.toString();

      if (req.user.role !== "superadmin") {
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

        if (requiredRole === "head" && membership.roleInActivity !== "head") {
          throw new HttpError(403, "Access denied: head admin role required");
        }

        req.membership = {
          activityId,
          userId: membership.userId.toString(),
          roleInActivity: membership.roleInActivity,
        };
      }

      req.activityId = activityId;
      (req as Request & { group?: typeof group }).group = group;
      next();
    } catch (error) {
      next(error);
    }
  };
};
