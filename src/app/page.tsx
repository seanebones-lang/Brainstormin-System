import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          eleven AI 🚀
        </h1>
        <p className="text-xl text-gray-700">
          Boardroom of humorous experts by NextEleven
        </p>
        <p className="text-lg text-gray-600">
          AI-powered idea generation with xAI Grok-β. Generate innovative, actionable ideas in real-time.
        </p>
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            aria-label="Enter the boardroom to start brainstorming"
          >
            Enter Boardroom
          </Link>
        </div>
        <div className="pt-8 text-sm text-gray-500">
          <p>Powered by Next.js 15 • React 19 • xAI Grok-β</p>
        </div>
      </div>
    </main>
  );
}
