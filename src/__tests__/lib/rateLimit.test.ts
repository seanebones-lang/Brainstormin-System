import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rateLimit';
import type { NextRequest } from 'next/server';

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests within rate limit', async () => {
    const mockRequest = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === 'x-forwarded-for') return '192.168.1.1';
          if (name === 'x-real-ip') return null;
          return null;
        }),
      },
      nextUrl: {
        pathname: '/api/ideas/generate',
      },
    } as unknown as NextRequest;

    const config = getRateLimitConfig('/api/ideas/generate');
    const result = await checkRateLimit(mockRequest, config);

    expect(result.allowed).toBe(true);
  });

  it('should get correct rate limit config for different endpoints', async () => {
    const generateConfig = getRateLimitConfig('/api/ideas/generate');
    expect(generateConfig.uniqueTokenPerInterval).toBe(100); // Now defaults to 100

    const sessionsConfig = getRateLimitConfig('/api/sessions');
    expect(sessionsConfig.uniqueTokenPerInterval).toBe(100);

    const voteConfig = getRateLimitConfig('/api/sessions/123/vote/456');
    expect(voteConfig.uniqueTokenPerInterval).toBe(100);

    const defaultConfig = getRateLimitConfig('/api/unknown');
    expect(defaultConfig.uniqueTokenPerInterval).toBe(100);
  });

  it('should extract IP from X-Forwarded-For header', async () => {
    const mockRequest = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
          if (name === 'x-real-ip') return null;
          return null;
        }),
      },
      nextUrl: {
        pathname: '/api/ideas/generate',
      },
    } as unknown as NextRequest;

    const config = getRateLimitConfig('/api/ideas/generate');
    const result = await checkRateLimit(mockRequest, config);

    // Should use first IP from X-Forwarded-For
    expect(result.allowed).toBe(true);
  });
});
