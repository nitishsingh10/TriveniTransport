import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

export function setupWebsockets(io: Server) {
  // Auth middleware: attach authenticated user if token provided
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '');
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        socket.data.user = { id: payload.sub, role: payload.role };
      } catch (err) {
        return next(new Error('Authentication failed'));
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    socket.on('subscribe_availability', (data) => {
      if (!data || !data.vehicleId || !data.date) return;
      const { vehicleId, date } = data;
      const room = `availability:${vehicleId}:${date}`;
      socket.join(room);
    });

    socket.on('subscribe_booking', async (data) => {
      if (!data || !data.bookingId) return;
      const { bookingId } = data;

      // Ensure user is authenticated to subscribe to private booking events
      const user = socket.data.user;
      if (!user) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Authentication required for booking updates' });
        return;
      }

      // If customer or vendor, verify ownership/assignment to prevent IDOR / data snooping
      if (user.role === 'customer' || user.role === 'vendor') {
        try {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { customerId: true, vendorId: true },
          });

          if (
            !booking ||
            (user.role === 'customer' && booking.customerId !== user.id) ||
            (user.role === 'vendor' && booking.vendorId !== user.id)
          ) {
            socket.emit('error', { code: 'FORBIDDEN', message: 'Not authorized to subscribe to this booking' });
            return;
          }
        } catch {
          socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to verify booking subscription' });
          return;
        }
      }

      // Rooms are isolated per bookingId
      const room = `booking:${bookingId}`;
      socket.join(room);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}
