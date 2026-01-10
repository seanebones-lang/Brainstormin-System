'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary for Next.js App Router
 * Catches errors in the app directory
 * Implements WCAG 2.2 Level AA accessibility standards
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry)
    console.error('Application error:', error);

    // In production, send to Sentry or other monitoring service
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error);
    // }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-8">
      <div className="max-w-2xl text-center space-y-6">
        <div role="alert" aria-live="assertive">
          <h1 className="text-6xl font-bold text-red-600 mb-4" aria-label="Error">
            ⚠️
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Something went wrong!
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            We encountered an unexpected error. Please try again.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="mb-6 text-left bg-gray-100 p-4 rounded-lg">
              <summary className="cursor-pointer font-semibold text-gray-800 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-sm text-gray-600 overflow-auto">
                <code>{error.message}</code>
                {error.digest && (
                  <>
                    <br />
                    <span className="text-xs text-gray-500">Error ID: {error.digest}</span>
                  </>
                )}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="Try again"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Go to home page"
            >
              Go Home
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Go to dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            If this problem persists, please{' '}
            <a
              href="mailto:support@example.com"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              contact support
            </a>
            .
          </p>
          {error.digest && (
            <p className="mt-2">
              Error ID: <code className="bg-gray-200 px-2 py-1 rounded">{error.digest}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
