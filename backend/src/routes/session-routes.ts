import { Router } from 'express';
import { z } from 'zod';
import {
  compressSessionSchema,
  createSessionSchema,
  paginationSchema,
  updateSessionSchema,
} from '@context-passport/shared';
import {
  compressSession,
  createSession,
  deleteSession,
  getSession,
  listSessions,
  resumeSession,
  updateSession,
} from '../controllers/session-controller.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const sessionRouter = Router();

const idSchema = z.object({
  id: z.string().min(1),
});

/**
 * @openapi
 * /api/v1/sessions:
 *   post:
 *     summary: Save a new session passport
 *     security:
 *       - bearerAuth: []
 *   get:
 *     summary: List sessions for the authenticated user
 *     security:
 *       - bearerAuth: []
 * /api/v1/sessions/{id}:
 *   get:
 *     summary: Get one session
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update a session
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Delete a session
 *     security:
 *       - bearerAuth: []
 * /api/v1/sessions/{id}/resume:
 *   post:
 *     summary: Generate a resume prompt
 *     security:
 *       - bearerAuth: []
 * /api/v1/sessions/compress:
 *   post:
 *     summary: Compress a transcript into a passport
 *     security:
 *       - bearerAuth: []
 */
sessionRouter.post('/sessions', validate(createSessionSchema, 'body'), asyncHandler(createSession));
sessionRouter.get('/sessions', validate(paginationSchema, 'query'), asyncHandler(listSessions));
sessionRouter.get('/sessions/:id', validate(idSchema, 'params'), asyncHandler(getSession));
sessionRouter.put(
  '/sessions/:id',
  validate(idSchema, 'params'),
  validate(updateSessionSchema, 'body'),
  asyncHandler(updateSession),
);
sessionRouter.delete('/sessions/:id', validate(idSchema, 'params'), asyncHandler(deleteSession));
sessionRouter.post('/sessions/:id/resume', validate(idSchema, 'params'), asyncHandler(resumeSession));
sessionRouter.post(
  '/sessions/compress',
  validate(compressSessionSchema, 'body'),
  asyncHandler(compressSession),
);

