'use client';

import type { Idea, Session } from '@/types';

const STORAGE_KEY = 'brainstormin-sessions';
const SETTINGS_KEY = 'brainstormin-settings';

export interface UserSettings {
  provider: 'xai' | 'openai' | 'anthropic' | 'custom';
  baseURL: string;
  apiKey: string;
  model: string;
}

export function getStoredSettings(): UserSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getDefaultSettings(): UserSettings {
  return {
    provider: 'xai',
    baseURL: 'https://api.x.ai/v1',
    apiKey: '',
    model: 'grok-4-1-fast-reasoning',
  };
}

function getSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Array<{
      id: string;
      topic: string;
      ideas: Array<{
        id: string;
        title: string;
        description: string;
        tags: string[];
        author: 'user' | 'ai';
        createdAt: string;
        updatedAt?: string;
      }>;
      votes: Record<string, number>;
      summary?: string;
      status: 'active' | 'archived' | 'completed';
      createdAt: string;
      updatedAt?: string;
    }>;
    // Convert date strings back to Date objects
    return parsed.map((session) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: session.updatedAt ? new Date(session.updatedAt) : undefined,
      ideas: session.ideas.map((idea) => ({
        ...idea,
        createdAt: new Date(idea.createdAt),
        updatedAt: idea.updatedAt ? new Date(idea.updatedAt) : undefined,
      })),
    }));
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

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
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const sessions = getSessions();
  sessions.unshift(session); // Newest first
  saveSessions(sessions);
  return id;
}

export function getSession(sessionId: string): Session | null {
  const sessions = getSessions();
  return sessions.find((s) => s.id === sessionId) ?? null;
}

export function getAllSessions(): Session[] {
  return getSessions();
}

export function deleteSession(sessionId: string): boolean {
  const sessions = getSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  if (filtered.length === sessions.length) return false;
  saveSessions(filtered);
  return true;
}

export function addIdea(
  sessionId: string,
  title: string,
  description: string,
  tags: string[] = [],
  author: 'user' | 'ai' = 'user'
): string | null {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex === -1) return null;
  
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
  
  sessions[sessionIndex].ideas.push(idea);
  sessions[sessionIndex].updatedAt = new Date();
  saveSessions(sessions);
  return id;
}

export function voteIdea(sessionId: string, ideaId: string): number | null {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex === -1) return null;
  
  const ideaExists = sessions[sessionIndex].ideas.some((idea) => idea.id === ideaId);
  if (!ideaExists) return null;
  
  sessions[sessionIndex].votes[ideaId] = (sessions[sessionIndex].votes[ideaId] ?? 0) + 1;
  sessions[sessionIndex].updatedAt = new Date();
  saveSessions(sessions);
  return sessions[sessionIndex].votes[ideaId];
}

export function setSummary(sessionId: string, summary: string): boolean {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex === -1) return false;
  sessions[sessionIndex].summary = summary;
  sessions[sessionIndex].updatedAt = new Date();
  saveSessions(sessions);
  return true;
}

export function exportSessions(): string {
  const sessions = getSessions();
  return JSON.stringify(sessions, null, 2);
}

export function importSessions(json: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'Invalid format: expected array of sessions' };
    }
    // Validate each session has required fields
    for (const session of parsed) {
      if (!session.id || !session.topic || !Array.isArray(session.ideas)) {
        return { success: false, count: 0, error: 'Invalid session format' };
      }
    }
    saveSessions(parsed);
    return { success: true, count: parsed.length };
  } catch (e) {
    return { success: false, count: 0, error: e instanceof Error ? e.message : 'Parse error' };
  }
}