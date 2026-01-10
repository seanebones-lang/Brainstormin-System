import { z } from 'zod';
import {
  createSessionRequestSchema,
  generateIdeasRequestSchema,
  addIdeaRequestSchema,
} from '@/types';

/**
 * @deprecated Use schemas from '@/types' instead
 * These are kept for backwards compatibility
 */
export const createSessionSchema = createSessionRequestSchema;

export const addIdeaSchema = addIdeaRequestSchema.omit({ sessionId: true });

export const generateIdeasInSessionSchema = generateIdeasRequestSchema.extend({
  numIdeas: z.number().min(1).max(10).optional().default(5),
});

export const summarizeSchema = z.object({});

// Re-export voteIdeaRequestSchema for backward compatibility
export { voteIdeaRequestSchema } from '@/types';