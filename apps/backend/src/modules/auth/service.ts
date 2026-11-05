import { prisma } from '../../config/prisma';
import { getEnv } from '../../config/env';
import { UserRole } from '@triveni/shared-types';
import { sendSmsOtp } from '../../services/msg91';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { checkPhoneOtpLimit } from '../../middleware/rateLimiter';
import crypto from 'crypto';

export class AuthService {
  /**
   * Generates a 6-digit OTP, stores it in OtpChallenge, and sends it via MSG91
   */
  static async requestOtp(phone: string, role: UserRole, isSignup?: boolean): Promise<void> {
    const { OTP_EXPIRY_MINUTES } = getEnv();

    // Check rate limit per phone number to prevent SMS bombing / balance drainage
    await checkPhoneOtpLimit(phone);
    
    // Check if user exists based on role & intent
    if (role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { phone } });
      if (isSignup && vendor) {
        throw { statusCode: 400, code: 'ALREADY_EXISTS', message: 'A partner account with this phone number already exists. Please sign in.' };
      }
      if (!isSignup) {
        if (!vendor) {
          throw { statusCode: 404, code: 'NOT_FOUND', message: 'No partner account found for this phone number. Please register first.' };
        }
        if (vendor.status !== 'active') {
          throw { statusCode: 403, code: 'INACTIVE', message: 'Your partner account is pending approval or inactive.' };
        }
      }
    } else if (role === 'admin') {
      let admin = await prisma.adminUser.findUnique({ where: { phone } });
      // In development, auto-seed admin if trying to log in with ADMIN_PHONE
      if (!admin && process.env.NODE_ENV !== 'production') {
        const { ADMIN_PHONE } = getEnv();
        if (phone === ADMIN_PHONE || phone === '9999999999') {
          admin = await prisma.adminUser.create({
            data: { phone, name: 'Triveni Admin' },
          });
        }
      }
      if (!admin) {
        throw { statusCode: 404, code: 'NOT_FOUND', message: 'Admin account not found for this phone number.' };
      }
    }

    // Cryptographically secure 6-digit OTP code (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const otpHash = crypto.createHash('sha256').update(code).digest('hex');

    // Create a new OTP challenge
    await prisma.otpChallenge.create({
      data: {
        phone,
        otpHash,
        expiresAt,
        attempts: 0,
        purpose: isSignup ? 'signup' : 'login',
      },
    });

    await sendSmsOtp(phone, code);
  }

  /**
   * Verifies the OTP, creates user if customer/signup, issues JWTs and Session
   */
  static async verifyOtp(
    phone: string,
    role: UserRole,
    code: string,
    name?: string,
    isSignup?: boolean
  ) {
    const { OTP_MAX_ATTEMPTS } = getEnv();
    
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'OTP not requested or already used' };
    }

    if (challenge.expiresAt < new Date()) {
      throw { statusCode: 400, code: 'EXPIRED_OTP', message: 'OTP has expired. Please request a new one.' };
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw { statusCode: 400, code: 'MAX_ATTEMPTS', message: 'Too many failed attempts. Request a new OTP.' };
    }

    const isDevBypass = process.env.NODE_ENV !== 'production' && code === '123456';
    if (!isDevBypass) {
      const inputHash = crypto.createHash('sha256').update(code).digest('hex');

      // Timing-safe comparison to prevent timing attacks
      const storedHashBuf = Buffer.from(challenge.otpHash, 'hex');
      const inputHashBuf = Buffer.from(inputHash, 'hex');
      const isMatch = storedHashBuf.length === inputHashBuf.length && crypto.timingSafeEqual(storedHashBuf, inputHashBuf);

      if (!isMatch) {
        await prisma.otpChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        throw { statusCode: 400, code: 'INVALID_OTP', message: 'Incorrect OTP. Please try again.' };
      }
    }

    // OTP is valid. Mark verified.
    await prisma.otpChallenge.update({ 
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });

    // Fetch or create user
    let userId: string;
    let userName: string;
    
    if (role === 'customer') {
      const customer = await prisma.customer.upsert({
        where: { phone },
        create: { phone, name: name || 'Valued Customer' },
        update: name ? { name } : {},
      });
      userId = customer.id;
      userName = customer.name;
    } else if (role === 'vendor') {
      if (isSignup) {
        const vendor = await prisma.vendor.upsert({
          where: { phone },
          create: {
            phone,
            name: name || 'Driver Partner',
            status: 'active',
            serviceAreas: [],
          },
          update: name ? { name } : {},
        });
        userId = vendor.id;
        userName = vendor.name;
      } else {
        const vendor = await prisma.vendor.findUnique({ where: { phone } });
        if (!vendor) throw { statusCode: 404, message: 'Vendor not found' };
        if (vendor.status !== 'active') throw { statusCode: 403, message: 'Vendor account inactive' };
        userId = vendor.id;
        userName = vendor.name;
      }
    } else {
      let admin = await prisma.adminUser.findUnique({ where: { phone } });
      if (!admin && process.env.NODE_ENV !== 'production') {
        admin = await prisma.adminUser.create({
          data: { phone, name: name || 'Triveni Admin' },
        });
      }
      if (!admin) throw { statusCode: 404, message: 'Admin not found' };
      userId = admin.id;
      userName = admin.name;
    }

    return this.issueTokens(userId, role, userName, phone);
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
  private static async issueTokens(userId: string, role: UserRole, name?: string, phone?: string) {
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

    return {
      accessToken,
      refreshToken,
      userId,
      user: {
        id: userId,
        role,
        name: name || (role === 'admin' ? 'Admin' : role === 'vendor' ? 'Partner' : 'Customer'),
        phone: phone || '',
      },
    };
  }
}
