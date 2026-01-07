/**
 * Production-Safe Logger Utility
 * Replaces all console.log statements with environment-aware logging
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LogConfig {
  enabled: boolean;
  levels: LogLevel[];
  prefix?: string;
}

class Logger {
  private config: LogConfig;

  constructor(config?: Partial<LogConfig>) {
    const isDev = process.env.NODE_ENV === 'development';

    this.config = {
      enabled: isDev,
      levels: isDev ? ['log', 'warn', 'error', 'info', 'debug'] : ['error'],
      prefix: config?.prefix || '[BullMoney]',
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && this.config.levels.includes(level);
  }

  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    const timestamp = new Date().toISOString();
    return [`${this.config.prefix} [${level.toUpperCase()}] ${timestamp}`, ...args];
  }

  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...this.formatMessage('log', ...args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  error(...args: any[]): void {
    // Always log errors, even in production
    console.error(...this.formatMessage('error', ...args));
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', ...args));
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', ...args));
    }
  }

  /**
   * Group logs together (only in dev)
   */
  group(label: string, callback: () => void): void {
    if (this.shouldLog('log')) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Time execution (only in dev)
   */
  time(label: string): void {
    if (this.shouldLog('debug')) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('debug')) {
      console.timeEnd(label);
    }
  }

  /**
   * Table output (only in dev)
   */
  table(data: any): void {
    if (this.shouldLog('log')) {
      console.table(data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export named loggers for specific modules
export const audioLogger = new Logger({ prefix: '[AudioEngine]' });
export const optimizationLogger = new Logger({ prefix: '[Optimizations]' });
export const storageLogger = new Logger({ prefix: '[SmartStorage]' });
export const swLogger = new Logger({ prefix: '[ServiceWorker]' });
export const performanceLogger = new Logger({ prefix: '[Performance]' });

export default logger;
