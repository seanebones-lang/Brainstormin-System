import { NextRequest, NextResponse } from 'next/server';
import { addIdeaRequestSchema } from '@/types';
import { addIdea } from '@/lib/sessionManager';
import { isValidSessionId, sanitizeTopic } from '@/lib/sanitize';
import { getRateLimitConfig, checkRateLimit } from '@/lib/rateLimit';
import { ValidationError, NotFoundError, ApiResponse } from '@/types';

/**
 * POST /api/sessions/[sessionId]/ideas
 * Add an idea to a session
 * Implements rate limiting, input sanitization, and error handling
 */
export async function POST(
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Validate with Zod schema (extend with sessionId from params)
    const validated = addIdeaRequestSchema.parse({ ...body, sessionId: params.sessionId });

    // Sanitize input
    const sanitizedTitle = sanitizeTopic(validated.title); // Reuse sanitizeTopic for title
    const sanitizedDescription = validated.description
      .replace(/[<>\"']/g, '')
      .trim()
      .substring(0, 2000);
    const sanitizedTags = validated.tags
      .map((tag) => tag.replace(/[<>\"']/g, '').trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags

    // Add idea to session
    const ideaId = addIdea(
      params.sessionId,
      sanitizedTitle,
      sanitizedDescription,
      sanitizedTags,
      'user'
    );

    if (!ideaId) {
      throw new NotFoundError('Session');
    }

    // TODO: Add authorization check (user can only add ideas to their own sessions or public sessions)

    return NextResponse.json(
      {
        success: true,
        data: { ideaId },
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
    console.error('Add idea error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add idea. Please try again later.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}