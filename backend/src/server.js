import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '127.0.0.1';

try {
  await connectDatabase();

  const server = app.listen(port, host, () => {
    console.log(`HZ Retail POS API listening on port ${port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received. Shutting down...`);

    server.close(async () => {
      const mongoose = await import('mongoose');
      await mongoose.default.disconnect();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error('Application startup failed:', error.message);
  process.exit(1);
}
