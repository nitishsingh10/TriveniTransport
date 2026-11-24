import { prisma } from '../../config/prisma';

export function isCustomerProfileComplete(
  name?: string | null,
  phone?: string | null,
  email?: string | null,
): boolean {
  const digits = (phone || '').replace(/\D/g, '');
  const normalizedPhone = digits.length > 10 ? digits.slice(-10) : digits;
  const normalizedName = name?.trim() || '';

  return (
    normalizedName.length >= 2 &&
    !['customer', 'valued customer'].includes(normalizedName.toLowerCase()) &&
    /^[6-9]\d{9}$/.test(normalizedPhone)
  );
}

export function hasValidCustomerPhone(phone?: string | null): boolean {
  const digits = (phone || '').replace(/\D/g, '');
  const normalizedPhone = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(normalizedPhone);
}

export async function assertCustomerCanBook(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, phone: true, email: true },
  });
  if (!customer) {
    throw { statusCode: 404, message: 'Customer not found' };
  }
  if (!hasValidCustomerPhone(customer.phone)) {
    throw {
      statusCode: 403,
      code: 'PHONE_NUMBER_REQUIRED',
      message: 'A valid 10-digit mobile number is required to book a move or view bookings. Please complete your profile.',
    };
  }
  return customer;
}

