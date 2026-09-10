import { Server, Socket } from 'socket.io';
// import { verify } from 'jsonwebtoken';
// import { getEnv } from './config/env';

export function setupWebsockets(io: Server) {
  io.use((socket, next) => {
    // const token = socket.handshake.auth.token;
    // verify(token, ...)
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe_availability', (data) => {
      const { vehicleId, date } = data;
      const room = `availability:${vehicleId}:${date}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    });

    socket.on('subscribe_booking', (data) => {
      const { bookingId } = data;
      // In real implementation: verify user has access to this bookingId
      const room = `booking:${bookingId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
