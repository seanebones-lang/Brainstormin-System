import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Rate limiting - simplified for local-first tool
 * Returns null (allowed) since rate limiting is handled client-side if needed
 * Can be enhanced with Upstash Redis for production deployments
 */

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens per interval
}

/**
 * Rate limit check - always allows for local-first usage
 * Override with Upstash Redis in production if needed
 */
export async function checkRateLimit(
  _request: NextRequest,
  _options: RateLimitOptions = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100, // 100 requests per minute
  }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // No server-side rate limiting for open-source local-first tool
  // Users run their own instances
  return { allowed: true };
}

/**
 * Rate limit middleware wrapper
 */
export async function rateLimit(
  _request: NextRequest,
  _options?: RateLimitOptions
): Promise<NextResponse | null> {
  return null; // Request allowed
}

/**
 * Rate limit configurations per endpoint (unused but kept for future)
 */
export const rateLimitConfigs = {
  '/api/ideas/generate': {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 requests per minute
  },
  '/api/sessions': {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 requests per minute
  },
  default: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100, // 100 requests per minute
  },
};

/**
 * Get rate limit config for a given path
 */
export function getRateLimitConfig(_pathname: string): RateLimitOptions {
  return rateLimitConfigs.default;
}