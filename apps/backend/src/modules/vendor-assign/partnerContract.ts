import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { getEnv } from '../../config/env';
import { EmailService } from '../../services/resend';
import { sendSmsOtp } from '../../services/msg91';
import { checkIdentifierOtpLimit } from '../../middleware/rateLimiter';

export const PARTNER_CONTRACT_VERSION = 'TT-PNM-2026-01';

export const PARTNER_CONTRACT_TEXT = `TRIVENI PACKERS & MOVERS PARTNER SERVICE AGREEMENT
Version ${PARTNER_CONTRACT_VERSION}

This agreement is between Triveni Transports ("Triveni") and the business partner whose legal name and authorised signatory are recorded in the partner application ("Partner"). It applies to Packers & Movers work offered through Triveni's platform.

1. Scope and activation
Partner may provide packing, loading, household-goods moving, unloading and related services only for orders assigned through Triveni. Submitting an application or signing this agreement does not itself approve Partner or grant order access. Partner may receive or perform orders only after Triveni has verified the application and activated the account. Pickup-and-truck-only work is governed by a separate partner process.

2. Partner responsibilities
Partner will keep its business, identity, bank and service-area information accurate; maintain all registrations, permits, qualified staff and operational documents required for its work; use trained crews; follow applicable safety and consumer-protection requirements; and promptly report changes that could affect its eligibility. Partner will not submit false records, misuse customer information, or subcontract an order without Triveni's written approval.

3. Customer property and service records
Partner will use reasonable care while handling customer property, confirm the inventory and visible condition at pickup and delivery, record exceptions with the customer, and report incidents promptly through the platform or support. Partner must not promise customers that Triveni provides goods-in-transit cover or any other protection unless Triveni separately confirms that service in writing.

4. Order and commercial terms
The work scope and customer-facing price for a move are governed by the customer's booking. Partner compensation, any platform fee or deduction, cancellation treatment, tax handling and settlement timing must be recorded in a separate commercial schedule signed by both parties before Triveni activates Partner for work. Order-specific scope changes must be shared with Partner in writing before work starts. No undisclosed deduction may be applied.

5. Customer and business information
Partner will access customer information only to fulfil an assigned order, keep it confidential, use it only for that purpose, and report suspected loss or unauthorised disclosure promptly. Partner will return or delete information when it is no longer needed, subject to legal record-keeping duties.

6. Review, suspension and termination
Triveni may pause new assignments while an application, document, customer complaint or safety issue is reviewed. Either party may end this agreement by written notice. Ending it does not remove obligations relating to completed orders, confidential information, payment records or unresolved complaints.

7. Electronic signing and records
The person signing confirms they are authorised to bind the Partner, has reviewed this version, and intends the typed name below plus the one-time code verification to sign this electronic record. Triveni will retain the agreement text, its SHA-256 hash, signer details, signing time, verification reference and available device/network audit details as the signing record.

8. Applicable terms
This agreement is read with the applicable customer booking terms, any signed commercial schedule and applicable law. If a signed commercial schedule conflicts with this agreement on commercial matters, the schedule controls for those matters. The parties should complete and sign any commercial schedule before Partner starts paid work.

By signing, Partner confirms that the signer is authorised to accept these terms for the business.`;

export const PARTNER_CONTRACT_HASH = crypto.createHash('sha256').update(PARTNER_CONTRACT_TEXT, 'utf8').digest('hex');

function hashOtp(code: string) {
  const { JWT_REFRESH_SECRET } = getEnv();
  return crypto.createHmac('sha256', JWT_REFRESH_SECRET).update(code).digest('hex');
}

function phoneVariants(phone: string) {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return [{ phone: digits }, { phone: `+91${digits}` }, { phone: `91${digits}` }, { phone: `0${digits}` }];
}

export class PartnerContractService {
  static getCurrent() {
    return { version: PARTNER_CONTRACT_VERSION, hash: PARTNER_CONTRACT_HASH, text: PARTNER_CONTRACT_TEXT };
  }

  static async getForVendor(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { serviceType: true } });
    if (vendor?.serviceType !== 'packers_movers') {
      throw { statusCode: 403, code: 'WRONG_SERVICE_APP', message: 'This agreement is only for Packers & Movers partners.' };
    }
    const signature = await prisma.vendorContractSignature.findUnique({
      where: { vendorId_contractVersion: { vendorId, contractVersion: PARTNER_CONTRACT_VERSION } },
      select: { signerName: true, signerRole: true, signatureText: true, signedAt: true, contractHash: true },
    });
    return { ...this.getCurrent(), signature };
  }

  static async requestOtp(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { serviceType: true, phone: true, email: true, status: true } });
    if (vendor?.serviceType !== 'packers_movers' || vendor.status === 'suspended') {
      throw { statusCode: 403, code: 'WRONG_SERVICE_APP', message: 'This signing step is only available to active P&M partner accounts.' };
    }
    const target = vendor.phone
      ? { type: 'phone' as const, value: vendor.phone.replace(/\D/g, '').slice(-10) }
      : vendor.email ? { type: 'email' as const, value: vendor.email.toLowerCase() } : null;
    if (!target?.value) throw { statusCode: 400, code: 'VERIFIED_CONTACT_REQUIRED', message: 'Add a verified phone or email to sign the agreement.' };
    await checkIdentifierOtpLimit(target.value);
    const { OTP_EXPIRY_MINUTES } = getEnv();
    const code = crypto.randomInt(100000, 1000000).toString();
    const challenge = await prisma.otpChallenge.create({
      data: {
        ...(target.type === 'phone' ? { phone: target.value } : { email: target.value }),
        otpHash: hashOtp(code), role: 'vendor', serviceType: 'packers_movers', purpose: 'contract_signature',
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });
    try {
      if (target.type === 'phone') await sendSmsOtp(target.value, code);
      else await EmailService.sendOtpEmail(target.value, code, 'vendor', false, true);
    } catch (error) {
      await prisma.otpChallenge.updateMany({ where: { id: challenge.id, verifiedAt: null }, data: { expiresAt: new Date(0) } });
      throw error;
    }
    return { message: 'Signing code sent to your verified contact.', channel: target.type, destination: target.value, expiresInMinutes: OTP_EXPIRY_MINUTES };
  }

  static async sign(vendorId: string, input: {
    version: string; hash: string; signerName: string; signerRole: string; signatureText: string; otp: string;
    ipAddress?: string; userAgent?: string;
  }) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { serviceType: true, phone: true, email: true, status: true } });
    if (vendor?.serviceType !== 'packers_movers' || vendor.status === 'suspended') {
      throw { statusCode: 403, code: 'WRONG_SERVICE_APP', message: 'This agreement is only for active P&M partner accounts.' };
    }
    if (input.version !== PARTNER_CONTRACT_VERSION || input.hash !== PARTNER_CONTRACT_HASH) {
      throw { statusCode: 409, code: 'CONTRACT_VERSION_CHANGED', message: 'The agreement changed. Review the latest version before signing.' };
    }
    const signerName = input.signerName.trim();
    const signerRole = input.signerRole.trim();
    const signatureText = input.signatureText.trim();
    if (signerName.length < 2 || signerRole.length < 2 || signatureText !== signerName) {
      throw { statusCode: 400, code: 'SIGNER_DETAILS_REQUIRED', message: 'Enter your full name, role and type the same name as your signature.' };
    }

    const existing = await prisma.vendorContractSignature.findUnique({
      where: { vendorId_contractVersion: { vendorId, contractVersion: PARTNER_CONTRACT_VERSION } },
    });
    if (existing) {
      if (existing.contractHash !== PARTNER_CONTRACT_HASH) {
        throw { statusCode: 409, code: 'SIGNED_CONTRACT_HASH_MISMATCH', message: 'A different agreement version is already recorded. Ask operations to issue the current agreement before signing again.' };
      }
      return { signed: true, signature: existing };
    }

    const target = vendor.phone
      ? { type: 'phone' as const, value: vendor.phone.replace(/\D/g, '').slice(-10) }
      : vendor.email ? { type: 'email' as const, value: vendor.email.toLowerCase() } : null;
    if (!target?.value) throw { statusCode: 400, code: 'VERIFIED_CONTACT_REQUIRED', message: 'Add a verified phone or email to sign the agreement.' };
    const { OTP_MAX_ATTEMPTS } = getEnv();
    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        ...(target.type === 'phone' ? { OR: phoneVariants(target.value) } : { email: target.value }),
        role: 'vendor', serviceType: 'packers_movers', purpose: 'contract_signature', verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.expiresAt <= new Date()) throw { statusCode: 400, code: 'EXPIRED_OTP', message: 'Request a new signing code to continue.' };
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) throw { statusCode: 400, code: 'MAX_ATTEMPTS', message: 'Too many incorrect codes. Request a new one.' };
    const suppliedHash = Buffer.from(hashOtp(input.otp), 'hex');
    const storedHash = Buffer.from(challenge.otpHash, 'hex');
    if (suppliedHash.length !== storedHash.length || !crypto.timingSafeEqual(suppliedHash, storedHash)) {
      await prisma.otpChallenge.updateMany({ where: { id: challenge.id, verifiedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'The signing code is incorrect.' };
    }

    return prisma.$transaction(async (tx) => {
      const consumed = await tx.otpChallenge.updateMany({
        where: { id: challenge.id, verifiedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS }, expiresAt: { gt: new Date() } },
        data: { verifiedAt: new Date() },
      });
      if (consumed.count !== 1) throw { statusCode: 400, code: 'INVALID_OTP', message: 'This signing code has already been used. Request a new one.' };
      const signature = await tx.vendorContractSignature.create({
        data: {
          vendorId, contractVersion: PARTNER_CONTRACT_VERSION, contractHash: PARTNER_CONTRACT_HASH, contractText: PARTNER_CONTRACT_TEXT,
          signerName: signerName.slice(0, 150), signerRole: signerRole.slice(0, 100), signatureText: signatureText.slice(0, 150),
          otpChallengeId: challenge.id, ipAddress: input.ipAddress?.slice(0, 64), userAgent: input.userAgent?.slice(0, 500),
        },
      });
      return { signed: true, signature };
    });
  }
}
