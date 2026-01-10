import crypto from 'crypto';
import type { Idea, Session } from '@/types/api';

const sessions = new Map<string, Session>();

function generateId(): string {
  return crypto.randomUUID();
}

export function createSession(topic: string): string {
  const id = generateId();
  const session: Session = {
    id,
    topic,
    ideas: [],
    votes: {},
    createdAt: new Date(),
  };
  sessions.set(id, session);
  return id;
}

export function getSession(sessionId: string): Session | null {
  return sessions.get(sessionId) ?? null;
}

export function addIdea(sessionId: string, text: string, author: 'user' | 'ai' = 'user'): string | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const id = generateId();
  const idea: Idea = { id, text, author, createdAt: new Date() };
  session.ideas.push(idea);
  return id;
}

export function voteIdea(sessionId: string, ideaId: string): number | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.votes[ideaId] = (session.votes[ideaId] ?? 0) + 1;
  return session.votes[ideaId];
}

export function setSummary(sessionId: string, summary: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.summary = summary;
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