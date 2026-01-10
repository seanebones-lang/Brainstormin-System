export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('data: ' + JSON.stringify({status: 'streaming'}) + '\n\n'));
      for await (const chunk of generateIdeas(body, {stream: true})) {
        controller.enqueue(encoder.encode('data: ' + JSON.stringify(chunk) + '\n\n'));
      }
      controller.enqueue(encoder.encode('data: ' + JSON.stringify({done: true}) + '\n\n'));
      controller.close();
    }
  });
  return new Response(stream, {
    headers: {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive'}
  });
}