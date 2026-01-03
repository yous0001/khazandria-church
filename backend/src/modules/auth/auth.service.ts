import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { User } from '../users/user.model';
import { env } from '../../config/env';
import { HttpError } from '../../utils/httpError';
import type { UserRole } from '../../constants/roles';

export interface LoginDTO {
  emailOrPhone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
    phone?: string;
  };
}

export class AuthService {
  async login(dto: LoginDTO): Promise<LoginResponse> {
    const { emailOrPhone, password } = dto;

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new HttpError(401, 'Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn } as SignOptions
    );

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.bcryptSaltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const authService = new AuthService();

