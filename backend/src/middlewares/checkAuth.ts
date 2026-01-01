import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';
import type { JwtAuthPayload } from '../types/auth';

export const checkAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as JwtAuthPayload;
      req.user = decoded;
      next();
    } catch (error) {
      throw new HttpError(401, 'Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

