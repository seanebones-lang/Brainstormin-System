import { describe, it, expect, vi } from 'vitest';
import { generateIdeas } from './xai';

vi.mock('openai');

describe('xAI Ideas', () => {
  it('generates ideas', async () => {
    const ideas = [];
    for await (const chunk of generateIdeas({ topic: 'test' })) {
      ideas.push(chunk);
    }
    expect(ideas.length).toBeGreaterThan(0);
  });
});
