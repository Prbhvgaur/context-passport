import pino from 'pino';
import { env, isProduction } from '../config/env.js';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  base: {
    service: 'context-passport-api',
    env: env.NODE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'err.config.headers.Authorization',
      'token',
      'password',
    ],
    censor: '[REDACTED]',
  },
});

