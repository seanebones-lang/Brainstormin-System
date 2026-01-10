import { NextRequest, NextResponse } from 'next/server';
import { createSessionRequestSchema } from '@/types';
import { createSession } from '@/lib/sessionManager';
import { sanitizeTopic } from '@/lib/sanitize';
import { getRateLimitConfig, checkRateLimit } from '@/lib/rateLimit';
import { ValidationError, ApiResponse } from '@/types';

/**
 * POST /api/sessions
 * Create a new brainstorming session
 * Implements rate limiting, input sanitization, and error handling
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Rate limiting
    const rateLimitConfig = getRateLimitConfig(req.nextUrl.pathname);
    const rateLimitResult = await checkRateLimit(req, rateLimitConfig);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryable: true,
            details: { retryAfter: rateLimitResult.retryAfter },
            action: { type: 'retry' as const },
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Validate with Zod schema
    const validated = createSessionRequestSchema.parse(body);

    // Sanitize input
    const sanitizedTopic = sanitizeTopic(validated.topic);

    // Create session (use userId if authenticated, otherwise undefined)
    const sessionId = createSession(sanitizedTopic, validated.userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            retryable: error.retryable,
          },
        },
        { status: error.statusCode }
      );
    }

    // Unknown errors
    console.error('Create session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create session. Please try again later.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}