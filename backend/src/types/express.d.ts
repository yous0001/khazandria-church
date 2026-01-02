import type { JwtAuthPayload } from "./auth";
import type { ActivityRole } from "../constants/roles";

declare global {
  namespace Express {
    interface Request {
      user?: JwtAuthPayload;
      activityId?: string;
      membership?: {
        activityId: string;
        userId: string;
        roleInActivity: ActivityRole;
      };
    }
  }
}

export {};
