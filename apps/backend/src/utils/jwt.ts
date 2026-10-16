import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { UserRole } from '@triveni/shared-types';

export function signAccessToken(userId: string, role: UserRole): string {
  const { JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN } = getEnv();
  return jwt.sign({ sub: userId, role }, JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: (JWT_ACCESS_EXPIRES_IN || '15m') as any,
  });
}

export function signRefreshToken(userId: string, role: UserRole): string {
  const { JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = getEnv();
  return jwt.sign({ sub: userId, role }, JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: (JWT_REFRESH_EXPIRES_IN || '30d') as any,
  });
}

export function verifyAccessToken(token: string): { sub: string; role: UserRole } {
  const { JWT_ACCESS_SECRET } = getEnv();
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
  }) as { sub: string; role: UserRole };
}

export function verifyRefreshToken(token: string): { sub: string; role: UserRole } {
  const { JWT_REFRESH_SECRET } = getEnv();
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    algorithms: ['HS256'],
  }) as { sub: string; role: UserRole };
}
