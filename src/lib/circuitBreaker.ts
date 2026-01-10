/**
 * Circuit Breaker implementation for fault tolerance
 * Prevents cascade failures by opening circuit after threshold failures
 */

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Open circuit after N failures
  resetTimeout?: number; // Time before attempting half-open (ms)
  monitoringWindow?: number; // Time window for failure counting (ms)
  halfOpenMaxAttempts?: number; // Max attempts in half-open state
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitoringWindow: 60000, // 1 minute
  halfOpenMaxAttempts: 3,
};

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
  halfOpenAttempts: number;
}

/**
 * Circuit Breaker class
 */
export class CircuitBreaker {
  private state: CircuitBreakerState;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.state = {
      state: CircuitState.CLOSED,
      failures: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
      halfOpenAttempts: 0,
    };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.updateState();

    if (this.state.state === CircuitState.OPEN) {
      throw new Error('Circuit breaker is OPEN. Service unavailable.');
    }

    if (this.state.state === CircuitState.HALF_OPEN) {
      this.state.halfOpenAttempts++;
      if (this.state.halfOpenAttempts > this.options.halfOpenMaxAttempts) {
        // Too many attempts in half-open, go back to open
        this.state.state = CircuitState.OPEN;
        this.state.nextAttemptTime = Date.now() + this.options.resetTimeout;
        throw new Error('Circuit breaker failed in HALF_OPEN state. Service unavailable.');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Update circuit breaker state based on time
   */
  private updateState(): void {
    const now = Date.now();

    // Reset failures if outside monitoring window
    if (
      this.state.lastFailureTime &&
      now - this.state.lastFailureTime > this.options.monitoringWindow
    ) {
      this.state.failures = 0;
    }

    // Transition from OPEN to HALF_OPEN if reset timeout passed
    if (
      this.state.state === CircuitState.OPEN &&
      this.state.nextAttemptTime &&
      now >= this.state.nextAttemptTime
    ) {
      this.state.state = CircuitState.HALF_OPEN;
      this.state.halfOpenAttempts = 0;
      this.state.nextAttemptTime = null;
    }

    // Transition from HALF_OPEN to CLOSED if no failures
    if (
      this.state.state === CircuitState.HALF_OPEN &&
      this.state.halfOpenAttempts === 0 &&
      !this.state.lastFailureTime
    ) {
      this.state.state = CircuitState.CLOSED;
      this.state.failures = 0;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state.state === CircuitState.HALF_OPEN) {
      // Success in half-open means service recovered
      this.state.state = CircuitState.CLOSED;
      this.state.failures = 0;
      this.state.halfOpenAttempts = 0;
      this.state.lastFailureTime = null;
    } else if (this.state.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.state.failures = 0;
      this.state.lastFailureTime = null;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = Date.now();

    // Reset failures if outside monitoring window
    if (
      this.state.lastFailureTime &&
      now - this.state.lastFailureTime > this.options.monitoringWindow
    ) {
      this.state.failures = 0;
    }

    this.state.failures++;
    this.state.lastFailureTime = now;

    if (this.state.failures >= this.options.failureThreshold) {
      // Open circuit
      this.state.state = CircuitState.OPEN;
      this.state.nextAttemptTime = now + this.options.resetTimeout;
    } else if (this.state.state === CircuitState.HALF_OPEN) {
      // Failure in half-open, go back to open
      this.state.state = CircuitState.OPEN;
      this.state.nextAttemptTime = now + this.options.resetTimeout;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    this.updateState();
    return this.state.state;
  }

  /**
   * Get current statistics
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    lastFailureTime: number | null;
    nextAttemptTime: number | null;
  } {
    this.updateState();
    return {
      state: this.state.state,
      failures: this.state.failures,
      lastFailureTime: this.state.lastFailureTime,
      nextAttemptTime: this.state.nextAttemptTime,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = {
      state: CircuitState.CLOSED,
      failures: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
      halfOpenAttempts: 0,
    };
  }
}

/**
 * Create a circuit breaker instance
 */
export function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}
