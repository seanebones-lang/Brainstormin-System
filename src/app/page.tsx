'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  if (session) {
    router.push('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-400 to-purple-600 text-white">
      <h1 className="text-6xl font-bold mb-8">IdeaForge 🚀</h1>
      <p className="text-2xl mb-12 max-w-md text-center">AI-powered generator for innovative web/mobile app ideas.</p>
      <button
        onClick={handleLogin}
        className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-xl hover:bg-gray-100 transition"
      >
        Sign in with Google
      </button>
    </main>
  );
}
