import { NextRequest, NextResponse } from 'next/server';
import { voteIdea } from '@/lib/sessionManager';
import { isValidSessionId, isValidIdeaId } from '@/lib/sanitize';
import { getRateLimitConfig, checkRateLimit } from '@/lib/rateLimit';
import { ValidationError, NotFoundError, ApiResponse } from '@/types';

/**
 * POST /api/sessions/[sessionId]/vote/[ideaId]
 * Vote for an idea in a session
 * Implements rate limiting, input validation, and error handling
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string; ideaId: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Rate limiting (more lenient for voting)
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

    // Validate IDs format
    if (!isValidSessionId(params.sessionId)) {
      throw new ValidationError('Invalid session ID format');
    }

    if (!isValidIdeaId(params.ideaId)) {
      throw new ValidationError('Invalid idea ID format');
    }

    // TODO: Extract userId from auth token if authenticated
    // For now, allow anonymous voting (will be enhanced with auth)

    // Vote for idea
    const voteCount = voteIdea(params.sessionId, params.ideaId);

    if (voteCount === null) {
      throw new NotFoundError('Session or idea');
    }

    // TODO: Add authorization check (user can only vote on ideas in accessible sessions)
    // TODO: Implement duplicate vote prevention per user (requires auth)

    return NextResponse.json({
      success: true,
      data: { voteCount },
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
    console.error('Vote error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to vote. Please try again later.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}