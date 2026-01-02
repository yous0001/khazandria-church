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
}

export const userController = new UserController();
