import type { UserPreferences } from './types.js';

export const APP_NAME = 'ContextPassport';
export const API_PREFIX = '/api/v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PREFERENCES: UserPreferences = {
  autoCapture: true,
  autoInject: true,
  compressionLevel: 'balanced',
  autoCaptureTrigger: 'limit-detected',
  autoInjectBehavior: 'ask-first',
  sessionExpiryDays: 30,
  theme: 'dark',
};

export const PASSPORT_DIVIDER = '═══════════════════════════════════';
export const PASSPORT_SECTION_DIVIDER = '───────────────────────────────────';
