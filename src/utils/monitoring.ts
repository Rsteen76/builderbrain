import { logger, redactLogValue } from './logger';

type ErrorReportContext = Record<string, unknown> & {
  source?: string;
};

type ErrorPayload = {
  app: string;
  context: unknown;
  error: {
    message: string;
    name: string;
    stack?: string;
  };
  timestamp: string;
  url?: string;
  userAgent?: string;
};

const ERROR_REPORT_URL = process.env.REACT_APP_ERROR_REPORT_URL?.trim();

let initialized = false;

const normalizeError = (error: unknown): ErrorPayload['error'] => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown client error',
    name: 'NonErrorException',
  };
};

const buildPayload = (error: unknown, context: ErrorReportContext = {}): ErrorPayload => ({
  app: 'builderbrain-web',
  context: redactLogValue(context),
  error: redactLogValue(normalizeError(error)) as ErrorPayload['error'],
  timestamp: new Date().toISOString(),
  url: typeof window === 'undefined' ? undefined : window.location.href,
  userAgent: typeof navigator === 'undefined' ? undefined : navigator.userAgent,
});

const postPayload = (payload: ErrorPayload): void => {
  if (!ERROR_REPORT_URL || typeof window === 'undefined') {
    return;
  }

  const body = JSON.stringify(payload);

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const sent = navigator.sendBeacon(
        ERROR_REPORT_URL,
        new Blob([body], { type: 'application/json' })
      );

      if (sent) {
        return;
      }
    }

    void fetch(ERROR_REPORT_URL, {
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      method: 'POST',
    }).catch(() => undefined);
  } catch {
    // Monitoring must never create a second user-facing failure.
  }
};

export const captureException = (error: unknown, context: ErrorReportContext = {}): void => {
  const payload = buildPayload(error, context);

  logger.error('[monitoring] client error', payload);
  postPayload(payload);
};

export const initMonitoring = (): void => {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('error', (event) => {
    captureException(event.error ?? event.message, {
      colno: event.colno,
      filename: event.filename,
      lineno: event.lineno,
      source: 'window.error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, {
      source: 'window.unhandledrejection',
    });
  });

  initialized = true;
};
