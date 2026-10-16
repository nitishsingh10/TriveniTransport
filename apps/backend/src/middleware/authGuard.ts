import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@triveni/shared-types';
import { verifyAccessToken } from '../utils/jwt';

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
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authentication token' } });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    next();
  } catch (e) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token expired or invalid' } });
  }
}
