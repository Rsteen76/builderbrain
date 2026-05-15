import { isRecoverableChunkLoadError } from './lazyWithReload';

describe('lazyWithReload', () => {
  test('identifies route chunk load failures as recoverable', () => {
    expect(isRecoverableChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true);
    expect(isRecoverableChunkLoadError(Object.assign(new Error('Loading chunk 123 failed'), {
      name: 'ChunkLoadError',
    }))).toBe(true);
    expect(isRecoverableChunkLoadError(new Error('permission denied'))).toBe(false);
  });
});
