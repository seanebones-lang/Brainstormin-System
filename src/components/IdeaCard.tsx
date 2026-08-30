'use client';

import type { Idea } from '@/types';
import { useTypewriter } from '@/hooks/useTypewriter';

interface IdeaCardProps {
  idea: Idea;
  voteCount?: number;
  onVote?: (ideaId: string) => void;
  showTypewriter?: boolean;
  typewriterSpeed?: number;
}

/**
 * IdeaCard component displays an idea with typewriter effect
 * Implements WCAG 2.2 Level AA accessibility standards
 */
export default function IdeaCard({
  idea,
  voteCount = 0,
  onVote,
  showTypewriter = true,
  typewriterSpeed = 30,
}: IdeaCardProps) {
  const displayedTitle = useTypewriter(idea.title, {
    speed: typewriterSpeed,
    delay: 0,
  });
  const displayedDescription = useTypewriter(idea.description, {
    speed: typewriterSpeed,
    delay: idea.title.length * typewriterSpeed + 100,
  });

  const handleVote = () => {
    if (onVote) {
      onVote(idea.id);
    }
  };

  return (
    <article
      className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group"
      aria-label={`Idea: ${idea.title}`}
    >
      <header className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {showTypewriter ? displayedTitle : idea.title}
        </h3>
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2" role="list" aria-label="Idea tags">
            {idea.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                role="listitem"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed min-h-[3rem]">
          {showTypewriter ? displayedDescription : idea.description}
        </p>
      </div>

      <footer className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span aria-label={`Created by ${idea.author}`}>
            {idea.author === 'ai' ? '🤖 AI Generated' : '👤 User Submitted'}
          </span>
          <time dateTime={idea.createdAt.toISOString()}>
            {new Date(idea.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>

        {onVote && (
          <button
            onClick={handleVote}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Vote for idea: ${idea.title}. Current vote count: ${voteCount}`}
            aria-pressed={voteCount > 0}
          >
            <span aria-hidden="true">👍</span>
            <span>{voteCount}</span>
          </button>
        )}
      </footer>
    </article>
  );
}
