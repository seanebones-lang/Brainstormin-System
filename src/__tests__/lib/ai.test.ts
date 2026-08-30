import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { GenerateIdeasRequest } from '@/types';

describe('AI Idea Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockProviderConfig = {
    baseURL: 'https://api.example.com/v1',
    apiKey: 'test-key',
    model: 'test-model',
  };

  it('should generate ideas with valid input', async () => {
    const mockCreate = vi.fn();

    vi.doMock('openai', () => ({
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      })),
    }));

    // Re-import to get mocked version
    const { generateIdeas: mockedGenerateIdeas } = await import('@/lib/ai');

    // Mock streaming response
    const mockStream = async function* () {
      yield {
        choices: [
          {
            delta: {
              content: JSON.stringify({
                id: '550e8400-e29b-41d4-a716-446655440001',
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
                id: '550e8400-e29b-41d4-a716-446655440002',
                title: 'Test Idea 2',
                description: 'Test description 2',
                tags: ['test'],
              }) + '\n',
            },
          },
        ],
      };
    };

    mockCreate.mockResolvedValue(mockStream());

    const input: GenerateIdeasRequest = {
      topic: 'AI for retail',
      numIdeas: 2,
    };

    const ideas = [];
    for await (const chunk of mockedGenerateIdeas(input, mockProviderConfig, { stream: true })) {
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
    const mockCreate = vi.fn();

    vi.doMock('openai', () => ({
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      })),
    }));

    const { generateIdeas: mockedGenerateIdeas } = await import('@/lib/ai');

    mockCreate.mockRejectedValue(new Error('API Error'));

    const input: GenerateIdeasRequest = {
      topic: 'Test topic',
      numIdeas: 1,
    };

    await expect(async () => {
      const ideas = [];
      for await (const chunk of mockedGenerateIdeas(input, mockProviderConfig, { stream: true })) {
        ideas.push(chunk);
      }
    }).rejects.toThrow();
  });
});