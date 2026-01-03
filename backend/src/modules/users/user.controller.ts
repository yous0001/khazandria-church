import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { userService } from "./user.service";
import { HttpError } from "../../utils/httpError";

export class UserController {
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, email, password, role } = req.body;

    if (!name || !password || !role) {
      throw new HttpError(400, "Name, password, and role are required");
    }

    if (!["superadmin", "admin"].includes(role)) {
      throw new HttpError(400, "Invalid role");
    }

    const user = await userService.createUser({
      name,
      phone,
      email,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  });

  getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers();

    res.json({
      success: true,
      data: users,
    });
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new HttpError(401, "Authentication required");
    }

    const user = await userService.getCurrentUser(req.user.userId);

    res.json({
      success: true,
      data: user,
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.userId);

    res.json({
      success: true,
      data: user,
    });
  });

  updateOwnPassword = asyncHandler(async (req: Request, res: Response) => {
    const { newPassword, currentPassword } = req.body;

    if (!newPassword) {
      throw new HttpError(400, "New password is required");
    }

    if (!currentPassword) {
      throw new HttpError(400, "Current password is required");
    }

    if (!req.user?.userId) {
      throw new HttpError(401, "Authentication required");
    }

    await userService.updatePassword(
      req.user.userId,
      newPassword,
      currentPassword
    );

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  });

  updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      throw new HttpError(400, "New password is required");
    }

    // Super admin can update any user's password without current password
    await userService.updatePassword(userId, newPassword);

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  });

  getUserActivityMemberships = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const memberships = await userService.getUserActivityMemberships(userId);

    res.json({
      success: true,
      data: memberships,
    });
  });

  addActivityPermission = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { activityId, roleInActivity } = req.body;

    if (!activityId) {
      throw new HttpError(400, "Activity ID is required");
    }

    const membership = await userService.addActivityPermission(
      userId,
      activityId,
      roleInActivity || "admin"
    );

    res.status(201).json({
      success: true,
      data: membership,
      message: "Activity permission added successfully",
    });
  });

  removeActivityPermission = asyncHandler(async (req: Request, res: Response) => {
    const { userId, activityId } = req.params;

    await userService.removeActivityPermission(userId, activityId);

    res.json({
      success: true,
      message: "Activity permission removed successfully",
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Prevent users from deleting themselves
    if (req.user?.userId === userId) {
      throw new HttpError(400, "Cannot delete your own account");
    }

    await userService.deleteUser(userId);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  });
}

export const userController = new UserController();
