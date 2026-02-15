const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (httpServer, options = {}) => {
  io = new Server(httpServer, options);

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      socket.admin = verified;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('admins');
  });

  return io;
};

const getIo = () => io;

module.exports = {
  initSocket,
  getIo
};
