// Add stream mode
async function* streamIdeas(input: any) {
  // Same prompt + 'Output CHUNKED: STREAM_START\n{"ideas":[]} STREAM_IDEA{"title":"...","discussion_summary":"..." partial} IDEA_END\n... FINAL_JSON'
  const stream = await openai.chat.completions.create({
    model: 'grok-beta',
    messages: [...],
    stream: true,
  });
  let buffer = '';
  for await (const chunk of stream) {
    buffer += chunk.choices[0]?.delta?.content || '';
    // Yield parsed partial ideas (Zod lenient)
    yield parseChunks(buffer);
  }
}
export async function generateIdeas(input: any, {stream = false} = {}) {
  if (stream) return streamIdeas(input);
  // Fallback non-stream
}