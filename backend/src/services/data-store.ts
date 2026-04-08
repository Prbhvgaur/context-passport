import type {
  SessionPassport,
  SessionRecord,
  SupportedPlatform,
  UserPreferences,
  UserProfile,
} from '@context-passport/shared';
import { DEFAULT_PREFERENCES } from '@context-passport/shared';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';
import { firestore as firestoreInstance, hasFirebaseCredentials } from './firebase-admin-service.js';

export interface SessionSummary extends Omit<SessionRecord, 'rawHistory' | 'passport'> {}

export interface SessionDocument extends SessionSummary {
  rawHistory: string;
  passport: string;
}

export interface SessionListResult {
  items: SessionSummary[];
  nextCursor: string | null;
}

export interface SessionListOptions {
  cursor?: string;
  limit: number;
  platform?: SupportedPlatform;
  query?: string;
}

export interface DataStore {
  upsertUserFromToken(token: DecodedIdToken): Promise<UserProfile>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserProfile>;
  createSession(session: Omit<SessionDocument, 'id'>): Promise<SessionDocument>;
  listSessions(userId: string, options: SessionListOptions): Promise<SessionListResult>;
  getSession(userId: string, sessionId: string): Promise<SessionDocument | null>;
  updateSession(
    userId: string,
    sessionId: string,
    session: Partial<Omit<SessionDocument, 'id' | 'userId' | 'createdAt'>>,
  ): Promise<SessionDocument | null>;
  deleteSession(userId: string, sessionId: string): Promise<boolean>;
  incrementResumeCount(userId: string): Promise<void>;
  reset?(): Promise<void>;
}

class MemoryDataStore implements DataStore {
  private readonly users = new Map<string, UserProfile>();
  private readonly sessions = new Map<string, SessionDocument>();

  public async upsertUserFromToken(token: DecodedIdToken): Promise<UserProfile> {
    const existing = this.users.get(token.uid);
    const now = new Date().toISOString();
    const next: UserProfile = existing ?? {
      userId: token.uid,
      email: token.email ?? '',
      displayName: token['name'] ?? token.email ?? 'Unknown user',
      photoURL: token.picture ?? '',
      createdAt: now,
      lastActiveAt: now,
      totalSessions: 0,
      totalResumes: 0,
      preferences: DEFAULT_PREFERENCES,
    };

    next.email = token.email ?? next.email;
    next.displayName = token['name'] ?? next.displayName;
    next.photoURL = token.picture ?? next.photoURL;
    next.lastActiveAt = now;
    this.users.set(token.uid, next);

    return next;
  }

  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.users.get(userId) ?? null;
  }

  public async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>,
  ): Promise<UserProfile> {
    const existing = this.users.get(userId);
    if (!existing) {
      throw new Error('User not found');
    }

    const updated: UserProfile = {
      ...existing,
      preferences: {
        ...existing.preferences,
        ...preferences,
      },
      lastActiveAt: new Date().toISOString(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  public async createSession(session: Omit<SessionDocument, 'id'>): Promise<SessionDocument> {
    const id = randomUUID();
    const created: SessionDocument = { ...session, id };
    this.sessions.set(id, created);

    const user = this.users.get(session.userId);
    if (user) {
      user.totalSessions += 1;
      this.users.set(session.userId, user);
    }

    return created;
  }

  public async listSessions(userId: string, options: SessionListOptions): Promise<SessionListResult> {
    const items = Array.from(this.sessions.values())
      .filter((session) => session.userId === userId)
      .filter((session) => (options.platform ? session.platform === options.platform : true))
      .filter((session) => {
        if (!options.query) {
          return true;
        }

        const haystack = `${session.title} ${session.tags.join(' ')} ${session.entities.projectName}`.toLowerCase();
        return haystack.includes(options.query.toLowerCase());
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    const startIndex = options.cursor
      ? items.findIndex((item) => item.updatedAt === options.cursor) + 1
      : 0;
    const slice = items.slice(startIndex, startIndex + options.limit);
    const summaries = slice.map(({ rawHistory, passport, ...rest }) => rest);
    const nextCursor = slice.length === options.limit ? slice.at(-1)?.updatedAt ?? null : null;

    return { items: summaries, nextCursor };
  }

  public async getSession(userId: string, sessionId: string): Promise<SessionDocument | null> {
    const session = this.sessions.get(sessionId);
    return session?.userId === userId ? session : null;
  }

  public async updateSession(
    userId: string,
    sessionId: string,
    session: Partial<Omit<SessionDocument, 'id' | 'userId' | 'createdAt'>>,
  ): Promise<SessionDocument | null> {
    const existing = this.sessions.get(sessionId);
    if (!existing || existing.userId !== userId) {
      return null;
    }

    const updated: SessionDocument = {
      ...existing,
      ...session,
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  public async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    const existing = this.sessions.get(sessionId);
    if (!existing || existing.userId !== userId) {
      return false;
    }

    this.sessions.delete(sessionId);
    return true;
  }

  public async incrementResumeCount(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      return;
    }

    user.totalResumes += 1;
    user.lastActiveAt = new Date().toISOString();
    this.users.set(userId, user);
  }

  public async reset(): Promise<void> {
    this.users.clear();
    this.sessions.clear();
  }
}

class FirestoreDataStore extends MemoryDataStore {
  public override async upsertUserFromToken(token: DecodedIdToken): Promise<UserProfile> {
    const db = firestoreInstance!;
    const ref = db.collection('users').doc(token.uid);
    const existing = await ref.get();
    const now = new Date().toISOString();
    const next: UserProfile = existing.exists
      ? (existing.data() as UserProfile)
      : {
          userId: token.uid,
          email: token.email ?? '',
          displayName: token['name'] ?? token.email ?? 'Unknown user',
          photoURL: token.picture ?? '',
          createdAt: now,
          lastActiveAt: now,
          totalSessions: 0,
          totalResumes: 0,
          preferences: DEFAULT_PREFERENCES,
        };
    next.email = token.email ?? next.email;
    next.displayName = token['name'] ?? next.displayName;
    next.photoURL = token.picture ?? next.photoURL;
    next.lastActiveAt = now;
    await ref.set(next, { merge: true });
    return next;
  }

  public override async getUserProfile(userId: string): Promise<UserProfile | null> {
    const snapshot = await firestoreInstance!.collection('users').doc(userId).get();
    return snapshot.exists ? (snapshot.data() as UserProfile) : null;
  }

  public override async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>,
  ): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      throw new Error('User not found');
    }

    const updated: UserProfile = {
      ...existing,
      preferences: {
        ...existing.preferences,
        ...preferences,
      },
      lastActiveAt: new Date().toISOString(),
    };
    await firestoreInstance!.collection('users').doc(userId).set(updated, { merge: true });
    return updated;
  }

  public override async createSession(session: Omit<SessionDocument, 'id'>): Promise<SessionDocument> {
    const ref = firestoreInstance!.collection('sessions').doc();
    const created: SessionDocument = { ...session, id: ref.id };
    await ref.set(created);
    const user = await this.getUserProfile(session.userId);
    if (user) {
      await firestoreInstance!.collection('users').doc(session.userId).set(
        {
          totalSessions: user.totalSessions + 1,
          lastActiveAt: new Date().toISOString(),
        },
        { merge: true },
      );
    }
    return created;
  }

  public override async listSessions(userId: string, options: SessionListOptions): Promise<SessionListResult> {
    let query = firestoreInstance!
      .collection('sessions')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .limit(options.limit + 10);

    if (options.platform) {
      query = query.where('platform', '==', options.platform);
    }

    if (options.cursor) {
      query = query.startAfter(options.cursor);
    }

    const snapshot = await query.get();
    const documents = snapshot.docs.map((doc) => doc.data() as SessionDocument);
    const filtered = options.query
      ? documents.filter((session) =>
          `${session.title} ${session.tags.join(' ')} ${session.entities.projectName}`
            .toLowerCase()
            .includes(options.query!.toLowerCase()),
        )
      : documents;
    const limited = filtered.slice(0, options.limit);

    return {
      items: limited.map(({ rawHistory, passport, ...rest }) => rest),
      nextCursor: limited.length === options.limit ? limited.at(-1)?.updatedAt ?? null : null,
    };
  }

  public override async getSession(userId: string, sessionId: string): Promise<SessionDocument | null> {
    const snapshot = await firestoreInstance!.collection('sessions').doc(sessionId).get();
    if (!snapshot.exists) {
      return null;
    }

    const session = snapshot.data() as SessionDocument;
    return session.userId === userId ? session : null;
  }

  public override async updateSession(
    userId: string,
    sessionId: string,
    session: Partial<Omit<SessionDocument, 'id' | 'userId' | 'createdAt'>>,
  ): Promise<SessionDocument | null> {
    const existing = await this.getSession(userId, sessionId);
    if (!existing) {
      return null;
    }

    const updated: SessionDocument = {
      ...existing,
      ...session,
      updatedAt: new Date().toISOString(),
    };
    await firestoreInstance!.collection('sessions').doc(sessionId).set(updated, { merge: true });
    return updated;
  }

  public override async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    const existing = await this.getSession(userId, sessionId);
    if (!existing) {
      return false;
    }

    await firestoreInstance!.collection('sessions').doc(sessionId).delete();
    return true;
  }

  public override async incrementResumeCount(userId: string): Promise<void> {
    const existing = await this.getUserProfile(userId);
    if (!existing) {
      return;
    }

    await firestoreInstance!.collection('users').doc(userId).set(
      {
        totalResumes: existing.totalResumes + 1,
        lastActiveAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }
}

export const dataStore: DataStore = hasFirebaseCredentials ? new FirestoreDataStore() : new MemoryDataStore();

export const decodeSessionPassport = (value: string): SessionPassport => JSON.parse(value) as SessionPassport;
