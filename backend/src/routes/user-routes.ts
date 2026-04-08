import { Router } from 'express';
import { userPreferencesSchema } from '@context-passport/shared';
import { getProfile, updatePreferences } from '../controllers/user-controller.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const userRouter = Router();

/**
 * @openapi
 * /api/v1/user/profile:
 *   get:
 *     summary: Get the authenticated user profile
 *     security:
 *       - bearerAuth: []
 * /api/v1/user/preferences:
 *   put:
 *     summary: Update preferences
 *     security:
 *       - bearerAuth: []
 */
userRouter.get('/user/profile', asyncHandler(getProfile));
userRouter.put(
  '/user/preferences',
  validate(userPreferencesSchema, 'body'),
  asyncHandler(updatePreferences),
);

