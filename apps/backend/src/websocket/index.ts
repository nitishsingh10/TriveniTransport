import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';

export function setupWebsockets(io: Server) {
  // Optional auth middleware: attach authenticated user if token provided
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '');
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        socket.data.user = { id: payload.sub, role: payload.role };
      } catch (err) {
        // Token provided was invalid
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

    socket.on('subscribe_booking', (data) => {
      if (!data || !data.bookingId) return;
      const { bookingId } = data;
      // Rooms are isolated per bookingId
      const room = `booking:${bookingId}`;
      socket.join(room);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}
