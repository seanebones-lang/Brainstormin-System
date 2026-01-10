import Link from 'next/link';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-400 to-purple-600 text-white'>
      <h1 className='text-6xl font-bold mb-8'>IdeaForge 🚀 Personal Mode</h1>
      <p className='text-2xl mb-12 max-w-md text-center'>MIT Panels powered by xAI Grok. No login - test freely.</p>
      <Link href='/dashboard' className='bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-xl hover:bg-gray-100 transition'>
        Go to Dashboard → Generate Ideas
      </Link>
    </main>
  );
}
