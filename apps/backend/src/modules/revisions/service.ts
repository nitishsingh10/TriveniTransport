import { prisma } from '../../config/prisma';
import { CreateRevisionInput } from '@triveni/shared-validation';

export class RevisionService {
  static async createRevision(bookingId: string, vendorId: string, input: CreateRevisionInput) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true },
    });

    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    if (booking.vendorId !== vendorId) throw { statusCode: 403, message: 'Forbidden' };
    if (booking.status !== 'IN_PROGRESS' && booking.status !== 'ARRIVED') {
      throw { statusCode: 400, message: 'Revisions can only be proposed when arrived or in progress' };
    }

    // In a real implementation, you'd calculate the cost difference based on pricing rules.
    // For this mock, we assume each item adds a flat 500 charge.
    const addedCost = input.items.reduce((sum, item) => sum + (item.quantity * 500), 0);

    const revision = await prisma.revision.create({
      data: {
        bookingId,
        description: input.description,
        amountDelta: addedCost,
        loggedBy: vendorId,
        status: 'pending',
      },
    });

    // Write the proposed items to BookingItems but mark them as revision items (or separate table)
    // To keep it simple, we won't add them until approved.

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'REVISION_PENDING' },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromState: booking.status,
        toState: 'REVISION_PENDING',
        actorId: vendorId,
        actorRole: 'vendor',
      }
    });

    // In real app, emit websocket event to customer
    return revision;
  }

  static async approveRevision(revisionId: string, customerId: string) {
    const revision = await prisma.revision.findUnique({ where: { id: revisionId }, include: { booking: true } });
    if (!revision) throw { statusCode: 404, message: 'Revision not found' };
    if (revision.booking.customerId !== customerId) throw { statusCode: 403, message: 'Forbidden' };
    if (revision.status !== 'pending') throw { statusCode: 400, message: 'Revision is not pending' };

    const newTotal = Number(revision.booking.finalAmount) + Number(revision.amountDelta);

    await prisma.revision.update({
      where: { id: revisionId },
      data: {
        status: 'approved',
        approvedBy: customerId,
        approvedAt: new Date(),
      },
    });

    const updated = await prisma.booking.update({
      where: { id: revision.bookingId },
      data: {
        status: 'IN_PROGRESS',
        finalAmount: newTotal,
      },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: revision.bookingId,
        fromState: 'REVISION_PENDING',
        toState: 'IN_PROGRESS',
        actorId: customerId,
        actorRole: 'customer',
      }
    });

    return updated;
  }

  static async declineRevision(revisionId: string, customerId: string) {
    const revision = await prisma.revision.findUnique({ where: { id: revisionId }, include: { booking: true } });
    if (!revision) throw { statusCode: 404, message: 'Revision not found' };
    if (revision.booking.customerId !== customerId) throw { statusCode: 403, message: 'Forbidden' };
    if (revision.status !== 'pending') throw { statusCode: 400, message: 'Revision is not pending' };

    await prisma.revision.update({
      where: { id: revisionId },
      data: { status: 'declined' },
    });

    const updated = await prisma.booking.update({
      where: { id: revision.bookingId },
      data: { status: 'DISPUTED' },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: revision.bookingId,
        fromState: 'REVISION_PENDING',
        toState: 'DISPUTED',
        actorId: customerId,
        actorRole: 'customer',
      }
    });

    return updated;
  }
}
