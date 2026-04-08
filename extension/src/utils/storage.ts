import type { SessionSummary, UserPreferences, UserProfile } from '@context-passport/shared';
import { DEFAULT_PREFERENCES } from '@context-passport/shared';
import { getFromStorage, removeFromStorage, setInStorage } from './chrome';

export const STORAGE_KEYS = {
  authToken: 'context-passport.auth-token',
  user: 'context-passport.user',
  sessions: 'context-passport.sessions',
  preferences: 'context-passport.preferences',
  theme: 'context-passport.theme',
} as const;

export const readStoredToken = () => getFromStorage<string>(STORAGE_KEYS.authToken);
export const writeStoredToken = (value: string) => setInStorage(STORAGE_KEYS.authToken, value);
export const clearStoredToken = () => removeFromStorage(STORAGE_KEYS.authToken);

export const readStoredUser = () => getFromStorage<UserProfile>(STORAGE_KEYS.user);
export const writeStoredUser = (value: UserProfile) => setInStorage(STORAGE_KEYS.user, value);
export const clearStoredUser = () => removeFromStorage(STORAGE_KEYS.user);

export const readStoredSessions = async () =>
  (await getFromStorage<SessionSummary[]>(STORAGE_KEYS.sessions)) ?? [];
export const writeStoredSessions = (value: SessionSummary[]) => setInStorage(STORAGE_KEYS.sessions, value);

export const readPreferences = async () =>
  (await getFromStorage<UserPreferences>(STORAGE_KEYS.preferences)) ?? DEFAULT_PREFERENCES;
export const writePreferences = (value: UserPreferences) => setInStorage(STORAGE_KEYS.preferences, value);

export const readTheme = async () =>
  (await getFromStorage<'dark' | 'light'>(STORAGE_KEYS.theme)) ?? DEFAULT_PREFERENCES.theme;
export const writeTheme = (value: 'dark' | 'light') => setInStorage(STORAGE_KEYS.theme, value);
