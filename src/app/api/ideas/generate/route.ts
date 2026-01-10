import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas } from '@/lib/ai';
import { z } from 'zod';

const schema = z.object({ keywords: z.string(), category: z.string(), scale: z.string(), constraints: z.array(z.string()).optional() });

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const ideas = await generateIdeas(body);
    return NextResponse.json({ ideas });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
}