/**
 * Unified type definitions for the Brainstormin-System
 * 
 * This file consolidates all type definitions to ensure consistency
 * across the codebase, including AI-generated and user-submitted ideas.
 */

import { z } from 'zod';

/**
 * Idea types - unified schema for both AI-generated and user-submitted ideas
 */
export const ideaSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  tags: z.array(z.string()).default([]),
  author: z.enum(['user', 'ai']).default('ai'),
  createdAt: z.coerce.date().or(z.date()),
  updatedAt: z.coerce.date().or(z.date()).optional(),
});

export type Idea = z.infer<typeof ideaSchema>;

/**
 * Session types - represents a brainstorming session
 */
export const sessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  topic: z.string().min(1).max(200),
  ideas: z.array(ideaSchema).default([]),
  votes: z.record(z.string().uuid(), z.number().int().min(0)).default({}),
  summary: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
  createdAt: z.coerce.date().or(z.date()),
  updatedAt: z.coerce.date().or(z.date()).optional(),
});

export type Session = z.infer<typeof sessionSchema>;

/**
 * Vote tracking - individual vote record
 */
export const voteSchema = z.object({
  id: z.string().uuid(),
  ideaId: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.coerce.date().or(z.date()),
});

export type Vote = z.infer<typeof voteSchema>;

/**
 * API request/response types
 */
export const createSessionRequestSchema = z.object({
  topic: z.string().min(1).max(200),
  userId: z.string().uuid().optional(),
});

export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;

export const generateIdeasRequestSchema = z.object({
  topic: z.string().min(1).max(200),
  numIdeas: z.number().int().min(1).max(20).default(10),
  style: z.string().max(100).optional(),
  sessionId: z.string().uuid().optional(),
});

export type GenerateIdeasRequest = z.infer<typeof generateIdeasRequestSchema>;

export const addIdeaRequestSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  tags: z.array(z.string()).default([]),
});

export type AddIdeaRequest = z.infer<typeof addIdeaRequestSchema>;

export const voteIdeaRequestSchema = z.object({
  sessionId: z.string().uuid(),
  ideaId: z.string().uuid(),
});

export type VoteIdeaRequest = z.infer<typeof voteIdeaRequestSchema>;

/**
 * API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
    retryable?: boolean;
    action?: {
      type: 'redirect' | 'retry' | 'none';
      path?: string;
    };
  };
}

export interface StreamChunk {
  type: 'idea' | 'status' | 'error' | 'done';
  data?: Idea | { status: string } | { error: string; details?: unknown };
  requestId?: string;
}

/**
 * User types (if using Supabase Auth)
 */
export interface User {
  id: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Error types
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown,
    public retryable = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details, false);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, undefined, false);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 'RATE_LIMIT', 429, { retryAfter }, true);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'AI_SERVICE_ERROR', 502, details, true);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, undefined, false);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403, undefined, false);
  }
}
