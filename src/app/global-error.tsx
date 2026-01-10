'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error Boundary for Next.js App Router
 * Catches errors in the root layout
 * This is a fallback if the regular error.tsx fails
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry)
    console.error('Global application error:', error);

    // In production, send to Sentry or other monitoring service
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error);
    // }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-8">
          <div className="max-w-2xl text-center space-y-6">
            <div role="alert" aria-live="assertive">
              <h1 className="text-6xl font-bold text-red-600 mb-4">⚠️</h1>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Critical Error
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                A critical error occurred. Please refresh the page.
              </p>

              <button
                onClick={reset}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="Reset and try again"
              >
                Reset Application
              </button>

              {error.digest && (
                <p className="mt-4 text-sm text-gray-500">
                  Error ID: <code className="bg-gray-200 px-2 py-1 rounded">{error.digest}</code>
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
