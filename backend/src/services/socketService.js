import { Server } from 'socket.io';

let io;
const userSockets = new Map(); // userId string -> Set of socketIds

/**
 * Initialize the Socket.io server connection.
 * @param {Object} server - HTTP Server instance
 * @returns {Object} Server instance
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Registered from frontend when authenticated user state is loaded
    socket.on('register', (userId) => {
      if (!userId) return;
      socket.userId = userId.toString();
      if (!userSockets.has(socket.userId)) {
        userSockets.set(socket.userId, new Set());
      }
      userSockets.get(socket.userId).add(socket.id);
      console.log(`[Socket] User ${socket.userId} registered with socket ID: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        const sockets = userSockets.get(socket.userId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(socket.userId);
        }
        console.log(`[Socket] User ${socket.userId} disconnected socket ID: ${socket.id}`);
      }
    });
  });

  return io;
};

/**
 * Emit an event to a registered user.
 * @param {string|ObjectId} userId - Target user ID
 * @param {string} event - Event name
 * @param {Object} data - Payload content
 */
export const emitToUser = (userId, event, data) => {
  if (!io) {
    console.warn('[Socket] Server not initialized. Cannot emit.');
    return;
  }
  const userIdStr = userId.toString();
  const sockets = userSockets.get(userIdStr);
  if (sockets && sockets.size > 0) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
    console.log(`[Socket] Emitted event "${event}" to user ${userIdStr}`);
  } else {
    console.log(`[Socket] User ${userIdStr} is offline. Socket message skipped.`);
  }
};
