import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../utils/errors.js';

export const validate =
  <TSchema extends z.ZodTypeAny>(schema: TSchema, source: 'body' | 'params' | 'query'): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      next(
        new AppError(400, 'VALIDATION_ERROR', 'Request validation failed.', parsed.error.flatten()),
      );
      return;
    }

    if (source === 'body') {
      req.body = parsed.data;
    } else if (source === 'params') {
      Object.assign(req.params, parsed.data);
    } else {
      Object.assign(req.query, parsed.data);
    }
    next();
  };
