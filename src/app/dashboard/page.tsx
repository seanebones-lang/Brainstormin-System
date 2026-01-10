'use client';

import GenerateForm from '@/components/GenerateForm';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';

type Idea = {
  title: string;
  description: string;
  // ... full type from lib
};

export default function Dashboard() {
  const supabase = useSupabaseClient();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const { ideas } = await res.json();
      setIdeas(ideas);
    } catch (error) {
      alert('Error generating ideas');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Dashboard</h1>
        <GenerateForm onSubmit={handleGenerate} loading={loading} />
        {ideas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {ideas.map((idea, i) => (
              <IdeaCard key={i} idea={idea} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
