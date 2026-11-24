import type { AuthUser } from './useAuth';

const PROFILE_PLACEHOLDER_NAMES = new Set(['customer', 'valued customer']);

export function normalizeIndianPhone(phone?: string | null): string {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function isCustomerProfileComplete(
  user?: Pick<AuthUser, 'name' | 'phone' | 'email' | 'profileCompleted'> | null
): boolean {
  if (!user) return false;
  const name = user.name?.trim() || '';
  const phone = normalizeIndianPhone(user.phone);

  const fieldsAreComplete = (
    name.length >= 2 &&
    !PROFILE_PLACEHOLDER_NAMES.has(name.toLowerCase()) &&
    /^[6-9]\d{9}$/.test(phone)
  );

  return fieldsAreComplete;
}
