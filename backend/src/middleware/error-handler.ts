import type { ErrorRequestHandler } from 'express';
import { isProduction } from '../config/env.js';
import { isAppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (isAppError(error)) {
    if (!isProduction) {
      logger.error({ err: error, path: req.path }, error.message);
    }

    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  logger.error({ err: error, path: req.path }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      details: isProduction ? undefined : error instanceof Error ? error.message : String(error),
    },
  });
};

