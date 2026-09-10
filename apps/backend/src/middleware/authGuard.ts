import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { UserRole } from '@triveni/shared-types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const { JWT_ACCESS_SECRET } = getEnv();
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { sub: string; role: UserRole };
    
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    next();
  } catch (e) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token expired or invalid' } });
  }
}
