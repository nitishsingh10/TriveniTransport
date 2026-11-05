import { prisma } from '../../config/prisma';
import { getEnv } from '../../config/env';
import { UserRole } from '@triveni/shared-types';
import { sendSmsOtp } from '../../services/msg91';
import { EmailService } from '../../services/resend';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { checkIdentifierOtpLimit } from '../../middleware/rateLimiter';
import crypto from 'crypto';

export interface AuthTargetInput {
  identifier?: string;
  phone?: string;
  email?: string;
}

export function resolveAuthTarget(input: AuthTargetInput | string): { type: 'email' | 'phone'; value: string } {
  let raw = '';
  if (typeof input === 'string') {
    raw = input.trim();
  } else {
    raw = (input.email || input.phone || input.identifier || '').trim();
  }

  if (!raw) {
    throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email address or mobile phone number is required.' };
  }

  if (raw.includes('@')) {
    const email = raw.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Please provide a valid email address.' };
    }
    return { type: 'email', value: email };
  } else {
    const cleaned = raw.replace(/[^\d+]/g, '');
    if (cleaned.length < 10) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Please provide a valid 10-15 digit phone number.' };
    }
    return { type: 'phone', value: cleaned };
  }
}

export class AuthService {
  /**
   * Generates a 6-digit OTP, stores it in OtpChallenge, and dispatches via Resend (email) or MSG91 (SMS)
   */
  static async requestOtp(
    targetInput: AuthTargetInput | string,
    role: UserRole,
    isSignup?: boolean
  ): Promise<{ message: string; channel: 'email' | 'sms'; destination: string }> {
    const { OTP_EXPIRY_MINUTES } = getEnv();
    const target = resolveAuthTarget(targetInput);

    // Rate limit per target (phone or email) to prevent abuse
    await checkIdentifierOtpLimit(target.value);

    // Role-specific authorization and existence checks
    if (target.type === 'email') {
      const email = target.value;
      if (role === 'vendor') {
        const vendor = await prisma.vendor.findUnique({ where: { email } });
        if (isSignup && vendor) {
          throw { statusCode: 400, code: 'ALREADY_EXISTS', message: 'A partner account with this email already exists. Please sign in.' };
        }
        if (!isSignup) {
          if (!vendor) {
            throw { statusCode: 404, code: 'NOT_FOUND', message: 'No partner account found for this email. Please register first.' };
          }
          if (vendor.status !== 'active') {
            throw { statusCode: 403, code: 'INACTIVE', message: 'Your partner account is pending approval or inactive.' };
          }
        }
      } else if (role === 'admin') {
        let admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin && process.env.NODE_ENV !== 'production' && (email === 'admin@trivenitransports.com' || email.startsWith('admin@'))) {
          admin = await prisma.adminUser.create({
            data: { email, name: 'Triveni Admin' },
          });
        }
        if (!admin) {
          throw { statusCode: 404, code: 'NOT_FOUND', message: 'Admin account not found for this email address.' };
        }
      } else if (role === 'customer' && isSignup) {
        const customer = await prisma.customer.findUnique({ where: { email } });
        if (customer) {
          throw { statusCode: 400, code: 'ALREADY_EXISTS', message: 'An account with this email already exists. Please sign in.' };
        }
      }
    } else {
      const phone = target.value;
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
      } else if (role === 'customer' && isSignup) {
        const customer = await prisma.customer.findUnique({ where: { phone } });
        if (customer) {
          throw { statusCode: 400, code: 'ALREADY_EXISTS', message: 'An account with this phone number already exists. Please sign in.' };
        }
      }
    }

    // Cryptographically secure 6-digit OTP code (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const otpHash = crypto.createHash('sha256').update(code).digest('hex');

    // Create a new OTP challenge in database
    await prisma.otpChallenge.create({
      data: {
        phone: target.type === 'phone' ? target.value : null,
        email: target.type === 'email' ? target.value : null,
        otpHash,
        expiresAt,
        attempts: 0,
        purpose: isSignup ? 'signup' : 'login',
      },
    });

    // Send OTP via chosen channel
    if (target.type === 'email') {
      await EmailService.sendOtpEmail(target.value, code, role, isSignup);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV OTP EMAIL] Sent to ${target.value}: ${code}`);
      }
      return {
        message: 'Verification code sent to your email address.',
        channel: 'email',
        destination: target.value,
      };
    } else {
      await sendSmsOtp(target.value, code);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV OTP SMS] Sent to ${target.value}: ${code}`);
      }
      return {
        message: 'Verification code sent via SMS to your mobile number.',
        channel: 'sms',
        destination: target.value,
      };
    }
  }

  /**
   * Verifies the OTP, creates user if customer/signup, issues JWTs and Session
   */
  static async verifyOtp(
    targetInput: AuthTargetInput | string,
    role: UserRole,
    code: string,
    name?: string,
    isSignup?: boolean
  ) {
    const { OTP_MAX_ATTEMPTS } = getEnv();
    const target = resolveAuthTarget(targetInput);

    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        ...(target.type === 'email' ? { email: target.value } : { phone: target.value }),
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'Verification code not requested or already used.' };
    }

    if (challenge.expiresAt < new Date()) {
      throw { statusCode: 400, code: 'EXPIRED_OTP', message: 'Verification code has expired. Please request a new one.' };
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw { statusCode: 400, code: 'MAX_ATTEMPTS', message: 'Too many failed attempts. Please request a new code.' };
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
        throw { statusCode: 400, code: 'INVALID_OTP', message: 'Incorrect verification code. Please check and try again.' };
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
      if (target.type === 'email') {
        const customer = await prisma.customer.upsert({
          where: { email: target.value },
          create: {
            email: target.value,
            name: name || 'Valued Customer',
          },
          update: name ? { name } : {},
        });
        userId = customer.id;
        userName = customer.name;
      } else {
        const customer = await prisma.customer.upsert({
          where: { phone: target.value },
          create: {
            phone: target.value,
            name: name || 'Valued Customer',
          },
          update: name ? { name } : {},
        });
        userId = customer.id;
        userName = customer.name;
      }
    } else if (role === 'vendor') {
      if (isSignup) {
        if (target.type === 'email') {
          const vendor = await prisma.vendor.upsert({
            where: { email: target.value },
            create: {
              email: target.value,
              name: name || 'Driver Partner',
              status: 'active',
              serviceAreas: [],
            },
            update: name ? { name } : {},
          });
          userId = vendor.id;
          userName = vendor.name;
        } else {
          const vendor = await prisma.vendor.upsert({
            where: { phone: target.value },
            create: {
              phone: target.value,
              name: name || 'Driver Partner',
              status: 'active',
              serviceAreas: [],
            },
            update: name ? { name } : {},
          });
          userId = vendor.id;
          userName = vendor.name;
        }
      } else {
        const vendor = target.type === 'email'
          ? await prisma.vendor.findUnique({ where: { email: target.value } })
          : await prisma.vendor.findUnique({ where: { phone: target.value } });

        if (!vendor) throw { statusCode: 404, message: 'Partner account not found' };
        if (vendor.status !== 'active') throw { statusCode: 403, message: 'Partner account is inactive' };
        userId = vendor.id;
        userName = vendor.name;
      }
    } else {
      let admin = target.type === 'email'
        ? await prisma.adminUser.findUnique({ where: { email: target.value } })
        : await prisma.adminUser.findUnique({ where: { phone: target.value } });

      if (!admin && process.env.NODE_ENV !== 'production') {
        admin = await prisma.adminUser.create({
          data: {
            ...(target.type === 'email' ? { email: target.value } : { phone: target.value }),
            name: name || 'Triveni Admin',
          },
        });
      }
      if (!admin) throw { statusCode: 404, message: 'Admin account not found' };
      userId = admin.id;
      userName = admin.name;
    }

    return this.issueTokens(userId, role, userName, target.value);
  }

  /**
   * Refreshes access token using a valid, non-revoked refresh token
   */
  static async refreshToken(token: string) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Invalid refresh token' };
    }

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
  private static async issueTokens(userId: string, role: UserRole, name?: string, phoneOrEmail?: string) {
    const accessToken = signAccessToken(userId, role);
    const refreshToken = signRefreshToken(userId, role);

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { JWT_REFRESH_EXPIRES_IN } = getEnv();

    const days = parseInt(JWT_REFRESH_EXPIRES_IN.replace('d', '')) || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

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

    const isEmail = phoneOrEmail?.includes('@');

    return {
      accessToken,
      refreshToken,
      userId,
      user: {
        id: userId,
        role,
        name: name || (role === 'admin' ? 'Admin' : role === 'vendor' ? 'Partner' : 'Customer'),
        phone: isEmail ? '' : (phoneOrEmail || ''),
        email: isEmail ? phoneOrEmail : undefined,
      },
    };
  }
}
