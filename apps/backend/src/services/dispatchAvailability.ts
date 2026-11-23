import type { Prisma } from '@prisma/client';

export async function lockDispatchKey(tx: Prisma.TransactionClient, key: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

/** Serialize vehicle reservations for a scheduled date and slot. */
export async function lockAndCheckVehicleSlot(
  tx: Prisma.TransactionClient,
  vehicleId: string,
  bookingId: string,
  scheduledDate: Date,
  scheduledSlot: string,
) {
  const dateKey = scheduledDate.toISOString().slice(0, 10);
  const lockKey = `${vehicleId}:${dateKey}:${scheduledSlot}`;
  await lockDispatchKey(tx, `vehicle-slot:${lockKey}`);

  const conflictingBooking = await tx.booking.findFirst({
    where: {
      vehicleId,
      scheduledDate,
      scheduledSlot,
      id: { not: bookingId },
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
    },
    select: { id: true },
  });
  return !conflictingBooking;
}
