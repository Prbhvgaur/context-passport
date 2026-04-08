import { Router } from 'express';

export const healthRouter = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Healthy service
 */
healthRouter.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

