type LogMethod = 'debug' | 'error' | 'info' | 'log' | 'warn';

const DEBUG_STORAGE_KEY = 'builderbrain:debugLogs';

const isLoggingEnabled = (): boolean => {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (process.env.REACT_APP_ENABLE_CLIENT_LOGS === 'true') {
    return true;
  }

  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(DEBUG_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const write = (method: LogMethod, args: unknown[]): void => {
  if (!isLoggingEnabled()) {
    return;
  }

  const sink = globalThis.console;
  const logMethod = sink?.[method] ?? sink?.log;

  if (typeof logMethod === 'function') {
    logMethod.apply(sink, args);
  }
};

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  error: (...args: unknown[]) => write('error', args),
  info: (...args: unknown[]) => write('info', args),
  log: (...args: unknown[]) => write('log', args),
  warn: (...args: unknown[]) => write('warn', args),
};
