// Same Grok + Panels prompt/schema, but REMOVE Supabase imports/calls.
// Console.log(input/output) for debug.
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const IdeaSchema = z.object({ /* same + discussion_summary */ });

export type Idea = z.infer<typeof IdeaSchema>;

export async function generateIdeas(input: any): Promise<Idea[]> {
  console.log('Generating w/ input:', input);  // Debug
  // Full prompt (MIT Panels) as before
  const prompt = `...`;  // Unchanged
  const completion = await openai.chat.completions.create({ model: 'grok-beta', messages: [{role: 'user', content: prompt}] });
  const ideas = z.array(IdeaSchema).parse(JSON.parse(completion.choices[0].message.content));
  console.log('Generated ideas:', ideas);
  return ideas;
}