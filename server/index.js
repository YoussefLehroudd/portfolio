const http = require('http');
const app = require('./app');
const { initSocket } = require('./utils/socket');

const PORT = process.env.PORT || 5001;

Promise.resolve(app.ready)
  .then(() => {
    const server = http.createServer(app);
    const allowedOrigins = app.get('allowedOrigins') || ['http://localhost:3000'];

    initSocket(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server after DB connection error:', err);
    process.exit(1);
  });
