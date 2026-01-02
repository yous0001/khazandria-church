import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authService } from './auth.service';
import { HttpError } from '../../utils/httpError';

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      throw new HttpError(400, 'Email/phone and password are required');
    }

    const result = await authService.login({ emailOrPhone, password });

    res.json({
      success: true,
      data: result,
    });
  });
}

export const authController = new AuthController();




