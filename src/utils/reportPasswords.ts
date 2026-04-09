interface VerifyStoredReportPasswordOptions {
  inputPassword?: string;
  storedPasswordHash?: string;
  legacyPassword?: string;
}

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

export const hashReportPassword = async (password: string): Promise<string> => {
  const subtleCrypto = globalThis.crypto?.subtle;

  if (!subtleCrypto) {
    throw new Error('Web Crypto API is unavailable');
  }

  const encodedPassword = new TextEncoder().encode(password);
  const digest = await subtleCrypto.digest('SHA-256', encodedPassword);

  return toHex(digest);
};

export const verifyStoredReportPassword = async ({
  inputPassword,
  storedPasswordHash,
  legacyPassword,
}: VerifyStoredReportPasswordOptions): Promise<boolean> => {
  if (!inputPassword) {
    return false;
  }

  if (storedPasswordHash) {
    return (await hashReportPassword(inputPassword)) === storedPasswordHash;
  }

  if (legacyPassword) {
    return legacyPassword === inputPassword;
  }

  return false;
};
