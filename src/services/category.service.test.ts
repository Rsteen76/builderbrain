import {
  addCategoryMapping,
  addCategoryMappingBatch,
  autoAssignCategory,
  getCategories,
  getCategoryForItem,
  getCategoryMappingsForProject,
  getMainCategories,
  getProjectCategorySystem,
  getSubcategoriesForParent,
  initializeCategories,
  saveCategoryMapping,
  updateProjectCategorySystem,
} from './category.service';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getAllCategories } from '../data/hierarchicalCategories';
import { DEFAULT_CATEGORY_MAPPINGS } from '../utils/categoryMappingUtils';

const mockCategories = [
  {
    id: 'labor',
    name: 'Labor',
    level: 'main',
  },
  {
    id: 'framing-labor',
    name: 'Framing Labor',
    parentId: 'labor',
    level: 'sub',
  },
];

jest.mock('../config/firebase', () => ({
  db: { type: 'mock-db' },
}));

jest.mock('../config/devMode', () => ({
  isDevAuthBypassEnabled: false,
}));

jest.mock('../data/hierarchicalCategories', () => ({
  getAllCategories: jest.fn(() => mockCategories),
}));

jest.mock('../utils/categoryMappingUtils', () => ({
  DEFAULT_CATEGORY_MAPPINGS: {
    Materials: 'materials',
    Labor: 'labor',
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    log: jest.fn(),
  },
}));

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  commit: jest.fn(),
};

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((_db, name) => ({ type: 'collection', name })),
  doc: jest.fn((...parts) => ({ type: 'doc', parts, id: parts[parts.length - 1] })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((...parts) => ({ type: 'query', parts })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  writeBatch: jest.fn(() => mockBatch),
  Timestamp: {
    now: jest.fn(() => ({ type: 'timestamp-now' })),
  },
}));

const mockedGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockedGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockedAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockedUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockedSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;

const makeDocSnapshot = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  ref: { type: 'doc-ref', id },
  exists: () => exists,
  data: () => data,
});

const makeQuerySnapshot = (docs: Array<ReturnType<typeof makeDocSnapshot>>) => ({
  empty: docs.length === 0,
  docs,
});

describe('category.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch.set.mockClear();
    mockBatch.update.mockClear();
    mockBatch.commit.mockResolvedValue(undefined);
  });

  test('initializes default categories only when the collection is empty', async () => {
    mockedGetDocs.mockResolvedValueOnce(makeQuerySnapshot([]) as any);

    await initializeCategories();

    expect(collection).toHaveBeenCalledWith(expect.anything(), 'categories');
    expect(writeBatch).toHaveBeenCalled();
    expect(mockBatch.set).toHaveBeenCalledTimes(mockCategories.length);
    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'labor' }),
      expect.objectContaining({
        id: 'labor',
        name: 'Labor',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
    expect(mockBatch.commit).toHaveBeenCalled();

    mockedGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([makeDocSnapshot('existing', { name: 'Existing' })]) as any
    );
    await initializeCategories();

    expect(mockBatch.set).toHaveBeenCalledTimes(mockCategories.length);
  });

  test('reads categories from Firestore and falls back to defaults when empty', async () => {
    mockedGetDocs.mockResolvedValueOnce(makeQuerySnapshot([]) as any);

    await expect(getCategories()).resolves.toEqual(mockCategories);

    mockedGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([makeDocSnapshot('custom', { name: 'Custom', level: 'main' })]) as any
    );

    await expect(getCategories()).resolves.toEqual([
      {
        id: 'custom',
        name: 'Custom',
        level: 'main',
      },
    ]);
  });

  test('queries main categories and child subcategories', async () => {
    mockedGetDocs
      .mockResolvedValueOnce(
        makeQuerySnapshot([makeDocSnapshot('labor', { name: 'Labor', level: 'main' })]) as any
      )
      .mockResolvedValueOnce(
        makeQuerySnapshot([
          makeDocSnapshot('framing-labor', { name: 'Framing Labor', parentId: 'labor', level: 'sub' }),
        ]) as any
      );

    await expect(getMainCategories()).resolves.toEqual([
      {
        id: 'labor',
        name: 'Labor',
        level: 'main',
      },
    ]);
    await expect(getSubcategoriesForParent('labor')).resolves.toEqual([
      {
        id: 'framing-labor',
        name: 'Framing Labor',
        parentId: 'labor',
        level: 'sub',
      },
    ]);

    expect(where).toHaveBeenCalledWith('level', '==', 'main');
    expect(where).toHaveBeenCalledWith('parentId', '==', 'labor');
    expect(query).toHaveBeenCalled();
  });

  test('updates an existing item category mapping or creates a new one', async () => {
    mockedGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([
        makeDocSnapshot('mapping-1', {
          itemId: 'expense-1',
          categoryId: 'old-category',
          autoAssigned: false,
        }),
      ]) as any
    );

    await expect(
      addCategoryMapping('expense-1', 'Materials', 'materials-lumber', 'project-1', 'user-1', true)
    ).resolves.toBe('mapping-1');
    expect(mockedUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'mapping-1' }),
      expect.objectContaining({
        categoryId: 'materials-lumber',
        autoAssigned: true,
        updatedAt: expect.any(Date),
      })
    );

    mockedGetDocs.mockResolvedValueOnce(makeQuerySnapshot([]) as any);
    mockedAddDoc.mockResolvedValueOnce({ id: 'mapping-2' } as any);

    await expect(
      addCategoryMapping('expense-2', 'Labor', 'labor-framing', 'project-1')
    ).resolves.toBe('mapping-2');
    expect(mockedAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      itemId: 'expense-2',
      categoryId: 'labor-framing',
      projectId: 'project-1',
      userId: 'current-user',
      autoAssigned: false,
    }));

    mockedGetDocs.mockRejectedValueOnce(new Error('firestore down'));
    await expect(
      addCategoryMapping('expense-3', 'Labor', 'labor-framing', 'project-1')
    ).resolves.toBe('');
  });

  test('gets an item category mapping and handles unmapped or missing categories', async () => {
    mockedGetDocs.mockResolvedValueOnce(makeQuerySnapshot([]) as any);

    await expect(getCategoryForItem('expense-1')).resolves.toEqual({
      categoryId: 'uncategorized',
      category: null,
      isAutoAssigned: true,
    });

    mockedGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([
        makeDocSnapshot('mapping-1', {
          itemId: 'expense-2',
          categoryId: 'labor',
          autoAssigned: false,
        }),
      ]) as any
    );
    mockedGetDoc.mockResolvedValueOnce(
      makeDocSnapshot('labor', { name: 'Labor', level: 'main' }) as any
    );

    await expect(getCategoryForItem('expense-2')).resolves.toEqual({
      categoryId: 'labor',
      category: {
        id: 'labor',
        name: 'Labor',
        level: 'main',
      },
      isAutoAssigned: false,
    });
  });

  test('loads and saves project-level category mappings', async () => {
    mockedGetDoc.mockResolvedValueOnce(
      makeDocSnapshot('project-1', {
        categoryMappings: {
          Materials: 'custom-materials',
        },
      }) as any
    );

    await expect(getCategoryMappingsForProject('project-1')).resolves.toEqual({
      Materials: 'custom-materials',
    });

    mockedGetDoc.mockResolvedValueOnce(makeDocSnapshot('project-2', {}, false) as any);
    await expect(getCategoryMappingsForProject('project-2')).resolves.toEqual(DEFAULT_CATEGORY_MAPPINGS);
    expect(mockedSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'project-2' }),
      expect.objectContaining({ categoryMappings: DEFAULT_CATEGORY_MAPPINGS }),
      { merge: true }
    );

    mockedGetDoc.mockResolvedValueOnce(makeDocSnapshot('project-1', { categoryMappings: {} }) as any);
    await saveCategoryMapping('project-1', 'Labor', 'labor-framing');
    expect(mockedUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'project-1' }),
      expect.objectContaining({ 'categoryMappings.Labor': 'labor-framing' })
    );

    mockedGetDoc.mockResolvedValueOnce(makeDocSnapshot('project-3', {}, false) as any);
    await saveCategoryMapping('project-3', 'Materials', 'materials-lumber');
    expect(mockedSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'project-3' }),
      expect.objectContaining({ categoryMappings: { Materials: 'materials-lumber' } })
    );
  });

  test('merges batch mappings and manages project category system preference', async () => {
    mockedGetDoc.mockResolvedValueOnce(
      makeDocSnapshot('project-1', {
        categoryMappings: {
          Materials: 'materials',
        },
      }) as any
    );

    await addCategoryMappingBatch('project-1', { Labor: 'labor-framing' });
    expect(mockedUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'project-1' }),
      expect.objectContaining({
        categoryMappings: {
          Materials: 'materials',
          Labor: 'labor-framing',
        },
      })
    );

    mockedGetDoc.mockResolvedValueOnce(makeDocSnapshot('project-2', {}, false) as any);
    await addCategoryMappingBatch('project-2', { Permits: 'permits' });
    expect(mockedSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'project-2' }),
      expect.objectContaining({ categoryMappings: { Permits: 'permits' } })
    );

    mockedGetDoc
      .mockResolvedValueOnce(makeDocSnapshot('project-1', { categorySystem: 'enhanced' }) as any)
      .mockResolvedValueOnce(makeDocSnapshot('project-2', { categorySystem: 'legacy' }) as any)
      .mockRejectedValueOnce(new Error('not found'));

    await expect(getProjectCategorySystem('project-1')).resolves.toBe('enhanced');
    await expect(getProjectCategorySystem('project-2')).resolves.toBe('legacy');
    await expect(getProjectCategorySystem('project-3')).resolves.toBe('legacy');

    await updateProjectCategorySystem('project-1', 'enhanced');
    expect(mockedUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'project-1' }),
      expect.objectContaining({ categorySystem: 'enhanced' })
    );
  });

  test('auto-assigns uncategorized expenses in batches', async () => {
    mockedGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([
        makeDocSnapshot('expense-1', { categoryId: null }),
        makeDocSnapshot('expense-2', { categoryId: 'materials' }),
        makeDocSnapshot('expense-3', {}),
      ]) as any
    );

    await autoAssignCategory('project-1');

    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'expense-1' }),
      expect.objectContaining({ categoryId: 'CATEGORY_ID' })
    );
    expect(mockBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'expense-3' }),
      expect.objectContaining({ categoryId: 'CATEGORY_ID' })
    );
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});
