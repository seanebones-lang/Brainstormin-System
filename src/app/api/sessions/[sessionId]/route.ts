import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/sessionManager';
import { isValidSessionId } from '@/lib/sanitize';
import { getRateLimitConfig, checkRateLimit } from '@/lib/rateLimit';
import { ValidationError, NotFoundError, ApiResponse } from '@/types';

/**
 * GET /api/sessions/[sessionId]
 * Retrieve a session by ID
 * Implements rate limiting, input validation, and error handling
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse<ApiResponse>> {
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

    // Validate session ID format
    if (!isValidSessionId(params.sessionId)) {
      throw new ValidationError('Invalid session ID format');
    }

    // Get session
    const session = getSession(params.sessionId);
    if (!session) {
      throw new NotFoundError('Session');
    }

    // TODO: Add authorization check (user can only access their own sessions or public sessions)

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt?.toISOString(),
        ideas: session.ideas.map((idea) => ({
          ...idea,
          createdAt: idea.createdAt.toISOString(),
          updatedAt: idea.updatedAt?.toISOString(),
        })),
      },
    });
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

    // Handle not found errors
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryable: false,
          },
        },
        { status: error.statusCode }
      );
    }

    // Unknown errors
    console.error('Get session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve session. Please try again later.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}