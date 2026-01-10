'use client';

import { useState, FormEvent } from 'react';
import type { GenerateIdeasRequest } from '@/types';

interface GenerateFormProps {
  onSubmit: (formData: GenerateIdeasRequest) => void;
  loading: boolean;
}

/**
 * GenerateForm component - Form for generating ideas
 * Implements WCAG 2.2 Level AA accessibility standards
 */
export default function GenerateForm({ onSubmit, loading }: GenerateFormProps) {
  const [topic, setTopic] = useState('');
  const [numIdeas, setNumIdeas] = useState(10);
  const [style, setStyle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    if (!topic.trim()) {
      setErrors({ topic: 'Topic is required' });
      return;
    }

    if (topic.length > 200) {
      setErrors({ topic: 'Topic must be less than 200 characters' });
      return;
    }

    if (numIdeas < 1 || numIdeas > 20) {
      setErrors({ numIdeas: 'Number of ideas must be between 1 and 20' });
      return;
    }

    if (style && style.length > 100) {
      setErrors({ style: 'Style must be less than 100 characters' });
      return;
    }

    // Submit form
    const formData: GenerateIdeasRequest = {
      topic: topic.trim(),
      numIdeas,
      style: style.trim() || undefined,
    };

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-2xl mx-auto"
      aria-label="Idea generation form"
      noValidate
    >
      <div className="space-y-6">
        {/* Topic Input */}
        <div>
          <label htmlFor="topic" className="block text-sm font-semibold text-gray-700 mb-2">
            Topic <span className="text-red-500" aria-label="required">*</span>
          </label>
          <input
            id="topic"
            type="text"
            placeholder="e.g., AI for retail, Sustainable transportation, etc."
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              if (errors.topic) setErrors({ ...errors, topic: '' });
            }}
            className={`w-full p-4 border-2 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
              errors.topic ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            required
            aria-required="true"
            aria-invalid={!!errors.topic}
            aria-describedby={errors.topic ? 'topic-error' : undefined}
            maxLength={200}
            disabled={loading}
          />
          {errors.topic && (
            <p id="topic-error" className="mt-2 text-sm text-red-600" role="alert">
              {errors.topic}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {topic.length}/200 characters
          </p>
        </div>

        {/* Number of Ideas */}
        <div>
          <label htmlFor="numIdeas" className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Ideas
          </label>
          <input
            id="numIdeas"
            type="number"
            min="1"
            max="20"
            value={numIdeas}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setNumIdeas(Math.max(1, Math.min(20, value)));
              }
              if (errors.numIdeas) setErrors({ ...errors, numIdeas: '' });
            }}
            className={`w-full p-4 border-2 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
              errors.numIdeas ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.numIdeas}
            aria-describedby={errors.numIdeas ? 'numIdeas-error' : undefined}
            disabled={loading}
          />
          {errors.numIdeas && (
            <p id="numIdeas-error" className="mt-2 text-sm text-red-600" role="alert">
              {errors.numIdeas}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Choose between 1 and 20 ideas
          </p>
        </div>

        {/* Style (Optional) */}
        <div>
          <label htmlFor="style" className="block text-sm font-semibold text-gray-700 mb-2">
            Style <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            id="style"
            type="text"
            placeholder="e.g., innovative, practical, creative, etc."
            value={style}
            onChange={(e) => {
              setStyle(e.target.value);
              if (errors.style) setErrors({ ...errors, style: '' });
            }}
            className={`w-full p-4 border-2 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
              errors.style ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.style}
            aria-describedby={errors.style ? 'style-error' : undefined}
            maxLength={100}
            disabled={loading}
          />
          {errors.style && (
            <p id="style-error" className="mt-2 text-sm text-red-600" role="alert">
              {errors.style}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl font-bold text-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label={loading ? 'Generating ideas, please wait' : 'Generate ideas'}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
              Generating...
            </span>
          ) : (
            'Generate Ideas'
          )}
        </button>
      </div>
    </form>
  );
}
