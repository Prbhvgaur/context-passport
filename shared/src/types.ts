export const SUPPORTED_PLATFORMS = [
  'claude',
  'chatgpt',
  'gemini',
  'perplexity',
  'copilot',
  'grok',
] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export interface SessionPassportEntities {
  projectName: string;
  techStack: string[];
  files: string[];
  lastAction: string;
  nextStep: string;
}

export interface SessionPassport {
  projectSummary: string;
  decisionsMade: string[];
  techStack: string[];
  filesMentioned: string[];
  lastAction: string;
  nextStep: string;
  keyCodeContext: string;
  entities: SessionPassportEntities;
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  platform: SupportedPlatform;
  title: string;
  rawHistory: string;
  passport: string;
  entities: SessionPassportEntities;
  messageCount: number;
  tokenEstimate: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  tags: string[];
}

export type SessionSummary = Omit<SessionRecord, 'rawHistory' | 'passport'>;

export interface UserPreferences {
  autoCapture: boolean;
  autoInject: boolean;
  compressionLevel: 'fast' | 'balanced' | 'thorough';
  autoCaptureTrigger: 'limit-detected' | 'manual';
  autoInjectBehavior: 'always' | 'ask-first';
  sessionExpiryDays: 7 | 30 | 90 | -1;
  theme: 'dark' | 'light';
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  lastActiveAt: string;
  totalSessions: number;
  totalResumes: number;
  preferences: UserPreferences;
}
