/**
 * Structured logging utility
 * Supports different log levels and structured output
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentIndex = levels.indexOf(this.minLevel);
    const logIndex = levels.indexOf(level);
    return logIndex >= currentIndex;
  }

  /**
   * Format log entry as JSON
   */
  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    }
    // Pretty print in development
    return JSON.stringify(entry, null, 2);
  }

  /**
   * Write log entry
   */
  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formatted = this.formatLog(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }

    // In production, send to external logging service (Sentry, DataDog, etc.)
    if (process.env.NODE_ENV === 'production' && entry.level >= LogLevel.ERROR) {
      // TODO: Send to Sentry or other logging service
      // if (process.env.SENTRY_DSN) {
      //   Sentry.captureException(entry.error);
      // }
    }
  }

  /**
   * Create log entry with context
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    // Extract context fields
    if (context) {
      if (context.requestId) {
        entry.requestId = String(context.requestId);
      }
      if (context.userId) {
        entry.userId = String(context.userId);
      }
      if (context.sessionId) {
        entry.sessionId = String(context.sessionId);
      }
    }

    return entry;
  }

  debug(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    this.writeLog(this.createEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    this.writeLog(this.createEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog(this.createEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.writeLog(this.createEntry(LogLevel.ERROR, message, context, error));
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.writeLog(this.createEntry(LogLevel.FATAL, message, context, error));
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Create singleton logger instance
export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
);
