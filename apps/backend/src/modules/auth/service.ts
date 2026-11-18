import { prisma } from '../../config/prisma';
import { getEnv } from '../../config/env';
import { isCustomerProfileComplete } from '../customer/profile';
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

export function normalizePhoneNumber(raw: string): string {
  if (!/^\+?[\d().\-\s]+$/.test(raw)) {
    throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Please provide a valid 10-digit mobile phone number.' };
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function resolveAuthTarget(input: AuthTargetInput | string): { type: 'email' | 'phone'; value: string } {
  const candidates = typeof input === 'string'
    ? [input]
    : [input.email, input.phone, input.identifier].filter((value): value is string => Boolean(value?.trim()));

  if (candidates.length === 0) {
    throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email address or mobile phone number is required.' };
  }

  const normalized = candidates.map((candidate) => {
    const raw = candidate.trim();
    if (raw.includes('@')) {
      const email = raw.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email.length > 254 || !emailRegex.test(email)) {
        throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Please provide a valid email address.' };
      }
      return { type: 'email' as const, value: email };
    }

    const phone = normalizePhoneNumber(raw);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Please provide a valid 10-digit mobile phone number.' };
    }
    return { type: 'phone' as const, value: phone };
  });

  const target = normalized[0];
  if (normalized.some((candidate) => candidate.type !== target.type || candidate.value !== target.value)) {
    throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Provide one matching email address or mobile phone number.' };
  }
  return target;
}

function phoneVariants(phone: string) {
  return [{ phone }, { phone: `+91${phone}` }, { phone: `91${phone}` }, { phone: `0${phone}` }];
}

function userNotFound(targetType: 'email' | 'phone', role: 'customer' | 'vendor') {
  const kind = targetType === 'email' ? 'email' : 'phone number';
  const account = role === 'vendor' ? 'partner account' : 'customer account';
  return {
    statusCode: 404,
    code: 'USER_NOT_FOUND',
    message: `No ${account} found with this ${kind}. Please sign up first.`,
  };
}

function accountExists(role: 'customer' | 'vendor', targetType: 'email' | 'phone') {
  const account = role === 'vendor' ? 'partner account' : 'account';
  const kind = targetType === 'email' ? 'email' : 'phone number';
  return {
    statusCode: 400,
    code: 'ALREADY_EXISTS',
    message: `An ${account} with this ${kind} already exists. Please sign in.`,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002');
}

function hashOtp(code: string): string {
  const { JWT_REFRESH_SECRET } = getEnv();
  return crypto.createHmac('sha256', JWT_REFRESH_SECRET).update(code).digest('hex');
}

function refreshTokenLifetimeMs(raw: string): number {
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) throw new Error('JWT_REFRESH_EXPIRES_IN must be a duration such as 30d or 12h.');
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * unitMs[match[2]];
}

export class AuthService {
  static async requestPhoneChangeOtp(rawPhone: string) {
    const { OTP_EXPIRY_MINUTES } = getEnv();
    const target = resolveAuthTarget(rawPhone);
    if (target.type !== 'phone') throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Enter a valid mobile number.' };
    await checkIdentifierOtpLimit(target.value);
    const existing = await prisma.customer.findFirst({ where: { OR: phoneVariants(target.value) }, select: { id: true } });
    if (existing) throw { statusCode: 409, code: 'PHONE_IN_USE', message: 'This mobile number is already linked to another account.' };

    const code = crypto.randomInt(100000, 1000000).toString();
    const challenge = await prisma.otpChallenge.create({
      data: { phone: target.value, otpHash: hashOtp(code), role: 'customer', purpose: 'login', expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000) },
    });
    try {
      await sendSmsOtp(target.value, code);
      if (process.env.NODE_ENV === 'development') console.log(`[DEV OTP SMS] Phone change OTP sent to ${target.value}: ${code}`);
    } catch (error) {
      await prisma.otpChallenge.updateMany({ where: { id: challenge.id, verifiedAt: null }, data: { expiresAt: new Date(0) } });
      throw error;
    }
    return { message: 'Verification code sent via SMS.', destination: target.value };
  }

  static async verifyPhoneChangeOtp(customerId: string, rawPhone: string, code: string) {
    const { OTP_MAX_ATTEMPTS } = getEnv();
    const target = resolveAuthTarget(rawPhone);
    if (target.type !== 'phone') throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Enter a valid mobile number.' };
    const challenge = await prisma.otpChallenge.findFirst({
      where: { OR: phoneVariants(target.value), role: 'customer', purpose: 'login', verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.expiresAt <= new Date()) throw { statusCode: 400, code: 'EXPIRED_OTP', message: 'Verification code is missing or expired. Request a new code.' };
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) throw { statusCode: 400, code: 'MAX_ATTEMPTS', message: 'Too many failed attempts. Request a new code.' };
    const inputHash = Buffer.from(hashOtp(code), 'hex');
    const storedHash = Buffer.from(challenge.otpHash, 'hex');
    if (storedHash.length !== inputHash.length || !crypto.timingSafeEqual(storedHash, inputHash)) {
      await prisma.otpChallenge.updateMany({ where: { id: challenge.id, verifiedAt: null }, data: { attempts: { increment: 1 } } });
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'Incorrect verification code. Please try again.' };
    }
    return prisma.$transaction(async (tx) => {
      const consumed = await tx.otpChallenge.updateMany({
        where: { id: challenge.id, verifiedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS }, expiresAt: { gt: new Date() } },
        data: { verifiedAt: new Date() },
      });
      if (consumed.count !== 1) throw { statusCode: 400, code: 'INVALID_OTP', message: 'Verification code has already been used. Request a new code.' };
      const existing = await tx.customer.findFirst({ where: { OR: phoneVariants(target.value), NOT: { id: customerId } }, select: { id: true } });
      if (existing) throw { statusCode: 409, code: 'PHONE_IN_USE', message: 'This mobile number is already linked to another account.' };
      return tx.customer.update({ where: { id: customerId }, data: { phone: target.value }, select: { id: true, name: true, phone: true, email: true } });
    });
  }

  /**
   * Generates a single-use OTP challenge bound to its account role and login/signup intent.
   */
  static async requestOtp(
    targetInput: AuthTargetInput | string,
    role: UserRole,
    isSignup?: boolean
  ): Promise<{ message: string; channel: 'email' | 'sms'; destination: string }> {
    const { OTP_EXPIRY_MINUTES } = getEnv();
    const target = resolveAuthTarget(targetInput);
    const signup = Boolean(isSignup);

    if (role === 'admin' && signup) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Admin accounts cannot be created through signup.' };
    }

    await checkIdentifierOtpLimit(target.value);

    if (target.type === 'email') {
      const email = target.value;
      if (role === 'vendor') {
        const vendor = await prisma.vendor.findUnique({ where: { email } });
        if (signup && vendor) throw accountExists('vendor', 'email');
        if (!signup && !vendor) throw userNotFound('email', 'vendor');
        if (!signup && vendor?.status !== 'active') {
          throw { statusCode: 403, code: 'INACTIVE', message: 'Your partner account is pending approval or inactive.' };
        }
      } else if (role === 'admin') {
        let admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin && process.env.NODE_ENV === 'development' && (email === 'admin@trivenitransports.com' || email.startsWith('admin@'))) {
          admin = await prisma.adminUser.create({ data: { email, name: 'Triveni Admin' } });
        }
        if (!admin) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Admin account not found for this email address.' };
      } else {
        const customer = await prisma.customer.findUnique({ where: { email } });
        if (signup && customer) throw accountExists('customer', 'email');
        if (!signup && !customer) throw userNotFound('email', 'customer');
      }
    } else {
      const phone = target.value;
      if (role === 'vendor') {
        const vendor = await prisma.vendor.findFirst({ where: { OR: phoneVariants(phone) } });
        if (signup && vendor) throw accountExists('vendor', 'phone');
        if (!signup && !vendor) throw userNotFound('phone', 'vendor');
        if (!signup && vendor?.status !== 'active') {
          throw { statusCode: 403, code: 'INACTIVE', message: 'Your partner account is pending approval or inactive.' };
        }
      } else if (role === 'admin') {
        let admin = await prisma.adminUser.findFirst({ where: { OR: phoneVariants(phone) } });
        if (!admin && process.env.NODE_ENV === 'development') {
          const { ADMIN_PHONE } = getEnv();
          if (phone === normalizePhoneNumber(ADMIN_PHONE)) {
            admin = await prisma.adminUser.create({ data: { phone, name: 'Triveni Admin' } });
          }
        }
        if (!admin) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Admin account not found for this phone number.' };
      } else {
        const customer = await prisma.customer.findFirst({ where: { OR: phoneVariants(phone) } });
        if (signup && customer) throw accountExists('customer', 'phone');
        if (!signup && !customer) throw userNotFound('phone', 'customer');
      }
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const otpHash = hashOtp(code);
    const challenge = await prisma.otpChallenge.create({
      data: {
        phone: target.type === 'phone' ? target.value : null,
        email: target.type === 'email' ? target.value : null,
        otpHash,
        role,
        expiresAt,
        attempts: 0,
        purpose: signup ? 'signup' : 'login',
      },
    });

    try {
      if (target.type === 'email') {
        await EmailService.sendOtpEmail(target.value, code, role, signup);
        if (process.env.NODE_ENV === 'development') console.log(`[DEV OTP EMAIL] Sent to ${target.value}: ${code}`);
        return { message: 'Verification code sent to your email address.', channel: 'email', destination: target.value };
      }

      await sendSmsOtp(target.value, code);
      if (process.env.NODE_ENV === 'development') console.log(`[DEV OTP SMS] Sent to ${target.value}: ${code}`);
      return { message: 'Verification code sent via SMS to your mobile number.', channel: 'sms', destination: target.value };
    } catch (error) {
      await prisma.otpChallenge.updateMany({ where: { id: challenge.id, verifiedAt: null }, data: { expiresAt: new Date(0) } });
      throw error;
    }
  }

  /**
   * Verifies and consumes a matching OTP before creating a user or issuing tokens.
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
    const signup = Boolean(isSignup);
    if (role === 'admin' && signup) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Admin accounts cannot be created through signup.' };
    }

    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        ...(target.type === 'email' ? { email: target.value } : { OR: phoneVariants(target.value) }),
        role,
        purpose: signup ? 'signup' : 'login',
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'Verification code not requested for this sign-in or signup. Please request a new code.' };
    }
    if (challenge.expiresAt <= new Date()) {
      throw { statusCode: 400, code: 'EXPIRED_OTP', message: 'Verification code has expired. Please request a new one.' };
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw { statusCode: 400, code: 'MAX_ATTEMPTS', message: 'Too many failed attempts. Please request a new code.' };
    }

    const inputHash = Buffer.from(hashOtp(code), 'hex');
    const storedHash = Buffer.from(challenge.otpHash, 'hex');
    const isMatch = storedHash.length === inputHash.length && crypto.timingSafeEqual(storedHash, inputHash);
    if (!isMatch) {
      const update = await prisma.otpChallenge.updateMany({
        where: { id: challenge.id, verifiedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
      });
      if (update.count === 0) {
        throw { statusCode: 400, code: 'MAX_ATTEMPTS', message: 'Too many failed attempts. Please request a new code.' };
      }
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'Incorrect verification code. Please check and try again.' };
    }

    const consumed = await prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        verifiedAt: null,
        attempts: { lt: OTP_MAX_ATTEMPTS },
        expiresAt: { gt: new Date() },
      },
      data: { verifiedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'Verification code has already been used. Please request a new one.' };
    }

    let userId: string;
    let userName: string;
    let userPhone: string | undefined;
    let userEmail: string | undefined;
    let userProfileCompleted: boolean | undefined;
    const displayName = name?.trim() || undefined;

    if (role === 'customer') {
      const existing = target.type === 'email'
        ? await prisma.customer.findUnique({ where: { email: target.value } })
        : await prisma.customer.findFirst({ where: { OR: phoneVariants(target.value) } });

      if (signup) {
        if (existing) throw accountExists('customer', target.type);
        try {
          const customer = await prisma.customer.create({
            data: {
              ...(target.type === 'email' ? { email: target.value } : { phone: target.value }),
              name: displayName || 'Valued Customer',
            },
          });
          userId = customer.id;
          userName = customer.name;
          userPhone = customer.phone || undefined;
          userEmail = customer.email || undefined;
          userProfileCompleted = isCustomerProfileComplete(customer.name, customer.phone);
        } catch (error) {
          if (isUniqueConstraintError(error)) throw accountExists('customer', target.type);
          throw error;
        }
      } else {
        if (!existing) throw userNotFound(target.type, 'customer');
        userId = existing.id;
        userName = existing.name;
        userPhone = existing.phone || undefined;
        userEmail = existing.email || undefined;
        userProfileCompleted = isCustomerProfileComplete(existing.name, existing.phone);
      }
    } else if (role === 'vendor') {
      const existing = target.type === 'email'
        ? await prisma.vendor.findUnique({ where: { email: target.value } })
        : await prisma.vendor.findFirst({ where: { OR: phoneVariants(target.value) } });

      if (signup) {
        if (existing) throw accountExists('vendor', target.type);
        try {
          const vendor = await prisma.vendor.create({
            data: {
              ...(target.type === 'email' ? { email: target.value } : { phone: target.value }),
              name: displayName || 'Driver Partner',
              status: 'active',
              serviceAreas: [],
            },
          });
          userId = vendor.id;
          userName = vendor.name;
          userPhone = vendor.phone || undefined;
          userEmail = vendor.email || undefined;
        } catch (error) {
          if (isUniqueConstraintError(error)) throw accountExists('vendor', target.type);
          throw error;
        }
      } else {
        if (!existing) throw userNotFound(target.type, 'vendor');
        if (existing.status !== 'active') {
          throw { statusCode: 403, code: 'INACTIVE', message: 'Partner account is inactive.' };
        }
        userId = existing.id;
        userName = existing.name;
        userPhone = existing.phone || undefined;
        userEmail = existing.email || undefined;
      }
    } else {
      const admin = target.type === 'email'
        ? await prisma.adminUser.findUnique({ where: { email: target.value } })
        : await prisma.adminUser.findFirst({ where: { OR: phoneVariants(target.value) } });
      if (!admin) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Admin account not found or unauthorized.' };
      userId = admin.id;
      userName = admin.name;
      userPhone = admin.phone || undefined;
      userEmail = admin.email || undefined;
    }

    return this.issueTokens(userId, role, userName, {
      phone: userPhone,
      email: userEmail,
      profileCompleted: userProfileCompleted,
    });
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

    if (!session || session.expiresAt <= new Date()) {
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Session expired or revoked' };
    }

    const userId = session.customerId || session.vendorId || session.adminUserId;
    if (!userId || payload.sub !== userId || payload.role !== session.userRole) {
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Invalid session state or token mismatch' };
    }

    if (payload.role === 'customer' && !(await prisma.customer.findUnique({ where: { id: userId }, select: { id: true } }))) {
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Account is no longer available.' };
    }
    if (payload.role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { id: userId }, select: { status: true } });
      if (!vendor || vendor.status !== 'active') {
        throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Partner account is no longer active.' };
      }
    }
    if (payload.role === 'admin' && !(await prisma.adminUser.findUnique({ where: { id: userId }, select: { id: true } }))) {
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Admin account is no longer available.' };
    }

    const accessToken = signAccessToken(userId, payload.role);
    const refreshToken = signRefreshToken(userId, payload.role);
    const nextHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const rotated = await prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: hashedToken, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { refreshTokenHash: nextHash },
    });
    if (rotated.count !== 1) {
      throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Refresh token has already been used.' };
    }
    return { accessToken, refreshToken };
  }

  /**
   * Logs out user by revoking the session
   */
  static async logout(tokenOrUserId: { token?: string | null; userId?: string | null }) {
    if (tokenOrUserId.token) {
      const hashedToken = crypto.createHash('sha256').update(tokenOrUserId.token).digest('hex');
      await prisma.session.updateMany({
        where: { refreshTokenHash: hashedToken, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (tokenOrUserId.userId) {
      await prisma.session.updateMany({
        where: {
          OR: [
            { customerId: tokenOrUserId.userId },
            { vendorId: tokenOrUserId.userId },
            { adminUserId: tokenOrUserId.userId },
          ],
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }
  }

  // Helper
  private static async issueTokens(
    userId: string,
    role: UserRole,
    name?: string,
    contact: { phone?: string; email?: string; profileCompleted?: boolean } = {},
  ) {
    const accessToken = signAccessToken(userId, role);
    const refreshToken = signRefreshToken(userId, role);

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { JWT_REFRESH_EXPIRES_IN } = getEnv();

    const expiresAt = new Date(Date.now() + refreshTokenLifetimeMs(JWT_REFRESH_EXPIRES_IN));

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
        phone: contact.phone || '',
        email: contact.email,
        profileCompleted: contact.profileCompleted,
      },
    };
  }
}
