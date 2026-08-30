'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import GenerateForm from '@/components/GenerateForm';
import IdeaCard from '@/components/IdeaCard';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/hooks/useSettings';
import type { Idea, StreamChunk, GenerateIdeasRequest } from '@/types';
import { generateIdeasRequestSchema } from '@/types';

/**
 * Dashboard page - Main UI for idea generation
 * Implements streaming SSE with typewriter effect
 */
export default function DashboardPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { settings, isLoaded } = useSettings();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleGenerate = useCallback(async (formData: GenerateIdeasRequest) => {
    if (!isLoaded) {
      setError('Settings not loaded yet. Please wait.');
      return;
    }
    
    if (!settings.apiKey) {
      setError('Please configure your API key in Settings first.');
      setSettingsOpen(true);
      return;
    }

    // Reset state
    setIdeas([]);
    setError(null);
    setIsStreaming(true);

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Validate input
      const validated = generateIdeasRequestSchema.parse(formData);

      // Create session if not exists
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionResponse = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: validated.topic }),
          signal: abortController.signal,
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to create session');
        }

        const sessionData = await sessionResponse.json();
        currentSessionId = sessionData.sessionId;
        setSessionId(currentSessionId);
      }

      // Stream ideas with provider config
      const response = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-ai-baseurl': settings.baseURL,
          'x-ai-apikey': settings.apiKey,
          'x-ai-model': settings.model,
        },
        body: JSON.stringify({
          ...validated,
          baseURL: settings.baseURL,
          apiKey: settings.apiKey,
          model: settings.model,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6); // Remove 'data: ' prefix
              try {
                const chunk: StreamChunk = JSON.parse(dataStr);

                if (chunk.type === 'idea' && chunk.data) {
                  const idea = chunk.data as Idea;
                  setIdeas((prev) => [...prev, idea]);
                } else if (chunk.type === 'error') {
                  const errorMsg = (chunk.data as { error: string; details?: unknown }).error;
                  setError(errorMsg);
                  setIsStreaming(false);
                  break;
                } else if (chunk.type === 'done') {
                  setIsStreaming(false);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE chunk:', dataStr, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        setIsStreaming(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ideas';
      setError(errorMessage);
      setIsStreaming(false);
    }
  }, [sessionId, settings, isLoaded]);

  const handleVote = useCallback(async (ideaId: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/vote/${ideaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const data = await response.json();
      setVotes((prev) => ({ ...prev, [ideaId]: data.voteCount }));
    } catch (err) {
      console.error('Vote error:', err);
      // Could show toast notification here
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center py-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Idea Forge 🚀
            </h1>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg bg-white/80 hover:bg-white shadow-lg text-gray-600 hover:text-gray-900 transition"
              aria-label="Open AI provider settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <p className="text-lg text-gray-600">
            Generate innovative ideas powered by any OpenAI-compatible API
          </p>
        </header>

        {/* Error Display */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-lg"
            role="alert"
            aria-live="assertive"
          >
            <h2 className="font-semibold mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 text-red-600 hover:text-red-800 underline"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Generate Form */}
        <section aria-label="Idea generation form">
          <GenerateForm onSubmit={handleGenerate} loading={isStreaming} />
        </section>

        {/* Ideas List */}
        <section aria-label="Generated ideas">
          {ideas.length === 0 && !isStreaming && !error && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl mb-2">No ideas yet</p>
              <p>Fill out the form above to start generating ideas!</p>
            </div>
          )}

          {isStreaming && ideas.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600" />
              <p className="mt-4 text-gray-600">Generating ideas...</p>
            </div>
          )}

          {ideas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  voteCount={votes[idea.id] || 0}
                  onVote={sessionId ? handleVote : undefined}
                  showTypewriter={true}
                  typewriterSpeed={30}
                />
              ))}
            </div>
          )}

          {isStreaming && ideas.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600" />
              <p className="mt-2 text-gray-600">Generating more ideas...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}