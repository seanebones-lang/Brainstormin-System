import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas, type Idea } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const schema = z.object({
  keywords: z.string().min(1),
  category: z.enum(['Productivity', 'E-commerce', 'Fintech', 'Healthtech', 'Edtech', 'Gaming', 'Social', 'Logistics', 'HR/Recruiting', 'Sustainability']),
  scale: z.enum(['SMB', 'Enterprise', 'Insider']),
  constraints: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = schema.parse(body);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Cache key
    const cacheKey = `ideas:${Buffer.from(JSON.stringify(validated)).toString('base64')}`;
    let { data: cached } = await supabase.from('idea_cache').select('ideas').eq('key', cacheKey).single();

    if (cached) {
      return NextResponse.json({ ideas: cached.ideas });
    }

    const ideas = await generateIdeas(validated);

    // Cache 24h
    await supabase.from('idea_cache').upsert({
      key: cacheKey,
      ideas,
      user_id: user.id,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Save to user history
    await supabase.from('user_ideas').insert({ user_id: user.id, ideas });

    return NextResponse.json({ ideas });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
