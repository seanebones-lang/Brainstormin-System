export interface Idea {
  id: string;
  text: string;
  author?: 'user' | 'ai';
  createdAt: Date;
}

export interface Session {
  id: string;
  topic: string;
  ideas: Idea[];
  votes: Record<string, number>;
  summary?: string;
  createdAt: Date;
}