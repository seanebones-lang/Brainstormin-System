import { NextRequest } from 'next/server';
import { generateIdeasSchema as schema, generateIdeas } from '@/lib/xai';

import type { GenerateIdeasInput } from '@/lib/xai';

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json()) as GenerateIdeasInput;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode('data: ' + JSON.stringify({status: 'streaming'}) + '\n\n'));
        try {
          for await (const chunk of generateIdeas(body, {stream: true})) {
            controller.enqueue(encoder.encode('data: ' + JSON.stringify(chunk) + '\n\n'));
          }
        } catch (error) {
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({error: 'Generation failed', details: error instanceof Error ? error.message : 'Unknown'}) + '\n\n'));
        }
        controller.enqueue(encoder.encode('data: ' + JSON.stringify({done: true}) + '\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Route Error:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid input: ' + (error instanceof Error ? error.message : 'Parse failed') }),
      { status: 400 }
    );
  }
}
