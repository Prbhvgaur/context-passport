import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'ContextPassport API listening');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Graceful shutdown started');
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Shutdown failed');
      process.exitCode = 1;
    }

    process.exit();
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

