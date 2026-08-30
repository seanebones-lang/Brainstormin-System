import { NextRequest, NextResponse } from 'next/server';
import { createSessionRequestSchema } from '@/types';
import { ValidationError, ApiResponse } from '@/types';

/**
 * POST /api/sessions
 * Create a new brainstorming session (server-side stub for client-side localStorage)
 * Sessions are managed client-side in localStorage
 * Force dynamic rendering to prevent static generation issues
 */
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Validate with Zod schema
    createSessionRequestSchema.parse(body);

    // Return session info - actual session created client-side
    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: 'client-side-' + Date.now(),
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