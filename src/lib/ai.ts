import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const IdeaSchema = z.object({
  title: z.string().max(50),
  description: z.string(),
  target_scale: z.enum(['SMB', 'Enterprise', 'Insider']),
  key_features: z.array(z.string()),
  tech_stack: z.array(z.string()),
  monetization: z.string(),
  feasibility_score: z.number().min(1).max(10),
  novelty_rationale: z.string(),
  discussion_summary: z.string(),  // NEW: Panel consensus
});

export type Idea = z.infer<typeof IdeaSchema>;

export async function generateIdeas(input: { keywords: string; category: string; scale: string; constraints?: string[] }): Promise<Idea[]> {
  const panel1 = [
    'MIT Marketing Prof: Focus viral/monetization',
    'MIT Eng Prof: Tech feasibility/scalability',
    'MIT Product Prof: MVP features/user fit',
    'MIT Design/UX Prof: UI/engagement',
    'MIT Scale Expert: SMB→Enterprise path'
  ].join('; ');

  const panel2 = [
    'MIT Critique Profs: Question assumptions, gaps, risks',
    'Devil\'s Advocate: Saturation? Cost? Ethics?'
  ].join('; ');

  const prompt = `SIMULATE MIT PROFESSOR PANELS for ideas on "${input.keywords}" (${input.category}, ${input.scale}, constraints: ${input.constraints?.join(', ') || 'none'}).

PANEL 1 (${panel1}): Propose 5 raw ideas (title/desc/features/tech/monetization/score/rationale).

PANEL 2 (${panel2}): Critique Panel 1 (biases/gaps/feasibility).

CONSENSUS: Refine to 5 FINAL ideas w/ discussion_summary (Panel1→Panel2→resolved).

Output ONLY valid JSON array matching schema (incl. discussion_summary). High-impact, novel, ethical.`;

  const completion = await openai.chat.completions.create({
    model: 'grok-beta',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const rawIdeas = completion.choices[0]?.message?.content;
  const ideas = z.array(IdeaSchema).parse(JSON.parse(rawIdeas || '[]'));

  return ideas;
}
