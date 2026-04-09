import { TextEncoder } from 'util';
import { hashReportPassword, verifyStoredReportPassword } from './reportPasswords';

describe('reportPasswords', () => {
  const originalCrypto = globalThis.crypto;
  const originalTextEncoder = globalThis.TextEncoder;

  const installDigestMock = () => {
    const digest = jest.fn().mockImplementation(async (_algorithm: string, data: BufferSource) => {
      const bytes = Array.from(new Uint8Array(data as ArrayBufferLike));
      return Uint8Array.from([
        bytes.length,
        bytes[0] ?? 0,
        bytes[bytes.length - 1] ?? 0,
      ]).buffer;
    });

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        subtle: {
          digest,
        },
      },
    });

    return digest;
  };

  beforeAll(() => {
    Object.defineProperty(globalThis, 'TextEncoder', {
      configurable: true,
      value: TextEncoder,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'TextEncoder', {
      configurable: true,
      value: originalTextEncoder,
    });
  });

  it('hashes shared report passwords before storage', async () => {
    installDigestMock();

    await expect(hashReportPassword('demo-password')).resolves.toBe('0d6464');
  });

  it('verifies hashed passwords without exposing the raw value', async () => {
    installDigestMock();

    await expect(
      verifyStoredReportPassword({
        inputPassword: 'demo-password',
        storedPasswordHash: '0d6464',
      })
    ).resolves.toBe(true);

    await expect(
      verifyStoredReportPassword({
        inputPassword: 'wrong-password',
        storedPasswordHash: '0d6464',
      })
    ).resolves.toBe(false);
  });

  it('still accepts legacy plaintext passwords during migration', async () => {
    await expect(
      verifyStoredReportPassword({
        inputPassword: 'demo-password',
        legacyPassword: 'demo-password',
      })
    ).resolves.toBe(true);
  });
});
