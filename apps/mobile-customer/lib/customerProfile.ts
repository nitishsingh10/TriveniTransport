import type { AuthUser } from '@triveni/shared-types';

const PROFILE_PLACEHOLDER_NAMES = new Set(['customer', 'valued customer']);

export function normalizeIndianPhone(phone?: string | null): string {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function isCustomerProfileComplete(
  user?: Pick<AuthUser, 'name' | 'phone' | 'email' | 'profileCompleted'> | null,
): boolean {
  const name = user?.name?.trim() || '';
  const phone = normalizeIndianPhone(user?.phone);
  const verifiedEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user?.email?.trim() || '');

  const fieldsAreComplete = (
    name.length >= 2 &&
    !PROFILE_PLACEHOLDER_NAMES.has(name.toLowerCase()) &&
    (verifiedEmail || /^[6-9]\d{9}$/.test(phone))
  );

  // The persisted profile fields are authoritative. A stale cached completion
  // flag must not send a customer with a valid name and phone through setup again.
  return fieldsAreComplete;
}
