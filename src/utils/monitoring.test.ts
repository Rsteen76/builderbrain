describe('monitoring', () => {
  const originalErrorReportUrl = process.env.REACT_APP_ERROR_REPORT_URL;
  const originalFetch = globalThis.fetch;

  let sendBeaconMock: jest.Mock;
  let fetchMock: jest.Mock;

  const loadMonitoring = (): typeof import('./monitoring') => {
    jest.resetModules();
    return require('./monitoring');
  };

  const readBlob = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });

  beforeEach(() => {
    sendBeaconMock = jest.fn(() => true);
    fetchMock = jest.fn(() => Promise.resolve());

    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeaconMock,
    });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.REACT_APP_ERROR_REPORT_URL;
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();

    if (originalErrorReportUrl === undefined) {
      delete process.env.REACT_APP_ERROR_REPORT_URL;
    } else {
      process.env.REACT_APP_ERROR_REPORT_URL = originalErrorReportUrl;
    }

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: originalFetch,
    });
    jest.resetModules();
  });

  it('does not send reports when no reporting URL is configured', () => {
    const { captureException } = loadMonitoring();

    captureException(new Error('failed'));

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends redacted error reports to the configured endpoint', async () => {
    process.env.REACT_APP_ERROR_REPORT_URL = 'https://monitoring.example.test/client-errors';
    const { captureException } = loadMonitoring();

    captureException(new Error('Failed for builder@example.com'), {
      email: 'builder@example.com',
      source: 'test',
    });

    expect(sendBeaconMock).toHaveBeenCalledWith(
      'https://monitoring.example.test/client-errors',
      expect.any(Blob)
    );

    const body = await readBlob(sendBeaconMock.mock.calls[0][1] as Blob);
    expect(JSON.parse(body)).toEqual(expect.objectContaining({
      app: 'builderbrain-web',
      context: {
        email: '[redacted]',
        source: 'test',
      },
      error: expect.objectContaining({
        message: 'Failed for [redacted-email]',
        name: 'Error',
      }),
      timestamp: expect.any(String),
      url: expect.any(String),
      userAgent: expect.any(String),
    }));
  });

  it('falls back to fetch when sendBeacon cannot queue the report', () => {
    process.env.REACT_APP_ERROR_REPORT_URL = 'https://monitoring.example.test/client-errors';
    sendBeaconMock.mockReturnValue(false);
    const { captureException } = loadMonitoring();

    captureException('plain failure');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://monitoring.example.test/client-errors',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        method: 'POST',
      })
    );
  });
});

export {};
