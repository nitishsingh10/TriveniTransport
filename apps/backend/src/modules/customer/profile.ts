export function isCustomerProfileComplete(name?: string | null, phone?: string | null): boolean {
  const digits = (phone || '').replace(/\D/g, '');
  const normalizedPhone = digits.length > 10 ? digits.slice(-10) : digits;
  const normalizedName = name?.trim() || '';

  return (
    normalizedName.length >= 2 &&
    !['customer', 'valued customer'].includes(normalizedName.toLowerCase()) &&
    /^[6-9]\d{9}$/.test(normalizedPhone)
  );
}
