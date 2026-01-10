import { NextRequest, NextResponse } from 'next/server';
import { createSessionSchema } from '@/lib/apiSchemas';
import { createSession } from '@/lib/sessionManager';

export async function POST(req: NextRequest) {
  try {
    const body = createSessionSchema.parse(await req.json());
    const sessionId = createSession(body.topic);
    return NextResponse.json({ sessionId, createdAt: new Date().toISOString() }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
}