'use client';

import { useEffect, useState } from 'react';
import GenerateForm from '@/components/GenerateForm';
import IdeaCard from '@/components/IdeaCard';
import { type Idea } from '@/lib/ai';

export default function Dashboard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (formData: FormData) => {
    setLoading(true);
    const input = Object.fromEntries(formData) as any;
    const cacheKey = `ideas_${JSON.stringify(input)}`;

    // LocalStorage cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setIdeas(JSON.parse(cached));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/ideas/generate', { method: 'POST', body: JSON.stringify(input) });
      const { ideas } = await res.json();
      localStorage.setItem(cacheKey, JSON.stringify(ideas));
      setIdeas(ideas);
    } catch {
      alert('Error - check XAI_API_KEY');
    }
    setLoading(false);
  };

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-green-100 p-4 rounded-xl mb-8 text-center'>
          <h1 className='text-3xl font-bold text-green-800'>Personal Testing Mode - No Login Required</h1>
          <p className='text-green-700'>xAI Grok + MIT Professor Panels (Propose → Critique → Consensus)</p>
        </div>
        <h1 className='text-4xl font-bold mb-8 text-gray-900'>Dashboard</h1>
        <GenerateForm onSubmit={handleGenerate} loading={loading} />
        {ideas.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
            {ideas.map((idea, i) => <IdeaCard key={i} idea={idea} />)}
          </div>
        )}
      </div>
    </div>
  );
}
