import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { UserRole } from '@triveni/shared-types';

export function signAccessToken(userId: string, role: UserRole): string {
  const { JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN } = getEnv();
  const expiresStr = JWT_ACCESS_EXPIRES_IN || '15m';
  const expiresIn = expiresStr.endsWith('m') ? parseInt(expiresStr) * 60 : 900;
  return jwt.sign({ sub: userId, role }, JWT_ACCESS_SECRET, {
    expiresIn,
  });
}

export function signRefreshToken(userId: string, role: UserRole): string {
  const { JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = getEnv();
  const expiresStr = JWT_REFRESH_EXPIRES_IN || '30d';
  const days = parseInt(expiresStr) || 30;
  const expiresIn = days * 24 * 60 * 60;
  return jwt.sign({ sub: userId, role }, JWT_REFRESH_SECRET, {
    expiresIn,
  });
}

export function verifyRefreshToken(token: string): { sub: string; role: UserRole } {
  const { JWT_REFRESH_SECRET } = getEnv();
  return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string; role: UserRole };
}
