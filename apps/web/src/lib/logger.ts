/**
 * Frontend Logger Utility
 * Provides debug logging that can be disabled in production
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';

    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;

    if (typeof window !== 'undefined') {
      const storedLevel = localStorage.getItem('LOG_LEVEL');
      if (storedLevel && !isNaN(Number(storedLevel))) {
        this.logLevel = Number(storedLevel) as LogLevel;
        console.log(`[Logger] Using stored log level: ${LogLevel[this.logLevel]}`);
      }
    }

    if (this.isDevelopment && typeof window !== 'undefined') {
      console.log(
        `[Logger] Initialized in DEVELOPMENT mode, log level: ${LogLevel[this.logLevel]}`
      );
    }
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
    if (typeof window !== 'undefined') {
      localStorage.setItem('LOG_LEVEL', level.toString());
    }
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  debug(context: string, message: string, ...args: any[]) {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG][${context}] ${message}`, ...args);
    }
  }

  info(context: string, message: string, ...args: any[]) {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[INFO][${context}] ${message}`, ...args);
    }
  }

  warn(context: string, message: string, ...args: any[]) {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN][${context}] ${message}`, ...args);
    }
  }

  error(context: string, message: string, ...args: any[]) {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR][${context}] ${message}`, ...args);
    }
  }

  group(context: string, label: string) {
    if (this.logLevel <= LogLevel.DEBUG && this.isDevelopment) {
      console.group(`[${context}] ${label}`);
    }
  }

  groupEnd() {
    if (this.logLevel <= LogLevel.DEBUG && this.isDevelopment) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();

export function enableDebugLogs() {
  logger.setLogLevel(LogLevel.DEBUG);
  console.log('✅ Debug logging enabled');
}

export function disableDebugLogs() {
  logger.setLogLevel(LogLevel.WARN);
  console.log('✅ Debug logging disabled');
}

// Expose to window for runtime control
if (typeof window !== 'undefined') {
  (window as any).enableDebugLogs = enableDebugLogs;
  (window as any).disableDebugLogs = disableDebugLogs;
  (window as any).logger = logger;
}
