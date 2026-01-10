/**
 * Retry utility with exponential backoff
 * Implements fault tolerance for external API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    shouldRetry: options.shouldRetry || (() => true),
  };

  let lastError: Error;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors are retryable
  if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
    return true;
  }

  // Timeout errors are retryable
  if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    return true;
  }

  // 5xx errors are retryable
  if (error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
    return true;
  }

  // Rate limit errors with retry-after are retryable
  if (error.message.includes('429') || error.message.includes('rate limit')) {
    return true;
  }

  // 4xx errors (except 429) are not retryable
  if (error.message.includes('40') || error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
    return false;
  }

  // Default: assume not retryable
  return false;
}
