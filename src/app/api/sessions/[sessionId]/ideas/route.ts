import { NextRequest, NextResponse } from 'next/server';
import { addIdeaSchema } from '@/lib/apiSchemas';
import { addIdea } from '@/lib/sessionManager';

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const body = addIdeaSchema.parse(await req.json());
    const ideaId = addIdea(params.sessionId, body.text, 'user');
    if (!ideaId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ ideaId });
  } catch (error) {
    console.error('Add idea error:', error);
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
}