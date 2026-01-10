// Simple logger utility

export interface LoggerType {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  log: (message: string, ...args: any[]) => void;
}

const logger: LoggerType = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  log: (message: string, ...args: any[]) => {
    console.log(`[LOG] ${message}`, ...args);
  },
};

// Audio logger for audio-specific logging
export const audioLogger: LoggerType = {
  info: (message: string, ...args: any[]) => {
    console.log(`[AUDIO INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[AUDIO ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[AUDIO WARN] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[AUDIO DEBUG] ${message}`, ...args);
    }
  },
  log: (message: string, ...args: any[]) => {
    console.log(`[AUDIO LOG] ${message}`, ...args);
  },
};

export { logger };
export default logger;
