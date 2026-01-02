import { User, IUser } from "./user.model";
import { authService } from "../auth/auth.service";
import { HttpError } from "../../utils/httpError";
import { isValidObjectId } from "../../utils/objectId";
import { ActivityMembership } from "../activityMemberships/activityMembership.model";
import { Activity } from "../activities/activity.model";

export interface CreateUserDTO {
  name: string;
  phone?: string;
  email?: string;
  password: string;
  role: "superadmin" | "admin";
}

export class UserService {
  async createUser(dto: CreateUserDTO): Promise<IUser> {
    const { password, ...userData } = dto;

    // Check if user with same email/phone exists
    if (dto.email) {
      const existing = await User.findOne({ email: dto.email });
      if (existing) {
        throw new HttpError(409, "User with this email already exists");
      }
    }

    if (dto.phone) {
      const existing = await User.findOne({ phone: dto.phone });
      if (existing) {
        throw new HttpError(409, "User with this phone already exists");
      }
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    const user = await User.create({
      ...userData,
      passwordHash,
    });

    return user;
  }

  async getAllUsers(): Promise<IUser[]> {
    return User.find().sort({ createdAt: -1 });
  }

  async getUserById(userId: string): Promise<IUser> {
    if (!isValidObjectId(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  async getCurrentUser(userId: string): Promise<IUser> {
    if (!isValidObjectId(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  async updatePassword(
    userId: string,
    newPassword: string,
    currentPassword?: string
  ): Promise<void> {
    if (!isValidObjectId(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new HttpError(400, "Password must be at least 6 characters");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    // If current password is provided, verify it (for self-update)
    if (currentPassword) {
      const isPasswordValid = await authService.comparePassword(
        currentPassword,
        user.passwordHash
      );
      if (!isPasswordValid) {
        throw new HttpError(401, "Current password is incorrect");
      }
    }

    // Hash and update password
    const passwordHash = await authService.hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await user.save();
  }

  async getUserActivityMemberships(userId: string) {
    if (!isValidObjectId(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    const memberships = await ActivityMembership.find({ userId })
      .populate("activityId", "name")
      .sort({ createdAt: -1 });

    return memberships;
  }

  async addActivityPermission(userId: string, activityId: string, roleInActivity: "head" | "admin" = "admin") {
    if (!isValidObjectId(userId) || !isValidObjectId(activityId)) {
      throw new HttpError(400, "Invalid ID");
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    // Check if activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw new HttpError(404, "Activity not found");
    }

    // Check if membership already exists
    const existing = await ActivityMembership.findOne({ activityId, userId });
    if (existing) {
      throw new HttpError(409, "User already has permission for this activity");
    }

    // Create membership
    const membership = await ActivityMembership.create({
      activityId,
      userId,
      roleInActivity,
    });

    return membership;
  }

  async removeActivityPermission(userId: string, activityId: string) {
    if (!isValidObjectId(userId) || !isValidObjectId(activityId)) {
      throw new HttpError(400, "Invalid ID");
    }

    const membership = await ActivityMembership.findOne({ activityId, userId });
    if (!membership) {
      throw new HttpError(404, "Activity permission not found");
    }

    // Check if user is head admin - if so, prevent removal (must change head first)
    if (membership.roleInActivity === "head") {
      throw new HttpError(400, "Cannot remove head admin. Change head admin first.");
    }

    await ActivityMembership.deleteOne({ _id: membership._id });
  }
}

export const userService = new UserService();
