import { z } from 'zod';
import { SUPPORTED_PLATFORMS } from './types.js';

export const sessionMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  timestamp: z.string().optional(),
});

export const sessionPassportSchema = z.object({
  projectSummary: z.string().min(1),
  decisionsMade: z.array(z.string().min(1)).min(1),
  techStack: z.array(z.string().min(1)),
  filesMentioned: z.array(z.string().min(1)),
  lastAction: z.string().min(1),
  nextStep: z.string().min(1),
  keyCodeContext: z.string().default('No code snippet captured.'),
  entities: z.object({
    projectName: z.string().min(1),
    techStack: z.array(z.string().min(1)),
    files: z.array(z.string().min(1)),
    lastAction: z.string().min(1),
    nextStep: z.string().min(1),
  }),
});

export const createSessionSchema = z.object({
  platform: z.enum(SUPPORTED_PLATFORMS),
  title: z.string().min(1).max(180),
  rawHistory: z.array(sessionMessageSchema).min(1),
  passport: sessionPassportSchema.optional(),
  messageCount: z.number().int().positive(),
  tokenEstimate: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1).max(32)).max(10).default([]),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const updateSessionSchema = createSessionSchema.partial().extend({
  rawHistory: z.array(sessionMessageSchema).min(1).optional(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  query: z.string().optional(),
  platform: z.enum(SUPPORTED_PLATFORMS).optional(),
});

export const userPreferencesSchema = z.object({
  autoCapture: z.boolean().optional(),
  autoInject: z.boolean().optional(),
  compressionLevel: z.enum(['fast', 'balanced', 'thorough']).optional(),
  autoCaptureTrigger: z.enum(['limit-detected', 'manual']).optional(),
  autoInjectBehavior: z.enum(['always', 'ask-first']).optional(),
  sessionExpiryDays: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(-1)]).optional(),
  theme: z.enum(['dark', 'light']).optional(),
});

export const compressSessionSchema = z.object({
  platform: z.enum(SUPPORTED_PLATFORMS),
  rawHistory: z.array(sessionMessageSchema).min(1),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type CompressSessionInput = z.infer<typeof compressSessionSchema>;
