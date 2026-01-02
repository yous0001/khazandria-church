import { User, IUser } from "./user.model";
import { authService } from "../auth/auth.service";
import { HttpError } from "../../utils/httpError";
import { isValidObjectId } from "../../utils/objectId";

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
}

export const userService = new UserService();
