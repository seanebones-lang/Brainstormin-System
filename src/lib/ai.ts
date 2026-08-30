import OpenAI from 'openai';
import { z } from 'zod';
import { ideaSchema, type Idea, type GenerateIdeasRequest, AIServiceError } from '@/types';
import { retryWithBackoff, isRetryableError } from './retry';
import { createCircuitBreaker } from './circuitBreaker';
import { logger } from './logger';

export interface AIProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

/**
 * Create an OpenAI-compatible client for any provider
 */
function createClient(config: AIProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

/**
 * Create circuit breaker for AI service
 */
function createAICircuitBreaker() {
  return createCircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    monitoringWindow: 60000, // 1 minute
  });
}

const SYSTEM_PROMPT = `You are a creative brainstorming assistant. Generate diverse, innovative, actionable ideas for the given topic.

Rules:
- Be creative, practical, and original.
- Output ONLY valid JSON objects, ONE PER LINE (for streaming).
- Format each: {"id": "uuid", "title": "Short catchy title", "description": "2-3 sentence detailed explanation", "tags": ["tag1", "tag2"], "author": "ai"}
- Exactly {numIdeas} ideas. No extra text.
- Each idea must have a valid UUID for the id field.`;

/**
 * Generate ideas using any OpenAI-compatible API
 */
export async function* generateIdeas(
  input: GenerateIdeasRequest,
  config: AIProviderConfig,
  options: { stream: boolean } = { stream: true }
): AsyncGenerator<{ type: 'idea'; data: Idea }> {
  const { topic, numIdeas, style = '' } = input;
  const userPrompt = style ? `${topic} in ${style} style.` : topic;

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT.replace('{numIdeas}', numIdeas.toString()) },
    { role: 'user' as const, content: userPrompt },
  ];

  const client = createClient(config);
  const circuitBreaker = createAICircuitBreaker();

  try {
    if (options.stream) {
      const createStream = async () => {
        return await circuitBreaker.execute(() =>
          client.chat.completions.create({
            model: config.model,
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
        logger.error('Failed to create AI stream after retries', retryError instanceof Error ? retryError : new Error(String(retryError)), {
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

        const lines = buffer.split('\n');
        buffer = lines.pop()?.trim() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || ideaCount >= numIdeas) continue;

          try {
            const parsed = JSON.parse(trimmed);
            const ideaData = { ...parsed, author: 'ai' as const, createdAt: new Date() };
            const idea = ideaSchema.parse(ideaData);
            yield { type: 'idea', data: idea };
            ideaCount++;
          } catch (e) {
            logger.warn('Failed to parse idea chunk', {
              chunk: trimmed,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }

        if (ideaCount >= numIdeas) break;
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          const ideaData = { ...parsed, author: 'ai' as const, createdAt: new Date() };
          const idea = ideaSchema.parse(ideaData);
          if (ideaCount < numIdeas) {
            yield { type: 'idea', data: idea };
          }
        } catch (e) {
          logger.warn('Failed to parse final buffer', {
            buffer,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    } else {
      const createCompletion = async () => {
        return await circuitBreaker.execute(() =>
          client.chat.completions.create({
            model: config.model,
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
        logger.error('Failed to create AI completion after retries', retryError instanceof Error ? retryError : new Error(String(retryError)), {
          topic,
          numIdeas,
        });
        throw new AIServiceError('Failed to connect to AI service. Please try again later.', String(retryError));
      }

      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          const ideasArray = Array.isArray(parsed) ? parsed : [parsed];
          const ideasWithDefaults = ideasArray.map((item: unknown) => ({
            ...(item as Record<string, unknown>),
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
    if (error instanceof AIServiceError) {
      logger.error('AI Generation Error', error, { topic: input.topic, numIdeas: input.numIdeas });
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('AI Generation Error', error instanceof Error ? error : new Error(errorMessage), {
      topic: input.topic,
      numIdeas: input.numIdeas,
    });
    throw new AIServiceError(
      'Failed to generate ideas. Check API key and quota.',
      errorMessage
    );
  }
}

export async function generateIdeasArray(input: GenerateIdeasRequest, config: AIProviderConfig): Promise<Idea[]> {
  const ideas: Idea[] = [];
  for await (const chunk of generateIdeas(input, config, { stream: true })) {
    if (chunk.type === 'idea') ideas.push(chunk.data);
  }
  return ideas;
}