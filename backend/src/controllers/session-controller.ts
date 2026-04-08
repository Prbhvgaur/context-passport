import type { RequestHandler } from 'express';
import { SessionService } from '../services/session-service.js';

let sessionService: SessionService | null = null;

const getSessionService = () => {
  sessionService ??= new SessionService();
  return sessionService;
};

export const createSession: RequestHandler = async (req, res) => {
  const session = await getSessionService().createSession(req.authUser!.uid, req.body);
  res.status(201).json({ success: true, data: session });
};

export const listSessions: RequestHandler = async (req, res) => {
  const { cursor, limit, platform, query } = req.query as {
    cursor?: string;
    limit?: number;
    platform?: Parameters<SessionService['listSessions']>[3];
    query?: string;
  };
  const sessions = await getSessionService().listSessions(
    req.authUser!.uid,
    cursor,
    limit,
    platform,
    query,
  );
  res.json({ success: true, data: sessions });
};

export const getSession: RequestHandler = async (req, res) => {
  const sessionId = String(req.params['id']);
  const session = await getSessionService().getSession(req.authUser!.uid, sessionId);
  res.json({ success: true, data: session });
};

export const updateSession: RequestHandler = async (req, res) => {
  const sessionId = String(req.params['id']);
  const session = await getSessionService().updateSession(req.authUser!.uid, sessionId, req.body);
  res.json({ success: true, data: session });
};

export const deleteSession: RequestHandler = async (req, res) => {
  const sessionId = String(req.params['id']);
  await getSessionService().deleteSession(req.authUser!.uid, sessionId);
  res.status(204).send();
};

export const resumeSession: RequestHandler = async (req, res) => {
  const sessionId = String(req.params['id']);
  const prompt = await getSessionService().buildResumePrompt(req.authUser!.uid, sessionId);
  res.json({ success: true, data: { prompt } });
};

export const compressSession: RequestHandler = async (req, res) => {
  const passport = await getSessionService().compress(req.body);
  res.json({ success: true, data: passport });
};
