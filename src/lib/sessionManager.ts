import crypto from 'crypto';
import type { Idea, Session } from '@/types';

const sessions = new Map<string, Session>();

function generateId(): string {
  return crypto.randomUUID();
}

export function createSession(topic: string, userId?: string): string {
  const id = generateId();
  const session: Session = {
    id,
    topic,
    userId,
    ideas: [],
    votes: {},
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  sessions.set(id, session);
  return id;
}

export function getSession(sessionId: string): Session | null {
  return sessions.get(sessionId) ?? null;
}

export function addIdea(
  sessionId: string,
  title: string,
  description: string,
  tags: string[] = [],
  author: 'user' | 'ai' = 'user'
): string | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const id = generateId();
  const idea: Idea = {
    id,
    title,
    description,
    tags,
    author,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  session.ideas.push(idea);
  session.updatedAt = new Date();
  return id;
}

export function voteIdea(sessionId: string, ideaId: string, _userId?: string): number | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  // Check if idea exists in session
  const ideaExists = session.ideas.some((idea) => idea.id === ideaId);
  if (!ideaExists) return null;
  
  // If userId provided, implement duplicate vote prevention (in real DB, use unique constraint)
  // For now, allow multiple votes but could be enhanced
  session.votes[ideaId] = (session.votes[ideaId] ?? 0) + 1;
  session.updatedAt = new Date();
  return session.votes[ideaId];
}

export function setSummary(sessionId: string, summary: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.summary = summary;
  session.updatedAt = new Date();
  return true;
}

export function deleteExpiredSessions(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  for (const [id, session] of sessions.entries()) {
    if (session.createdAt < cutoff) sessions.delete(id);
  }
}

// Cleanup on module load (serverless ok)
deleteExpiredSessions();