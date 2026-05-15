import React from 'react';

const CHUNK_RELOAD_ATTEMPT_KEY = 'builderbrain:chunk-reload-attempted';

export const isRecoverableChunkLoadError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error || '');
  const name = error instanceof Error ? error.name : '';
  const text = `${name} ${message}`.toLowerCase();

  return (
    text.includes('chunkloaderror') ||
    text.includes('loading chunk') ||
    text.includes('failed to fetch dynamically imported module') ||
    text.includes('importing a module script failed')
  );
};

export const lazyWithReload = <T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) =>
  React.lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(CHUNK_RELOAD_ATTEMPT_KEY);
      }
      return module;
    } catch (error) {
      if (
        typeof window !== 'undefined' &&
        isRecoverableChunkLoadError(error) &&
        window.sessionStorage.getItem(CHUNK_RELOAD_ATTEMPT_KEY) !== 'true'
      ) {
        window.sessionStorage.setItem(CHUNK_RELOAD_ATTEMPT_KEY, 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => undefined);
      }

      throw error;
    }
  });
