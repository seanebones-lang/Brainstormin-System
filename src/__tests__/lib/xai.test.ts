import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateIdeas } from '@/lib/xai';
import type { GenerateIdeasRequest } from '@/types';
import type { GenerateIdeasInput } from '@/lib/xai';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe('xAI Idea Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate ideas with valid input', async () => {
    const OpenAI = (await import('openai')).default;
    const mockCreate = OpenAI.prototype.chat.completions.create;

    // Mock streaming response
    const mockStream = async function* () {
      yield {
        choices: [
          {
            delta: {
              content: JSON.stringify({
                id: 'test-id-1',
                title: 'Test Idea 1',
                description: 'Test description 1',
                tags: ['test'],
              }) + '\n',
            },
          },
        ],
      };
      yield {
        choices: [
          {
            delta: {
              content: JSON.stringify({
                id: 'test-id-2',
                title: 'Test Idea 2',
                description: 'Test description 2',
                tags: ['test'],
              }) + '\n',
            },
          },
        ],
      };
    };

    vi.mocked(mockCreate).mockResolvedValue(mockStream() as unknown as AsyncIterable<{
      choices: Array<{ delta?: { content?: string } }>;
    }>);

    const input: GenerateIdeasRequest = {
      topic: 'AI for retail',
      numIdeas: 2,
    };

    const ideas = [];
    for await (const chunk of generateIdeas(input, { stream: true })) {
      if (chunk.type === 'idea') {
        ideas.push(chunk.data);
      }
    }

    expect(ideas.length).toBeGreaterThan(0);
    expect(ideas[0]).toHaveProperty('title');
    expect(ideas[0]).toHaveProperty('description');
    expect(ideas[0]).toHaveProperty('author', 'ai');
  });

  it('should handle errors gracefully', async () => {
    const OpenAI = (await import('openai')).default;
    const mockCreate = OpenAI.prototype.chat.completions.create;

    vi.mocked(mockCreate).mockRejectedValue(new Error('API Error'));

    const input: GenerateIdeasRequest = {
      topic: 'Test topic',
      numIdeas: 1,
    };

    await expect(async () => {
      const ideas = [];
      for await (const chunk of generateIdeas(input, { stream: true })) {
        ideas.push(chunk);
      }
    }).rejects.toThrow();
  });

  it('should respect numIdeas limit', async () => {
    const OpenAI = (await import('openai')).default;
    const mockCreate = OpenAI.prototype.chat.completions.create;

    const mockStream = async function* () {
      // Generate more ideas than requested
      for (let i = 0; i < 20; i++) {
        yield {
          choices: [
            {
              delta: {
                content:
                  JSON.stringify({
                    id: `test-id-${i}`,
                    title: `Test Idea ${i}`,
                    description: `Test description ${i}`,
                    tags: ['test'],
                  }) + '\n',
              },
            },
          ],
        };
      }
    };

    vi.mocked(mockCreate).mockResolvedValue(mockStream() as unknown as AsyncIterable<{
      choices: Array<{ delta?: { content?: string } }>;
    }>);

    const input: GenerateIdeasRequest = {
      topic: 'Test topic',
      numIdeas: 5,
    };

    const ideas = [];
    for await (const chunk of generateIdeas(input, { stream: true })) {
      if (chunk.type === 'idea') {
        ideas.push(chunk.data);
      }
    }

    expect(ideas.length).toBeLessThanOrEqual(5);
  });
});
