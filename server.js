require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
     await connectDB();

     const server = app.listen(PORT, () => {
          console.log(`Server is running at http://localhost:${PORT} \nCheck health at http://localhost:${PORT}/api/health`);
     });

     const shutdown = (signal) => {
          console.log(`\n${signal} received. Shutting down...`);

          server.close(() => {
               console.log('Server closed.');
               process.exit(0);
          });
     };

     process.on("SIGTERM", () => shutdown("SIGTERM"));
     process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer();