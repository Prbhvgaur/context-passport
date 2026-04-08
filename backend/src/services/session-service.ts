import type {
  CreateSessionInput,
  SessionMessage,
  SessionPassport,
  SessionRecord,
  UpdateSessionInput,
} from '@context-passport/shared';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, formatPassport } from '@context-passport/shared';
import { AppError } from '../utils/errors.js';
import { cacheService } from './cache-service.js';
import { CompressionService } from './compression-service.js';
import { dataStore, decodeSessionPassport, type SessionDocument, type SessionSummary } from './data-store.js';
import { EncryptionService } from './encryption-service.js';

const SESSION_CACHE_TTL = 60 * 5;

const toSessionResponse = (session: SessionDocument, encryptionService: EncryptionService) => {
  const rawHistory = JSON.parse(encryptionService.decrypt(session.rawHistory)) as SessionMessage[];
  const passport = decodeSessionPassport(encryptionService.decrypt(session.passport));

  return {
    ...session,
    rawHistory,
    passport,
  };
};

export class SessionService {
  private readonly compressionService = new CompressionService();
  private readonly encryptionService = new EncryptionService();

  public async createSession(userId: string, input: CreateSessionInput) {
    const passport = input.passport ?? (await this.compressionService.compress(input.rawHistory));
    const now = new Date().toISOString();
    const created = await dataStore.createSession({
      userId,
      platform: input.platform,
      title: input.title,
      rawHistory: this.encryptionService.encrypt(JSON.stringify(input.rawHistory)),
      passport: this.encryptionService.encrypt(JSON.stringify(passport)),
      entities: passport.entities,
      messageCount: input.messageCount,
      tokenEstimate: input.tokenEstimate,
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt ?? null,
      tags: input.tags,
    });

    await cacheService.delete(this.buildUserSessionsKey(userId));
    return toSessionResponse(created, this.encryptionService);
  }

  public async listSessions(
    userId: string,
    cursor: string | undefined,
    limit: number = DEFAULT_PAGE_SIZE,
    platform?: SessionRecord['platform'],
    query?: string,
  ) {
    const safeLimit = Math.min(limit, MAX_PAGE_SIZE);
    return dataStore.listSessions(userId, {
      cursor,
      limit: safeLimit,
      platform,
      query,
    });
  }

  public async getSession(userId: string, sessionId: string) {
    const cacheKey = this.buildSessionKey(userId, sessionId);
    const cached = await cacheService.get<ReturnType<typeof toSessionResponse>>(cacheKey);
    if (cached) {
      return cached;
    }

    const session = await dataStore.getSession(userId, sessionId);
    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found.');
    }

    const response = toSessionResponse(session, this.encryptionService);
    await cacheService.set(cacheKey, response, SESSION_CACHE_TTL);
    return response;
  }

  public async updateSession(userId: string, sessionId: string, input: UpdateSessionInput) {
    const existing = await dataStore.getSession(userId, sessionId);
    if (!existing) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found.');
    }

    const rawHistory =
      input.rawHistory !== undefined
        ? this.encryptionService.encrypt(JSON.stringify(input.rawHistory))
        : existing.rawHistory;

    const existingPassport = decodeSessionPassport(this.encryptionService.decrypt(existing.passport));
    const passport: SessionPassport =
      input.passport ??
      (input.rawHistory ? await this.compressionService.compress(input.rawHistory) : existingPassport);

    const updated = await dataStore.updateSession(userId, sessionId, {
      platform: input.platform,
      title: input.title,
      rawHistory,
      passport: this.encryptionService.encrypt(JSON.stringify(passport)),
      entities: passport.entities,
      messageCount: input.messageCount,
      tokenEstimate: input.tokenEstimate,
      expiresAt: input.expiresAt,
      tags: input.tags,
    });

    if (!updated) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found.');
    }

    await Promise.all([
      cacheService.delete(this.buildSessionKey(userId, sessionId)),
      cacheService.delete(this.buildUserSessionsKey(userId)),
    ]);

    return toSessionResponse(updated, this.encryptionService);
  }

  public async deleteSession(userId: string, sessionId: string) {
    const deleted = await dataStore.deleteSession(userId, sessionId);
    if (!deleted) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found.');
    }

    await Promise.all([
      cacheService.delete(this.buildSessionKey(userId, sessionId)),
      cacheService.delete(this.buildUserSessionsKey(userId)),
    ]);
  }

  public async compress(input: { rawHistory: SessionMessage[] }) {
    return this.compressionService.compress(input.rawHistory);
  }

  public async buildResumePrompt(userId: string, sessionId: string) {
    const session = await this.getSession(userId, sessionId);
    await dataStore.incrementResumeCount(userId);

    return formatPassport(
      session.platform,
      new Date(session.updatedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      session.passport,
    );
  }

  public async usageStats(userId: string) {
    const items = await dataStore.listSessions(userId, {
      limit: MAX_PAGE_SIZE,
    });
    return {
      totalSessions: items.items.length,
      platformsUsed: Array.from(new Set(items.items.map((item) => item.platform))),
    };
  }

  private buildSessionKey(userId: string, sessionId: string) {
    return `session:${userId}:${sessionId}`;
  }

  private buildUserSessionsKey(userId: string) {
    return `sessions:${userId}`;
  }
}

export type SessionSummaryResponse = SessionSummary;

