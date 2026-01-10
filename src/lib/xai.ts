import OpenAI from 'openai';
import { z } from 'zod';
import { ideaSchema, type Idea, type GenerateIdeasRequest, AIServiceError } from '@/types';
import { retryWithBackoff, isRetryableError } from './retry';
import { createCircuitBreaker } from './circuitBreaker';
import { logger } from './logger';

// Create circuit breaker for xAI service
const xaiCircuitBreaker = createCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitoringWindow: 60000, // 1 minute
});

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

/**
 * @deprecated Use GenerateIdeasRequest from '@/types' instead
 */
export const generateIdeasSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  numIdeas: z.number().min(1).max(20).default(10),
  style: z.string().optional(),
  sessionId: z.string().uuid().optional(),
});

export type GenerateIdeasInput = z.infer<typeof generateIdeasSchema> | GenerateIdeasRequest;

const SYSTEM_PROMPT = `You are a creative brainstorming assistant powered by Grok. Generate diverse, innovative, actionable ideas for the given topic.

Rules:
- Be creative, practical, and original.
- Output ONLY valid JSON objects, ONE PER LINE (for streaming).
- Format each: {"id": "uuid", "title": "Short catchy title", "description": "2-3 sentence detailed explanation", "tags": ["tag1", "tag2"], "author": "ai"}
- Exactly {numIdeas} ideas. No extra text.
- Each idea must have a valid UUID for the id field.`;

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
      // Execute through circuit breaker with retry
      const createStream = async () => {
        return await xaiCircuitBreaker.execute(() =>
          openai.chat.completions.create({
            model: 'grok-beta',
            messages,
            stream: true,
            temperature: 0.8,
            response_format: { type: 'json_object' },
          })
        );
      };

      let stream;
      try {
        stream = await retryWithBackoff(createStream, {
          maxRetries: 3,
          initialDelay: 1000,
          shouldRetry: isRetryableError,
        });
      } catch (retryError) {
        logger.error('Failed to create xAI stream after retries', retryError instanceof Error ? retryError : new Error(String(retryError)), {
          topic,
          numIdeas,
        });
        throw new AIServiceError('Failed to connect to AI service. Please try again later.', String(retryError));
      }

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
            // Ensure author is set to 'ai' for generated ideas
            const ideaData = { ...parsed, author: 'ai' as const, createdAt: new Date() };
            const idea = ideaSchema.parse(ideaData);
            yield { type: 'idea', data: idea };
            ideaCount++;
          } catch (e) {
            // Log error for debugging but ignore partial/invalid JSON
            logger.warn('Failed to parse idea chunk', {
              chunk: trimmed,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }

        if (ideaCount >= numIdeas) break;
      }

      // Flush final buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          const ideaData = { ...parsed, author: 'ai' as const, createdAt: new Date() };
          const idea = ideaSchema.parse(ideaData);
          if (ideaCount < numIdeas) {
            yield { type: 'idea', data: idea };
          }
        } catch (e) {
          // Log error for debugging but ignore partial/invalid JSON
          logger.warn('Failed to parse final buffer', {
            buffer,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    } else {
      // Non-stream fallback with circuit breaker and retry
      const createCompletion = async () => {
        return await xaiCircuitBreaker.execute(() =>
          openai.chat.completions.create({
            model: 'grok-beta',
            messages,
            temperature: 0.8,
            response_format: { type: 'json_object' },
          })
        );
      };

      let completion;
      try {
        completion = await retryWithBackoff(createCompletion, {
          maxRetries: 3,
          initialDelay: 1000,
          shouldRetry: isRetryableError,
        });
      } catch (retryError) {
        logger.error('Failed to create xAI completion after retries', retryError instanceof Error ? retryError : new Error(String(retryError)), {
          topic,
          numIdeas,
        });
        throw new AIServiceError('Failed to connect to AI service. Please try again later.', String(retryError));
      }

      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          // Handle both array and single object responses
          const ideasArray = Array.isArray(parsed) ? parsed : [parsed];
          const ideasWithDefaults = ideasArray.map((item: unknown) => ({
            ...item,
            author: 'ai' as const,
            createdAt: new Date(),
          }));
          const ideas = z.array(ideaSchema).safeParse(ideasWithDefaults);
          if (ideas.success) {
            for (const idea of ideas.data.slice(0, numIdeas)) {
              yield { type: 'idea', data: idea };
            }
          } else {
            throw new Error('Invalid idea format from AI service');
          }
        } catch (e) {
          throw new AIServiceError(
            'Failed to parse AI response',
            e instanceof Error ? e.message : 'Unknown parsing error'
          );
        }
      }
    }
  } catch (error) {
    // Use proper error type
    if (error instanceof AIServiceError) {
      logger.error('xAI Generation Error', error, { topic: input.topic, numIdeas: input.numIdeas });
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('xAI Generation Error', error instanceof Error ? error : new Error(errorMessage), {
      topic: input.topic,
      numIdeas: input.numIdeas,
    });
    throw new AIServiceError(
      'Failed to generate ideas. Check XAI_API_KEY and quota.',
      errorMessage
    );
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