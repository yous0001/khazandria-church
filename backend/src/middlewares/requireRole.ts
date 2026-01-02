import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import type { UserRole } from "../constants/roles";

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "Insufficient permissions");
    }

    next();
  };
};

export const requireSuperAdmin = requireRole("superadmin");
