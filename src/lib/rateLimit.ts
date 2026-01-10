import { LRUCache } from 'lru-cache';
import type { NextRequest } from 'next/server';
import { RateLimitError } from '@/types';

/**
 * Rate limiting implementation using LRU cache (in-memory)
 * For production, use @upstash/ratelimit with Redis for distributed systems
 */

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens per interval
}

// In-memory rate limit store (use Redis/Upstash in production)
const rateLimitStore = new LRUCache<string, number[]>({
  max: 10000, // Max entries in cache
  ttl: 1000 * 60 * 15, // 15 minutes TTL
});

/**
 * Get client identifier from request (IP address or user ID)
 */
function getIdentifier(request: NextRequest): string {
  // Try to get user ID from auth token (if authenticated)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // In production, extract user ID from JWT
    // For now, fall back to IP
  }

  // Get IP address from headers (consider X-Forwarded-For for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';

  return ip;
}

/**
 * Rate limit check
 * Returns true if request should be allowed, false if rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 requests per minute
  }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const identifier = getIdentifier(request);
  const now = Date.now();
  const windowStart = now - options.interval;

  // Get existing requests for this identifier
  const requests = rateLimitStore.get(identifier) || [];

  // Filter requests within current window
  const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  if (recentRequests.length >= options.uniqueTokenPerInterval) {
    // Calculate retry after (oldest request + interval)
    const oldestRequest = Math.min(...recentRequests);
    const retryAfter = Math.ceil((oldestRequest + options.interval - now) / 1000);

    return { allowed: false, retryAfter };
  }

  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);

  return { allowed: true };
}

/**
 * Rate limit middleware wrapper
 */
export async function rateLimit(
  request: NextRequest,
  options?: RateLimitOptions
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, options);

  if (!result.allowed) {
    throw new RateLimitError(result.retryAfter || 60);
  }

  return null; // Request allowed
}

/**
 * Rate limit configurations per endpoint
 */
export const rateLimitConfigs = {
  '/api/ideas/generate': {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 requests per minute
  },
  '/api/sessions': {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 20, // 20 requests per minute
  },
  '/api/sessions/*/vote': {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 50, // 50 requests per minute (voting is more frequent)
  },
  default: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100, // 100 requests per minute
  },
};

/**
 * Get rate limit config for a given path
 */
export function getRateLimitConfig(pathname: string): RateLimitOptions {
  if (pathname.startsWith('/api/ideas/generate')) {
    return rateLimitConfigs['/api/ideas/generate'];
  }
  if (pathname.startsWith('/api/sessions') && pathname.includes('/vote')) {
    return rateLimitConfigs['/api/sessions/*/vote'];
  }
  if (pathname.startsWith('/api/sessions')) {
    return rateLimitConfigs['/api/sessions'];
  }
  return rateLimitConfigs.default;
}
