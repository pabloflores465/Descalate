/**
 * Logger service for consistent logging across the app.
 * In development, logs are shown in the console.
 * In production, logs can be sent to a logging service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const config: LoggerConfig = {
  enabled: __DEV__,
  minLevel: __DEV__ ? 'debug' : 'warn',
};

function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.log(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(formatMessage('warn', message, context));
    }
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorContext = error instanceof Error
        ? { ...context, errorName: error.name, stack: error.stack }
        : { ...context, error: errorMessage };
      // eslint-disable-next-line no-console
      console.error(formatMessage('error', message, errorContext));
    }
  },
};

export default logger;
