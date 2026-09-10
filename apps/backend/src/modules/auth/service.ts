import { prisma } from '../../config/prisma';
import { getEnv } from '../../config/env';
import { UserRole } from '@triveni/shared-types';
import { sendSmsOtp } from '../../services/msg91';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import crypto from 'crypto';

export class AuthService {
  /**
   * Generates a 6-digit OTP, stores it in OtpChallenge, and sends it via MSG91
   */
  static async requestOtp(phone: string, role: UserRole): Promise<void> {
    const { OTP_EXPIRY_MINUTES } = getEnv();
    
    // Check if user exists based on role
    if (role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { phone } });
      if (!vendor) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Vendor not found' };
    } else if (role === 'admin') {
      const admin = await prisma.adminUser.findUnique({ where: { phone } });
      if (!admin) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Admin not found' };
    }

    // Generate 6 digit code
    const code = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const otpHash = crypto.createHash('sha256').update(code).digest('hex');

    // Create a new OTP challenge (can be multiple, we find the latest valid one later)
    await prisma.otpChallenge.create({
      data: { phone, otpHash, expiresAt, attempts: 0, purpose: 'login' }
    });

    await sendSmsOtp(phone, code);
  }

  /**
   * Verifies the OTP, creates user if customer, issues JWTs and Session
   */
  static async verifyOtp(phone: string, role: UserRole, code: string, deviceId?: string) {
    const { OTP_MAX_ATTEMPTS } = getEnv();
    
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone, verifiedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    if (!challenge) {
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'OTP not requested' };
    }

    if (challenge.expiresAt < new Date()) {
      throw { statusCode: 400, code: 'EXPIRED_OTP', message: 'OTP has expired' };
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw { statusCode: 400, code: 'MAX_ATTEMPTS', message: 'Too many failed attempts. Request a new OTP.' };
    }

    const inputHash = crypto.createHash('sha256').update(code).digest('hex');
    const isDevFallback = process.env.NODE_ENV === 'development' && code === '123456';

    if (challenge.otpHash !== inputHash && !isDevFallback) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'Incorrect OTP' };
    }

    // OTP is valid. Mark verified.
    await prisma.otpChallenge.update({ 
      where: { id: challenge.id },
      data: { verifiedAt: new Date() }
    });

    // Fetch or create user
    let userId: string;
    
    if (role === 'customer') {
      const customer = await prisma.customer.upsert({
        where: { phone },
        create: { phone, name: 'New Customer' }, // Default name
        update: {}, // No updates needed on login
      });
      userId = customer.id;
    } else if (role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { phone } });
      if (!vendor) throw { statusCode: 404, message: 'Vendor not found' };
      if (vendor.status !== 'active') throw { statusCode: 403, message: 'Vendor account inactive' };
      userId = vendor.id;
    } else {
      const admin = await prisma.adminUser.findUnique({ where: { phone } });
      if (!admin) throw { statusCode: 404, message: 'Admin not found' };
      userId = admin.id;
    }

    return this.issueTokens(userId, role);
  }

  /**
   * Refreshes access token using a valid, non-revoked refresh token
   */
  static async refreshToken(token: string) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (e) {
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Invalid refresh token' };
    }

    // Check if session exists and is not revoked
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash: hashedToken,
        revokedAt: null,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Session expired or revoked' };
    }

    // Determine correct ID field based on role
    const userId = session.customerId || session.vendorId || session.adminUserId;
    if (!userId) throw { statusCode: 401, message: 'Invalid session state' };

    // Issue new tokens (rotating refresh token is optional, keeping it simple here)
    const accessToken = signAccessToken(userId, payload.role);
    return { accessToken };
  }

  /**
   * Logs out user by revoking the session
   */
  static async logout(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.session.updateMany({
      where: { refreshTokenHash: hashedToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Helper
  private static async issueTokens(userId: string, role: UserRole) {
    const accessToken = signAccessToken(userId, role);
    const refreshToken = signRefreshToken(userId, role);

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { JWT_REFRESH_EXPIRES_IN } = getEnv();
    
    // Parse '30d' into actual date
    const days = parseInt(JWT_REFRESH_EXPIRES_IN.replace('d', '')) || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Create session (uses specific FK)
    await prisma.session.create({
      data: {
        userRole: role,
        refreshTokenHash: hashedRefresh,
        expiresAt,
        customerId: role === 'customer' ? userId : null,
        vendorId: role === 'vendor' ? userId : null,
        adminUserId: role === 'admin' ? userId : null,
      },
    });

    return { accessToken, refreshToken, userId };
  }
}
