import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/)
    .optional(),
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
  EXTENSION_CHROME_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_API_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

const fallbackEncryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export const env = {
  ...parsed.data,
  ENCRYPTION_KEY:
    parsed.data.ENCRYPTION_KEY ?? (parsed.data.NODE_ENV === 'test' ? fallbackEncryptionKey : undefined),
};

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
