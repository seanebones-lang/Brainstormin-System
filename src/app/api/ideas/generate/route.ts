import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas } from '@/lib/ai';
import { z } from 'zod';

const schema = z.object({ keywords: z.string(), category: z.enum(['Productivity','E-commerce','Fintech','Healthtech','Edtech','Gaming','Social','Logistics','HR/Recruiting','Sustainability']), scale: z.enum(['SMB','Enterprise','Insider']) });

export async function POST(req: NextRequest) {
  try {
    const validated = schema.parse(await req.json());
    const ideas = await generateIdeas(validated);
    return NextResponse.json({ ideas });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input or API key missing' }, { status: 400 });
  }
}
