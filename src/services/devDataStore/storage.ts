import { DEV_DATA_VERSION, STORAGE_KEY } from './constants';
import type { DevDataState } from './types';

let memoryState: DevDataState | null = null;

const readStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStorage = (state: DevDataState) => {
  memoryState = state;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage failures in dev mode and fall back to memory.
  }
};

export const clearDevDataMemoryState = () => {
  memoryState = null;
};

export const loadDevDataState = (createSeedState: () => DevDataState): DevDataState => {
  if (memoryState) {
    return memoryState;
  }

  const raw = readStorage();
  if (!raw) {
    const seeded = createSeedState();
    writeStorage(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as DevDataState;
    if (parsed.version !== DEV_DATA_VERSION) {
      const reseeded = createSeedState();
      writeStorage(reseeded);
      return reseeded;
    }
    memoryState = parsed;
    return parsed;
  } catch {
    const reseeded = createSeedState();
    writeStorage(reseeded);
    return reseeded;
  }
};

export const saveDevDataState = (state: DevDataState) => {
  writeStorage(state);
};
