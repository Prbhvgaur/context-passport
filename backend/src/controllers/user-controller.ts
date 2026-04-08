import type { RequestHandler } from 'express';
import { SessionService } from '../services/session-service.js';
import { UserService } from '../services/user-service.js';

const userService = new UserService();
let sessionService: SessionService | null = null;

const getSessionService = () => {
  sessionService ??= new SessionService();
  return sessionService;
};

export const getProfile: RequestHandler = async (req, res) => {
  const profile = await userService.getProfile(req.authUser!.uid);
  const usage = await getSessionService().usageStats(req.authUser!.uid);

  res.json({
    success: true,
    data: {
      ...profile,
      usage,
    },
  });
};

export const updatePreferences: RequestHandler = async (req, res) => {
  const profile = await userService.updatePreferences(req.authUser!.uid, req.body);
  res.json({ success: true, data: profile });
};
