import { useCallback, useEffect, useRef, useState } from 'react';

export interface ConsoleEntry {
  id: string;
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: any[];
}

/**
 * Hook for capturing console logs and errors in real-time
 */
export function useConsoleLogs(maxLogs: number = 100): { logs: ConsoleEntry[]; clearLogs: () => void } {
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const logsRef = useRef<ConsoleEntry[]>([]);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    const captureLog = (level: 'log' | 'info' | 'warn' | 'error' | 'debug', ...args: any[]) => {
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        level,
        message: args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' '),
        args,
      };

      logsRef.current = [entry, ...logsRef.current].slice(0, maxLogs);
      // Defer setLogs to avoid calling setState during render phase
      queueMicrotask(() => {
        setLogs([...logsRef.current]);
      });
    };

    // Override console methods
    console.log = (...args) => {
      originalLog(...args);
      captureLog('log', ...args);
    };

    console.error = (...args) => {
      // Filter out known benign errors from third-party scripts
      const errorMessage = args.join(' ');
      const ignoredErrors = [
        'Cannot listen to the event from the provided iframe',
        'contentWindow is not available',
        'ResizeObserver loop',
        'Script error.',
        'CacheBuster',
        'Asset failed to load',
        'tradingview.com',
        'embed-widget',
      ];
      
      const shouldIgnore = ignoredErrors.some(ignored => 
        errorMessage.toLowerCase().includes(ignored.toLowerCase())
      );
      
      if (!shouldIgnore) {
        originalError(...args);
        captureLog('error', ...args);
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      captureLog('warn', ...args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      captureLog('info', ...args);
    };

    console.debug = (...args) => {
      originalDebug(...args);
      captureLog('debug', ...args);
    };

    // Capture uncaught errors
    const handleError = (event: ErrorEvent) => {
      captureLog('error', `${event.error?.name || 'Error'}: ${event.error?.message || event.message}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureLog('error', `Unhandled Promise Rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Restore original console methods on cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.debug = originalDebug;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [maxLogs]);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
  }, []);

  return { logs, clearLogs };
}
