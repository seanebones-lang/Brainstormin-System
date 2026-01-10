import { NextRequest, NextResponse } from 'next/server';
import { voteIdea } from '@/lib/sessionManager';

export async function POST(req: NextRequest, { params }: { params: { sessionId: string; ideaId: string } }) {
  const count = voteIdea(params.sessionId, params.ideaId);
  if (count === null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ voteCount: count });
}