import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import type { Idea, Session } from '@/types';

/**
 * Test utilities for React Testing Library
 */

interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return <>{children}</>;
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

/**
 * Test data factories
 */
export const createMockIdea = (overrides?: Partial<Idea>): Idea => ({
  id: crypto.randomUUID(),
  title: 'Test Idea',
  description: 'This is a test idea description',
  tags: ['test', 'example'],
  author: 'ai',
  createdAt: new Date('2026-01-10'),
  updatedAt: new Date('2026-01-10'),
  ...overrides,
});

export const createMockSession = (overrides?: Partial<Session>): Session => ({
  id: crypto.randomUUID(),
  topic: 'Test Topic',
  ideas: [createMockIdea()],
  votes: {},
  status: 'active',
  createdAt: new Date('2026-01-10'),
  updatedAt: new Date('2026-01-10'),
  ...overrides,
});

/**
 * Mock OpenAI/xAI client
 */
export const createMockOpenAIClient = () => ({
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  id: crypto.randomUUID(),
                  title: 'Generated Idea',
                  description: 'AI-generated idea description',
                  tags: ['ai', 'generated'],
                },
              ]),
            },
          },
        ],
      }),
    },
  },
});

/**
 * Mock Supabase client
 */
export const createMockSupabaseClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    data: [],
    error: null,
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
});

/**
 * Wait for async updates
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));
