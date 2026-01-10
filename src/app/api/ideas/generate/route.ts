import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas } from '@/lib/xai';
import { generateIdeasRequestSchema, ValidationError, AIServiceError, RateLimitError } from '@/types';
import { sanitizeTopic, sanitizeStyle } from '@/lib/sanitize';
import { getRateLimitConfig, checkRateLimit } from '@/lib/rateLimit';
import type { GenerateIdeasRequest, StreamChunk } from '@/types';

/**
 * POST /api/ideas/generate
 * Generate ideas using xAI Grok with SSE streaming
 * Implements rate limiting, input sanitization, and error handling
 */
export async function POST(req: NextRequest) {
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
    const validated = generateIdeasRequestSchema.parse(body);

    // Sanitize input
    const sanitizedTopic = sanitizeTopic(validated.topic);
    const sanitizedStyle = validated.style ? sanitizeStyle(validated.style) : undefined;

    // Create sanitized input
    const input: GenerateIdeasRequest = {
      topic: sanitizedTopic,
      numIdeas: validated.numIdeas,
      style: sanitizedStyle,
      sessionId: validated.sessionId,
    };

    // Set timeout for long-running requests (30 seconds)
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout after 30 seconds'));
      }, 30000);
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          const statusChunk: StreamChunk = {
            type: 'status',
            data: { status: 'streaming' },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(statusChunk)}\n\n`));

          // Generate ideas with timeout
          const generationPromise = (async () => {
            for await (const chunk of generateIdeas(input, { stream: true })) {
              const streamChunk: StreamChunk = {
                type: chunk.type,
                data: chunk.data,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(streamChunk)}\n\n`));
            }
          })();

          // Race between generation and timeout
          await Promise.race([generationPromise, timeoutPromise]);

          // Send completion
          const doneChunk: StreamChunk = { type: 'done' };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));
          controller.close();
        } catch (error) {
          // Handle errors gracefully
          let errorMessage = 'Generation failed';
          const errorCode = error instanceof AIServiceError ? error.code : 
                           (error instanceof Error && error.message.includes('timeout')) ? 'TIMEOUT_ERROR' : 
                           'GENERATION_ERROR';

          if (error instanceof AIServiceError) {
            errorMessage = error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          const retryable = error instanceof AIServiceError ? error.retryable : true;

          const errorChunk: StreamChunk = {
            type: 'error',
            data: {
              error: errorMessage,
              details: error instanceof Error ? error.stack : undefined,
            },
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for nginx
      },
    });
  } catch (error) {
    // Handle validation and other errors
    if (error instanceof ValidationError || error instanceof RateLimitError) {
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

    // Unknown errors - don't expose internals
    // eslint-disable-next-line no-console
    console.error('Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred. Please try again later.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
