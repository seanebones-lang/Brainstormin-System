import { z } from 'zod';
import { generateIdeasSchema } from './xai';

export const createSessionSchema = z.object({
  topic: z.string().min(1).max(200),
});

export const addIdeaSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const generateIdeasInSessionSchema = generateIdeasSchema.extend({
  numIdeas: z.number().min(1).max(10).optional().default(5),
});

export const summarizeSchema = z.object({});