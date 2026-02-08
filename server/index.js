const app = require('./app');

const PORT = process.env.PORT || 5001;

Promise.resolve(app.ready)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server after DB connection error:', err);
    process.exit(1);
  });
