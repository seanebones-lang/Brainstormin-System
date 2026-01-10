'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for React
 * Catches errors in child components and displays fallback UI
 * Implements WCAG 2.2 Level AA accessibility standards
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service (e.g., Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, send to Sentry or other monitoring service
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-2xl text-center space-y-6">
            <h1 className="text-6xl font-bold text-red-600 mb-4" aria-label="Error">
              ⚠️
            </h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Something went wrong!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-gray-100 p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold text-gray-800 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-sm text-gray-600 overflow-auto">
                  <code>{this.state.error.message}</code>
                  {this.state.error.stack && (
                    <>
                      <br />
                      <code className="text-xs text-gray-500">{this.state.error.stack}</code>
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={this.handleReset}
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
        </div>
      );
    }

    return this.props.children;
  }
}
