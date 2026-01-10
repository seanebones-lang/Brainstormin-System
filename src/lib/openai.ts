import OpenAI from 'openai';
import { z } from 'zod';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const IdeaSchema = z.object({
  title: z.string().max(50),
  description: z.string(),
  target_scale: z.enum(['SMB', 'Enterprise', 'Insider']),
  key_features: z.array(z.string()),
  tech_stack: z.array(z.string()),
  monetization: z.string(),
  feasibility_score: z.number().min(1).max(10),
  novelty_rationale: z.string(),
});

export type Idea = z.infer<typeof IdeaSchema>;

export async function generateIdeas(input: { keywords: string; category: string; scale: string; constraints?: string[] }): Promise<Idea[]> {
  const prompt = `Generate exactly 5 unique, feasible app ideas for "${input.keywords}" in category "${input.category}". Scale: ${input.scale}. Constraints: ${input.constraints?.join(', ') || 'none'}.

Output VALID JSON array only, matching this schema per idea: {title, description (2 sentences), target_scale, key_features (array 3-5), tech_stack (array), monetization, feasibility_score (number 1-10), novelty_rationale}.

Prioritize novel, ethical ideas from trends (PH/Crunchbase). No saturated concepts like basic to-dos.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  const rawIdeas = completion.choices[0]?.message?.content;
  if (!rawIdeas) throw new Error('No response from OpenAI');

  // Parse & validate
  let ideas: Idea[];
  try {
    ideas = JSON.parse(rawIdeas);
  } catch {
    throw new Error('Invalid JSON from OpenAI');
  }

  return z.array(IdeaSchema).parse(ideas);
}
