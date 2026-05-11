type LogMethod = 'debug' | 'error' | 'info' | 'log' | 'warn';

const DEBUG_STORAGE_KEY = 'builderbrain:debugLogs';
const SENSITIVE_KEY_PATTERN = /email|password|token|secret|shareid|uid|userid|phone/i;

const redactString = (value: string): string => (
  value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
);

export const redactLogValue = (value: unknown, depth = 0): unknown => {
  if (depth > 4) {
    return '[redacted-depth]';
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
    };
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => redactLogValue(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : redactLogValue(entryValue, depth + 1),
    ])
  );
};

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
  const safeArgs = args.map(arg => redactLogValue(arg));

  if (typeof logMethod === 'function') {
    logMethod.apply(sink, safeArgs);
  }
};

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  error: (...args: unknown[]) => write('error', args),
  info: (...args: unknown[]) => write('info', args),
  log: (...args: unknown[]) => write('log', args),
  warn: (...args: unknown[]) => write('warn', args),
};
