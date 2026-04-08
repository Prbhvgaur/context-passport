import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { API_PREFIX } from '@context-passport/shared';
import { env } from './config/env.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health-routes.js';
import { sessionRouter } from './routes/session-routes.js';
import { userRouter } from './routes/user-routes.js';
import { logger } from './utils/logger.js';
import { swaggerSpec } from './utils/swagger.js';

const allowedOrigins = new Set(
  [
    'http://localhost:3000',
    'http://localhost:5173',
    env.EXTENSION_CHROME_ID ? `chrome-extension://${env.EXTENSION_CHROME_ID}` : null,
  ].filter((value): value is string => Boolean(value)),
);

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === `${API_PREFIX}/health`,
      },
    }),
  );
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origin not allowed by CORS.'));
      },
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(API_PREFIX, healthRouter);
  app.use(API_PREFIX, authMiddleware, sessionRouter);
  app.use(API_PREFIX, authMiddleware, userRouter);

  app.use(errorHandler);
  return app;
};

