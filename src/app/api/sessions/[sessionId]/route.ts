import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/sessionManager';

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = getSession(params.sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  return NextResponse.json(session);
}