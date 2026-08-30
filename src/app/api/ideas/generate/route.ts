import { NextRequest, NextResponse } from 'next/server';
import { generateIdeasRequestSchema, ValidationError, AIServiceError } from '@/types';
import { sanitizeTopic, sanitizeStyle } from '@/lib/sanitize';
import type { GenerateIdeasRequest, StreamChunk, AIProviderConfig } from '@/types';

/**
 * POST /api/ideas/generate
 * Generate ideas using any OpenAI-compatible API with SSE streaming
 * Accepts provider config in request body or headers
 * This route is fully dynamic - no static generation
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Validate with Zod schema
    const validated = generateIdeasRequestSchema.parse(body);

    // Extract provider config from request (body or headers)
    const providerConfig: AIProviderConfig = {
      baseURL: (validated as { baseURL?: string }).baseURL || req.headers.get('x-ai-baseurl') || 'https://api.x.ai/v1',
      apiKey: (validated as { apiKey?: string }).apiKey || req.headers.get('x-ai-apikey') || '',
      model: (validated as { model?: string }).model || req.headers.get('x-ai-model') || 'grok-4-1-fast-reasoning',
    };

    if (!providerConfig.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: 'API key is required. Provide it in request body or x-ai-apikey header.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

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

          // Import generateIdeas lazily inside the async function
          const aiModule = await import('@/lib/ai');
          const generateIdeas = aiModule.generateIdeas;

          // Generate ideas with timeout
          const generationPromise = (async () => {
            for await (const chunk of generateIdeas(input, providerConfig, { stream: true })) {
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

          if (error instanceof AIServiceError) {
            errorMessage = error.message;
          } else if (error instanceof Error && error.message.includes('timeout')) {
            errorMessage = 'Request timeout';
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

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