const logger = require('./logger');

let ioInstance = null;

/**
 * Initialize the Socket.IO instance
 * @param {Server} io - Socket.IO server instance
 */
const initializeSocket = (io) => {
  ioInstance = io;
};

/**
 * Get the Socket.IO instance
 * @returns {Server} Socket.IO instance
 */
const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return ioInstance;
};

/**
 * Emit an event to a specific room
 * @param {string} room - Room name (e.g., 'user:123', 'campaign:456')
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToRoom = (room, event, data) => {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
    logger.info(`Emitted ${event} to room ${room}`);
  }
};

/**
 * Emit an event to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToAll = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
    logger.info(`Emitted ${event} to all clients`);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToRoom,
  emitToAll,
};
