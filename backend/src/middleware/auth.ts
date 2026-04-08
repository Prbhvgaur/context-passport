import type { RequestHandler } from 'express';
import { dataStore } from '../services/data-store.js';
import { firebaseAuth } from '../services/firebase-admin-service.js';
import { AppError } from '../utils/errors.js';

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Authorization header missing.');
    }

    if (!firebaseAuth) {
      if (process.env['NODE_ENV'] === 'test') {
        const fakeUserId = req.headers['x-test-user-id'];
        if (typeof fakeUserId !== 'string') {
          throw new AppError(401, 'AUTH_REQUIRED', 'Missing test user id.');
        }

        req.authUser = {
          uid: fakeUserId,
          email: req.headers['x-test-user-email'] as string | undefined,
          name: req.headers['x-test-user-name'] as string | undefined,
          picture: req.headers['x-test-user-picture'] as string | undefined,
          firebase: {
            sign_in_provider: 'google.com',
          },
        } as unknown as typeof req.authUser;
        const authUser = req.authUser;
        if (!authUser) {
          throw new AppError(401, 'AUTH_REQUIRED', 'Test authentication failed.');
        }

        await dataStore.upsertUserFromToken(authUser);
        next();
        return;
      }

      throw new AppError(500, 'AUTH_CONFIG_ERROR', 'Authentication service is not configured.');
    }

    const token = header.replace('Bearer ', '').trim();
    const decoded = await firebaseAuth.verifyIdToken(token, true);
    if (decoded.firebase.sign_in_provider !== 'google.com') {
      throw new AppError(403, 'GOOGLE_AUTH_REQUIRED', 'Google authentication is required.');
    }

    req.authUser = decoded;
    await dataStore.upsertUserFromToken(decoded);
    next();
  } catch (error) {
    next(error);
  }
};
