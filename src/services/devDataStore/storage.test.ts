import { DEV_DATA_VERSION, STORAGE_KEY } from './constants';
import {
  clearDevDataMemoryState,
  loadDevDataState,
  saveDevDataState,
} from './storage';
import type { DevDataState } from './types';

const createState = (version = DEV_DATA_VERSION): DevDataState => ({
  version,
  projects: [],
  tasks: [],
  bids: [],
  expenses: [],
  subcontractors: [],
});

describe('dev data storage helpers', () => {
  beforeEach(() => {
    clearDevDataMemoryState();
    window.localStorage.clear();
  });

  it('seeds and persists data when storage is empty', () => {
    const seededState = createState();
    const seed = jest.fn(() => seededState);

    const state = loadDevDataState(seed);

    expect(state).toBe(seededState);
    expect(seed).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify(seededState)
    );
  });

  it('loads valid stored data without reseeding', () => {
    const storedState = createState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
    const seed = jest.fn(() => createState());

    const state = loadDevDataState(seed);

    expect(state).toEqual(storedState);
    expect(seed).not.toHaveBeenCalled();
  });

  it('reseeds when stored data has an old version', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createState(1)));
    const seededState = createState();
    const seed = jest.fn(() => seededState);

    const state = loadDevDataState(seed);

    expect(state).toBe(seededState);
    expect(seed).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')).toEqual(
      seededState
    );
  });

  it('updates localStorage and memory when saving state', () => {
    const savedState = createState();

    saveDevDataState(savedState);

    expect(loadDevDataState(jest.fn(() => createState()))).toBe(savedState);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify(savedState)
    );
  });
});
