import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

export const generateIdeasSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  numIdeas: z.number().min(1).max(20).default(10),
  style: z.string().optional(),
});

export type GenerateIdeasInput = z.infer<typeof generateIdeasSchema>;

export const ideaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).optional().default([]),
});

export type Idea = z.infer<typeof ideaSchema>;

const SYSTEM_PROMPT = `You are a creative brainstorming assistant powered by Grok. Generate diverse, innovative, actionable ideas for the given topic.

Rules:
- Be creative, practical, and original.
- Output ONLY valid JSON objects, ONE PER LINE (for streaming).
- Format each: {"id": "unique-uuid-like", "title": "Short catchy title", "description": "2-3 sentence detailed explanation", "tags": ["tag1", "tag2"]}
- Exactly {numIdeas} ideas. No extra text.`;

export async function* generateIdeas(
  input: GenerateIdeasInput,
  options: { stream: boolean } = { stream: true }
): AsyncGenerator<{ type: 'idea'; data: Idea }> {
  const { topic, numIdeas, style = '' } = input;
  const userPrompt = style ? `${topic} in ${style} style.` : topic;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT.replace('{numIdeas}', numIdeas.toString()) },
    { role: 'user', content: userPrompt },
  ];

  try {
    if (options.stream) {
      const stream = await openai.chat.completions.create({
        model: 'grok-beta',
        messages,
        stream: true,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      let buffer = '';
      let ideaCount = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (!content) continue;

        buffer += content;

        // Parse complete JSON lines
        const lines = buffer.split('\n');
        buffer = lines.pop()?.trim() || ''; // Incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || ideaCount >= numIdeas) continue;

          try {
            const parsed = JSON.parse(trimmed);
            const idea = ideaSchema.parse(parsed);
            yield { type: 'idea', data: idea };
            ideaCount++;
          } catch (e) {
            // Ignore partial/invalid
          }
        }

        if (ideaCount >= numIdeas) break;
      }

      // Flush final buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          const idea = ideaSchema.parse(parsed);
          if (ideaCount < numIdeas) {
            yield { type: 'idea', data: idea };
          }
        } catch {}
      }
    } else {
      // Non-stream fallback
      const completion = await openai.chat.completions.create({
        model: 'grok-beta',
        messages,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const ideas = z.array(ideaSchema).safeParse(JSON.parse(content));
        if (ideas.success) {
          for (const idea of ideas.data.slice(0, numIdeas)) {
            yield { type: 'idea', data: idea };
          }
        }
      }
    }
  } catch (error) {
    console.error('xAI Generation Error:', error);
    throw new Error('Failed to generate ideas. Check XAI_API_KEY and quota.');
  }
}

// For non-stream full array (if needed)
export async function generateIdeasArray(input: GenerateIdeasInput): Promise<Idea[]> {
  const ideas: Idea[] = [];
  for await (const chunk of generateIdeas(input, { stream: true })) {
    if (chunk.type === 'idea') ideas.push(chunk.data);
  }
  return ideas;
}