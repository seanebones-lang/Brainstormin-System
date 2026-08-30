/**
 * Environment validation with Zod
 * Validates all required environment variables at startup
 * Allows dummy values during build for static generation
 */

import { z } from 'zod';

const envSchema = z.object({
  // Optional: Default AI provider settings (can be overridden by user)
  DEFAULT_AI_PROVIDER: z.enum(['xai', 'openai', 'anthropic', 'custom']).default('xai'),
  DEFAULT_AI_BASE_URL: z.string().url().default('https://api.x.ai/v1'),
  DEFAULT_AI_MODEL: z.string().default('grok-4-1-fast-reasoning'),
  
  // Optional: Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function getBuildTimeEnv(): Env {
  // Return dummy values for build-time static generation
  return {
    DEFAULT_AI_PROVIDER: (process.env.DEFAULT_AI_PROVIDER as 'xai' | 'openai' | 'anthropic' | 'custom') || 'xai',
    DEFAULT_AI_BASE_URL: process.env.DEFAULT_AI_BASE_URL || 'https://api.x.ai/v1',
    DEFAULT_AI_MODEL: process.env.DEFAULT_AI_MODEL || 'grok-4-1-fast-reasoning',
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  };
}

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  
  // During build (next build), allow dummy values
  // At runtime, require real values
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.NEXT_PHASE === 'phase-production-server' ||
                      process.env.NODE_ENV === 'test';
  
  if (isBuildTime) {
    cachedEnv = getBuildTimeEnv();
    return cachedEnv;
  }
  
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .flatMap(([field, msgs]) => msgs.map(msg => `${field}: ${msg}`))
      .join('; ');
    throw new Error(`Environment validation failed: ${messages}`);
  }
  
  cachedEnv = parsed.data;
  return cachedEnv;
}

// Export validated env for easy importing
export const env = getEnv();