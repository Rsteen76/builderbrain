import { logger, redactLogValue } from './logger';

describe('logger redaction', () => {
  it('redacts sensitive object fields', () => {
    expect(redactLogValue({
      uid: 'user-1',
      email: 'builder@example.com',
      nested: {
        shareId: 'abc123',
        label: 'safe',
      },
    })).toEqual({
      uid: '[redacted]',
      email: '[redacted]',
      nested: {
        shareId: '[redacted]',
        label: 'safe',
      },
    });
  });

  it('redacts email addresses from strings and errors', () => {
    expect(redactLogValue('Contact builder@example.com')).toBe('Contact [redacted-email]');
    expect(redactLogValue(new Error('Failed for builder@example.com'))).toEqual({
      name: 'Error',
      message: 'Failed for [redacted-email]',
    });
  });
});

describe('logger output', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnableClientLogs = process.env.REACT_APP_ENABLE_CLIENT_LOGS;

  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    delete process.env.REACT_APP_ENABLE_CLIENT_LOGS;
    window.localStorage.clear();
  });

  afterEach(() => {
    errorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;

    if (originalEnableClientLogs === undefined) {
      delete process.env.REACT_APP_ENABLE_CLIENT_LOGS;
    } else {
      process.env.REACT_APP_ENABLE_CLIENT_LOGS = originalEnableClientLogs;
    }

    window.localStorage.clear();
  });

  it('does not write production logs by default', () => {
    logger.error('Failed for builder@example.com', { uid: 'user-1' });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('redacts values before writing enabled production logs', () => {
    process.env.REACT_APP_ENABLE_CLIENT_LOGS = 'true';

    logger.error('Failed for builder@example.com', {
      uid: 'user-1',
      nested: { token: 'secret-token', label: 'safe' },
    });

    expect(errorSpy).toHaveBeenCalledWith('Failed for [redacted-email]', {
      uid: '[redacted]',
      nested: { token: '[redacted]', label: 'safe' },
    });
  });
});
