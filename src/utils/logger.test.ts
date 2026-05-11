import { redactLogValue } from './logger';

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
